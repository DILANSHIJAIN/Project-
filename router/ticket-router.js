const express = require("express");

const router = express.Router();

const Ticket = require("../models/ticket-modal");
const SLA = require("../models/sla-model");

const { generateTicketData, categorizeTicket, predictPriority } = require("../utils/ai");
const { performWebSearch } = require("../utils/search");
const authMiddleware = require("../middlewares/auth-middleware");
const { createSLA } = require("../controllers/sla-controller");
const { createNotification } = require("../controllers/notification-controller");
const { generateDailyAnalytics } = require("../controllers/analytics-controller");
const rbacMiddleware = require("../middlewares/rbac-middleware");
const { sendTicketEmail } = require("../utils/mailer");

// GET ALL TICKETS
// Restricted to Admins only
router.get("/", authMiddleware, rbacMiddleware("admin"), async (req, res) => {
  try {
    // Sort by newest first so the latest AI generation is at the top
    const tickets = await Ticket.find().sort({ createdAt: -1 });
    if (!tickets || tickets.length === 0) {
      return res.status(200).json([]); // Return empty array instead of 404
    }
    return res.status(200).json(tickets);
  } catch (error) {
    console.error("❌ Error fetching tickets:", error.message);
    return res.status(500).json({
      message: "Server Error",
      details: error.message,
    });
  }
});

// GET TICKETS BY PROJECT
// This allows you to view all tickets linked to a specific project ID
router.get("/project/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    const tickets = await Ticket.find({ projectId });
    return res.status(200).json(tickets);
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching tickets for this project",
    });
  }
});

// GET TICKETS FOR THE AUTHENTICATED USER
// This allows the logged-in user to view their own ticket history
router.get("/user", authMiddleware, async (req, res) => {
  try {
    // Filter tickets by the authenticated user's ID
    const userId = req.user._id;
    const tickets = await Ticket.find({ userId }).sort({ createdAt: -1 });

    if (!tickets || tickets.length === 0) {
      return res.status(200).json([]);
    }
    
    return res.status(200).json(tickets);
  } catch (error) {
    console.error("❌ Error fetching user tickets:", error.message);
    return res.status(500).json({
      message: "Server Error",
      details: error.message,
    });
  }
});

router.post("/", authMiddleware, async (req, res) => {

  try {
    // 1. SEARCH FOR SIMILAR PREVIOUS RESOLUTIONS
    let previousResolutions = "";

    // 1a. CHECK FOR TICKET STATUS QUERIES (Feature 6)
    const statusMatch = req.body.query.match(/(?:status|update|check|happening|about).*?(?:ticket|complaint)?.*?(\w{20,})/i);
    if (statusMatch) {
        const ticketId = statusMatch[1];
        const existingTicket = await Ticket.findOne({ _id: ticketId, userId: req.user._id });
        if (existingTicket) {
            return res.status(200).json({
                message: "Status Update",
                aiResult: `🔍 I found your ticket **#${ticketId}**. \n\n**Status:** ${existingTicket.status}\n**Category:** ${existingTicket.category}\n**Update:** Our team is currently working on this.`,
                ticketSaved: false,
            });
        }
    }

    // 1b. SENTIMENT ANALYSIS & ESCALATION (Feature 7)
    const frustrationKeywords = ["frustrated", "angry", "terrible", "nobody helps", "worst", "slow support", "waiting too long"];
    const isFrustrated = frustrationKeywords.some(kw => req.body.query.toLowerCase().includes(kw));
    
    try {
      const stopWords = new Set(["there", "their", "about", "would", "could", "should"]);
      const keywords = req.body.query.split(" ").filter(w => w.length > 4 && !stopWords.has(w.toLowerCase()));
      if (keywords.length > 0) {
        const similar = await Ticket.find({
          $or: keywords.map(k => ({ aiSummary: { $regex: k, $options: "i" } }))
        }).limit(2);
        
        previousResolutions = similar.map(t => 
          `Problem: ${t.title} | Solution: ${t.aiSummary}`
        ).join("\n");
      }
    } catch (searchError) {
      console.error("Similarity search failed:", searchError.message);
    }

    // 1c. REFINED WEB SEARCH TRIGGER (Checks if query is informational or a question)
    let webSearchResults = "";
    const infoRegex = /^(what|how|why|when|where|who|meaning|latest|news|guide|help with|tell me about)/i;
    const isInformational = infoRegex.test(req.body.query) || req.body.query.trim().endsWith("?");

    // Only search if it's informational
    if (isInformational) {
        console.log("🔍 Query detected as informational. Performing Google Search...");
        webSearchResults = await performWebSearch(req.body.query);
    }

    // 1d. CONTEXT PREPARATION (Maintaining Session State)
    const conversationContext = req.body.chatHistory
      ? req.body.chatHistory.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n")
      : "";

    // AI GENERATION WITH STRUCTURED CONTEXT
    let aiResult;
    try {
      const systemInstructions = `
You are AI Helpdesk. Strictly follow these rules:
- **CONCISE**: Use bullet points. No long paragraphs.
- **WORD LIMIT**: Max 50 words per response unless detailed explanation is requested.
- **GATHER DATA**: Collect Name, Contact, Locality, Description, Timing. Photos/Images are optional unless specified as required by category.
- **REQUIRED BEFORE TICKET**: Always collect the **Platform Name** (the platform/product/website/app the issue is about), a **Contact Email**, and the **Source URL** (the exact URL/page where the issue happened). If any of these is missing, ask for it before creating the ticket.
- **ENFORCE**: For the **Food** category, at least 2 photos are MANDATORY. You MUST NOT create a ticket or output [TICKET_START] until images are attached (look for "Attached Images").
- **PROGRESS**: Check history. If "Continue Troubleshooting" is selected, acknowledge previous steps failed and provide 2 NEW advanced alternatives. NEVER repeat.
- **ANALYSIS**: State "Likely Cause" only once. Troubleshooting steps must be ACTIONABLE fixes, not data gathering (e.g., "provide photos" is NOT a troubleshooting step).
- **DECISION**: Ask to resolve or "Create Support Ticket".

CATEGORY FIELDS (Add to gather data if relevant):
- Technical: Device, OS, Error.
- Billing: TransID, Amount.
- Infra: Type, Severity.
- Vehicle: Number, Issue Type (Service/Breakdown/Theft).
- Food: Platform, OrderID, Item, IssueType, Restaurant, Photos (Min 2, REQUIRED).
STYLE:
- Professional and analytical.
- Bullet points only for lists.
- **CURRENCY**: Always use ₹ (INR) for any price or amount mentioned.
`.trim();
      
      const combinedContext = `
${systemInstructions}

CONVERSATION HISTORY:
${conversationContext || "No previous history in this session."}

INTERNAL COMPANY RESOLUTIONS:
${previousResolutions || "No direct internal resolution found."}

GOOGLE WEB SEARCH DATA:
${webSearchResults || "No external data retrieved."}
`.trim();

      aiResult = await generateTicketData(req.body.query, combinedContext);
    } catch (aiError) {
      console.error("⚠️ AI API Call Failed:", aiError.message);
      aiResult = null; 
    }

    // Proceed even if AI failed, using fallbacks
    if (aiResult === null) {
      console.warn("⚠️ AI Service Unavailable. Proceeding with fallbacks.");
    }

    const parsedAiResult = {};
    let isTicketData = false;

    if (aiResult && aiResult.includes("[TICKET_START]")) {
      isTicketData = true;

      // Use regex to extract fields from the block, handling multi-line summaries correctly
      const titleMatch = aiResult.match(/Title\s*[:\-]\s*(.*?)(?=\n|$)/i);
      const categoryMatch = aiResult.match(/Category\s*[:\-]\s*(.*?)(?=\n|$)/i);
      const priorityMatch = aiResult.match(/Priority\s*[:\-]\s*(.*?)(?=\n|$)/i);
      const platformMatch = aiResult.match(/Platform\s*[:\-]\s*(.*?)(?=\n|$)/i);
      const contactEmailMatch = aiResult.match(/Contact\s*Email\s*[:\-]\s*(.*?)(?=\n|$)/i);
      const sourceUrlMatch = aiResult.match(/Source\s*URL\s*[:\-]\s*(.*?)(?=\n|$)/i);
      const summaryMatch = aiResult.match(/Summary\s*[:\-]\s*([\s\S]*?)(?=\[TICKET_END\]|$)/i);

      // Ignore unfilled placeholder values like "N/A" so we can fall back gracefully
      const cleanField = (val) => {
        const trimmed = (val || "").trim();
        return /^(n\/?a|none|not provided|-)?$/i.test(trimmed) ? "" : trimmed;
      };

      if (titleMatch) parsedAiResult.title = titleMatch[1].trim();
      if (categoryMatch) parsedAiResult.category = categoryMatch[1].trim();
      if (priorityMatch) parsedAiResult.priority = priorityMatch[1].trim();
      if (platformMatch) parsedAiResult.platform = cleanField(platformMatch[1]);
      if (contactEmailMatch) parsedAiResult.contactEmail = cleanField(contactEmailMatch[1]);
      if (sourceUrlMatch) parsedAiResult.sourceUrl = cleanField(sourceUrlMatch[1]);
      if (summaryMatch) parsedAiResult.summary = summaryMatch[1].trim();

      // Hard Enforcement: Block Food tickets without at least 2 photos
      const activeCategory = req.body.category || parsedAiResult.category || "General";
      if (activeCategory === "Food") {
        // Check current query and history for image paths
        // Ensure we are mapping the content that includes image paths (aiContent)
        const historyContent = req.body.chatHistory ? req.body.chatHistory.map(m => m.aiContent || m.content).join(" ") : "";
        const fullConversation = (req.body.query || "") + " " + historyContent;
        
        console.log("DEBUG: Full conversation for image check:", fullConversation); // Added debug log
        // Robust case-insensitive check for upload paths
        const imageMatches = fullConversation.match(/uploads[\\/]/gi) || []; 
        console.log("DEBUG: Image matches found:", imageMatches.length); // Added debug log
        if (imageMatches.length < 2) {
          isTicketData = false;
          aiResult = `I'm sorry, but I cannot create a support ticket for a food issue without at least 2 photos as evidence. Currently, I only see ${imageMatches.length} photo(s). Please upload the required evidence to proceed.`;
        }
      }
    }

    if (isTicketData) {
      // CATEGORIZATION: AI is now disabled for categorization per user request. 
      // Users will manually select the category. Defaulting to "General" if not provided.
      let category = req.body.category || "General";
      
      // 9. SMART ROUTING (Feature 9)
      // Map categories to specific backend teams
      const routingMap = {
          "Billing": "Finance Team",
          "Technical": "Network Support",
          "Infrastructure": "Facilities Management",
          "Vehicle Maintenance": "Fleet Operations",
          "Performance Issues": "IT Infrastructure",
          "Security": "Cybersecurity Team",
          "General": "Customer Relations",
          "Food": "Food Safety/Support Team"
      };
      const assignedTeam = routingMap[category] || "General Support";

      let priority = parsedAiResult.priority || predictPriority(parsedAiResult.title || req.body.title, req.body.query, category);
      
      // ESCALATE IF FRUSTRATED (Feature 7)
      if (isFrustrated && priority !== "P1") {
          priority = "P1";
      }

      // Adjust priority for urgent infrastructure issues (e.g., floods or total supply failure)
      const urgentInfraKeywords = ["flood", "burst", "no water", "overflow", "blockage"];
      if (category === "Infrastructure" && urgentInfraKeywords.some(kw => req.body.query.toLowerCase().includes(kw))) {
          priority = "P2"; // High priority for physical infrastructure failure
      }

      // Adjust priority for urgent vehicle breakdowns or theft
      if (category === "Vehicle Maintenance" && (req.body.query.toLowerCase().includes("breakdown") || req.body.query.toLowerCase().includes("emergency") || req.body.query.toLowerCase().includes("theft") || req.body.query.toLowerCase().includes("stolen"))) {
          priority = "P1"; // Critical priority for stranded vehicles
      }

      // Force P4 (Low) for feature requests, suggestions, or explicitly non-urgent queries
      const lowPriorityKeywords = ["not urgent", "would be nice", "could you please", "suggestion", "feedback", "improvement", "minor"];
      if (lowPriorityKeywords.some(kw => req.body.query.toLowerCase().includes(kw)) || category === "Feature Request") {
          priority = "P4";
      }

      // CREATE TICKET ONLY IF AI SAYS IT'S READY
      const newTicket = new Ticket({
        ...req.body,
        userId: req.user._id, // Automatically link the ticket to the logged-in user
        status: "Open", // Force status to Open on creation regardless of user input
        title: parsedAiResult.title || req.body.title || "Support Request",
        category,
        priority,
        platform: parsedAiResult.platform || req.body.platform || "",
        contactEmail: parsedAiResult.contactEmail || req.body.contactEmail || req.body.email || "",
        sourceUrl: parsedAiResult.sourceUrl || req.body.sourceUrl || "",
        aiSummary: parsedAiResult.summary || aiResult,
        aiCategory: category,
        assignedTeam // Added field for routing
      });

      const savedTicket = await newTicket.save();

      // Create SLA for this ticket
      await createSLA(savedTicket._id, savedTicket.priority);

      // NEW: Trigger analytics generation so the dashboard works immediately
      await generateDailyAnalytics();

      // Create notification
      await createNotification(
        req.user._id,
        "ticket_created",
        `Ticket ${savedTicket._id} Created`,
        `Your support ticket "${savedTicket.title}" has been created with priority ${savedTicket.priority}`,
        savedTicket._id,
        savedTicket.priority
      );

      // 10. SEND CONFIRMATION EMAIL
      try {
        await sendTicketEmail(req.user.email, savedTicket);
      } catch (mailError) {
        console.error("📧 Email Notification Failed:", mailError.message);
      }

      return res.status(201).json({
        message: "Ticket Created Successfully",
        aiResult: `✅ **Your ticket has been successfully created!**\n\n${aiResult
          // Remove technical tags
          .replace(/\[TICKET_START\]|\[TICKET_END\]/gi, "")
          // Remove redundant permission questions about ticket creation
          .replace(/(?:would you like|do you want|should i|shall i|why don't we).*(?:create|generate|open|submit|file|proceed).*(?:ticket|request|complaint)\??/gi, "")
          // Remove "I can open a ticket" statements
          .replace(/(?:i can|let me).*(?:open|create|generate).*(?:ticket|request).*(?:if you (?:wish|agree|want))?\.?/gi, "")
          .trim()}\n\nIs there anything else I can assist you with today?`,
        ticket: savedTicket,
        ticketSaved: true,
      });
    }

    // OTHERWISE, JUST RETURN THE CONVERSATION
    res.status(200).json({
      message: "Conversation",
      aiResult: (aiResult || "I understand you're facing an issue, but I need a few more details to help you effectively. Could you elaborate on what's happening?").replace(/\[TICKET_START\]|\[TICKET_END\]/g, "").trim(),
      ticketSaved: false,
    });

  } catch (error) {
    console.error("❌ Error creating ticket:", error.message);
    console.error(error.stack); // Log the full stack trace for detailed debugging

    res.status(500).json({
      message: "Server Error",
      details: error.message, // Send the error message to the frontend for display
    });

  }

});

// UPDATE TICKET STATUS
// Restricted to Admins only - Regular users can no longer change ticket status
router.put("/:id/status", authMiddleware, rbacMiddleware("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ["Open", "In-Progress", "Closed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`
      });
    }

    // Find and update ticket
    const ticket = await Ticket.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // If ticket is closed, update the associated SLA
    if (status === "Closed") {
      const sla = await SLA.findOne({ ticketId: id });
      if (sla && sla.status === "Active") {
        const now = new Date();
        sla.status = now <= sla.resolutionDeadline ? "Met" : "Breached";
        sla.resolutionMet = now <= sla.resolutionDeadline;
        await sla.save();
      }
    }

    // Regenerate analytics immediately after status update
    await generateDailyAnalytics();

    res.status(200).json({
      message: "Ticket status updated successfully",
      ticket
    });

  } catch (error) {
    console.error("Error updating ticket status:", error);
    res.status(500).json({
      message: "Server Error",
      details: error.message
    });
  }
});

// UPDATE TICKET PRIORITY (Admin Only)
router.put("/:id/priority", authMiddleware, rbacMiddleware("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;

    const ticket = await Ticket.findByIdAndUpdate(id, { priority }, { new: true });
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    await generateDailyAnalytics();
    res.status(200).json({ message: "Priority updated", ticket });
  } catch (error) {
    res.status(500).json({ message: "Server Error", details: error.message });
  }
});

// DELETE TICKET (Admin Only)
router.delete("/:id", authMiddleware, rbacMiddleware("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findByIdAndDelete(id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    // Cleanup associated SLAs
    await SLA.deleteOne({ ticketId: id });
    
    await generateDailyAnalytics();
    res.status(200).json({ message: "Ticket deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", details: error.message });
  }
});

// USER UPDATE CATEGORY (Allows users to correct AI's choice)
router.patch("/:id/category", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { category } = req.body;

    // Find ticket and ensure it belongs to the authenticated user
    const ticket = await Ticket.findOne({ _id: id, userId: req.user._id });
    if (!ticket) return res.status(404).json({ message: "Ticket not found or unauthorized" });

    ticket.category = category;
    ticket.aiCategory = category; // Mark that user confirmed/changed it
    await ticket.save();

    res.status(200).json({ message: "Category updated successfully", category });
  } catch (error) {
    res.status(500).json({ message: "Server Error", details: error.message });
  }
});

module.exports = router;