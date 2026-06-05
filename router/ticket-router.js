const express = require("express");

const router = express.Router();

const Ticket = require("../models/ticket-modal");
const SLA = require("../models/sla-model");

const { generateTicketData, categorizeTicket, predictPriority } = require("../utils/ai");
const authMiddleware = require("../middlewares/auth-middleware");
const { createSLA } = require("../controllers/sla-controller");
const { createNotification } = require("../controllers/notification-controller");
const { generateDailyAnalytics } = require("../controllers/analytics-controller");
const rbacMiddleware = require("../middlewares/rbac-middleware");

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
    try {
      const keywords = req.body.query.split(" ").filter(w => w.length > 4);
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

    // AI GENERATION
    let aiResult;
    try {
      // Pass similar resolutions to AI as context
      aiResult = await generateTicketData(req.body.query, previousResolutions);
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
      const lines = aiResult.split("\n");
      let titleMatch, categoryMatch, priorityMatch, summaryMatch; // Declare once outside the loop
      lines.forEach(line => {
        titleMatch = line.match(/Title\s*[:\-]\s*(.*)/i);
        categoryMatch = line.match(/Category\s*[:\-]\s*(.*)/i);
        priorityMatch = line.match(/Priority\s*[:\-]\s*(.*)/i);
        summaryMatch = line.match(/Summary\s*[:\-]\s*(.*)/i);

        if (titleMatch) parsedAiResult.title = titleMatch[1].trim();
        if (categoryMatch) parsedAiResult.category = categoryMatch[1].trim();
        if (priorityMatch) parsedAiResult.priority = priorityMatch[1].trim();
        if (summaryMatch) parsedAiResult.summary = summaryMatch[1].trim();
      });
    }

    // IMPROVED MEANINGFUL CHECK (even if AI is offline)
    const commonGreetings = ["hi", "hello", "hey", "test", "help"];
    const userQueryClean = req.body.query.trim().toLowerCase();
    const isUseless = parsedAiResult.isGreeting || 
                      req.body.query.length < 5 || 
                      commonGreetings.includes(userQueryClean);

    if (isUseless) {
      return res.status(200).json({
        message: "Greeting",
        aiResult: aiResult || "Hello! How can I help you today?",
        ticketSaved: false,
      });
    }

    if (isTicketData) {
      // Use AI helpers as fallbacks if parsing didn't find specific fields
      let category = parsedAiResult.category || categorizeTicket(parsedAiResult.title || req.body.title, req.body.query);

      // Detect Infrastructure issues (Water/Drainage)
      const infraKeywords = ["water", "supply", "drainage", "leak", "pipe", "plumbing", "blockage", "tap", "sink", "toilet", "flush"];
      if (infraKeywords.some(kw => req.body.query.toLowerCase().includes(kw))) {
          category = "Infrastructure";
      }

      // Detect Login & Authentication issues
      const loginAuthKeywords = ["password", "locked", "otp", "login", "signin", "sign-in", "authentication"];
      if (loginAuthKeywords.some(kw => req.body.query.toLowerCase().includes(kw))) {
          category = "Login & Authentication";
      }

      // Detect Account Management issues
      const accountMgmtKeywords = ["profile", "settings", "creation", "deletion", "account update", "preferences"];
      if (accountMgmtKeywords.some(kw => req.body.query.toLowerCase().includes(kw))) {
          category = "Account Management";
      }

      // Detect Security issues
      const securityKeywords = ["malware", "virus", "phishing", "hack", "unauthorized", "breach", "spam", "suspicious", "ransomware"];
      if (securityKeywords.some(kw => req.body.query.toLowerCase().includes(kw))) {
          category = "Security";
      }

      // Detect Data & Database issues
      const dataDatabaseKeywords = ["backup", "restore", "data loss", "storage", "hard drive", "cloud storage", "file access", "sync", "missing files", "database", "query", "record"];
      if (dataDatabaseKeywords.some(kw => req.body.query.toLowerCase().includes(kw))) {
          category = "Data & Database";
      }

      // Detect Bug Report issues
      const bugKeywords = ["bug", "glitch", "ui issue", "frontend issue", "unexpected behavior"];
      if (bugKeywords.some(kw => req.body.query.toLowerCase().includes(kw))) {
          category = "Bug Report";
      }

      // Detect Service Request issues
      const serviceRequestKeywords = ["installation", "resource request", "setup request", "software request"];
      if (serviceRequestKeywords.some(kw => req.body.query.toLowerCase().includes(kw))) {
          category = "Service Request";
      }

      // Detect Performance Issues
      const performanceKeywords = ["slow", "loading time", "timeout", "lag", "latency", "freezing"];
      if (performanceKeywords.some(kw => req.body.query.toLowerCase().includes(kw))) {
          category = "Performance Issues";
      }

      // Detect Complaint issues
      const complaintKeywords = ["poor service", "agent complaint", "unresolved", "frustrated", "dissatisfied"];
      if (complaintKeywords.some(kw => req.body.query.toLowerCase().includes(kw))) {
          category = "Complaint";
      }

      // Detect Integration & API issues
      const integrationKeywords = ["api", "integration", "third-party", "webhook", "endpoint", "connection error"];
      if (integrationKeywords.some(kw => req.body.query.toLowerCase().includes(kw))) {
          category = "Integration & API";
      }

      // Detect Printing issues
      const printingKeywords = ["printer", "print", "scanner", "scan", "ink", "toner", "paper jam", "offline printer", "not printing"];
      if (printingKeywords.some(kw => req.body.query.toLowerCase().includes(kw))) {
          category = "Printing";
      }

      // Detect Email & Collaboration issues
      const emailCollabKeywords = ["email", "outlook", "gmail", "calendar", "meeting", "teams", "zoom", "communication", "sync email", "email not sending"];
      if (emailCollabKeywords.some(kw => req.body.query.toLowerCase().includes(kw))) {
          category = "Email & Collaboration";
      }

      // Detect Feature Request/Suggestion issues
      const featureRequestKeywords = ["feature", "request", "suggestion", "new functionality", "idea", "improve", "wishlist"];
      if (featureRequestKeywords.some(kw => req.body.query.toLowerCase().includes(kw))) {
          category = "Feature Request";
      }

      // Detect Vehicle Maintenance issues
      const vehicleKeywords = ["vehicle", "car", "bike", "engine", "maintenance", "repair", "breakdown", "transport", "tire", "fuel"];
      if (vehicleKeywords.some(kw => req.body.query.toLowerCase().includes(kw))) {
          category = "Vehicle Maintenance";
      }

      // Detect Traffic & Logistics issues
      const trafficKeywords = ["traffic", "jam", "road", "route", "delivery", "logistics", "highway", "congestion", "navigation"];
      if (trafficKeywords.some(kw => req.body.query.toLowerCase().includes(kw))) {
          category = "Traffic & Logistics";
      }

      let priority = parsedAiResult.priority || predictPriority(parsedAiResult.title || req.body.title, req.body.query, category);

      // Adjust priority for urgent infrastructure issues (e.g., floods or total supply failure)
      const urgentInfraKeywords = ["flood", "burst", "no water", "overflow", "blockage"];
      if (category === "Infrastructure" && urgentInfraKeywords.some(kw => req.body.query.toLowerCase().includes(kw))) {
          priority = "P2"; // High priority for physical infrastructure failure
      }

      // Adjust priority for urgent vehicle breakdowns
      if (category === "Vehicle Maintenance" && (req.body.query.toLowerCase().includes("breakdown") || req.body.query.toLowerCase().includes("emergency"))) {
          priority = "P1"; // Critical priority for stranded vehicles
      }

      // Force P4 (Low) for feature requests, suggestions, or explicitly non-urgent queries
      const lowPriorityKeywords = ["not urgent", "would be nice", "could you please", "suggestion", "feedback", "improvement", "minor"];
      if (lowPriorityKeywords.some(kw => req.body.query.toLowerCase().includes(kw))) {
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
        aiSummary: parsedAiResult.summary || aiResult,
        aiCategory: category,
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

      return res.status(201).json({
        message: "Ticket Created Successfully",
        aiResult: "I've opened a ticket for you based on our conversation.",
        ticket: savedTicket,
        ticketSaved: true,
      });
    }

    // OTHERWISE, JUST RETURN THE CONVERSATION
    res.status(200).json({
      message: "Conversation",
      aiResult: (aiResult || "I'm having a bit of trouble processing that. Can you rephrase?").replace(/\[TICKET_START\]|\[TICKET_END\]/g, "").trim(),
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