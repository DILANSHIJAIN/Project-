const { HfInference } = require("@huggingface/inference");

const CATEGORIES = {
  Hardware: ["printer", "monitor", "keyboard", "mouse", "cable", "device", "hardware", "equipment", "scanner"],
  Software: ["crash", "error", "bug", "installation", "update", "software", "application", "program", "patch"],
  Network: ["internet", "connection", "wifi", "vpn", "network", "proxy", "download", "upload", "router", "signal"],
  Account: ["password", "login", "access", "permission", "email", "profile", "account", "credentials", "mfa", "otp"],
  Infrastructure: ["water", "leak", "drain", "pipe", "light", "power", "building", "flood", "electricity", "facility"],
  Food: ["swiggy", "zomato", "order", "delivery", "meal", "hygiene", "restaurant", "food", "blinkit", "groceries"],
  Vehicle: ["theft", "stolen", "breakdown", "car", "bike", "mechanic", "maintenance", "fleet", "vehicle", "truck"],
  Billing: ["invoice", "payment", "charge", "refund", "receipt", "billing", "price", "amount", "transaction", "fee"]
};

const categorizeTicket = (title, query) => {
  const text = `${title} ${query}`.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORIES)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      if (category === "Vehicle") return "Vehicle Maintenance";
      return category;
    }
  }
  return "Others"; 
};

const predictPriority = (title, query, category) => {
  const text = `${title} ${query}`.toLowerCase();
  
  // Critical keywords
  if (["down", "crash", "security", "breach", "urgent", "critical", "emergency", "theft", "stolen"].some(w => text.includes(w))) {
    return "P1";
  }
  
  // High priority keywords
  if (["important", "broken", "major", "blocked", "cannot"].some(w => text.includes(w))) {
    return "P2";
  }
  
  // Medium priority by default
  if (["help", "issue", "problem", "link", "url"].some(w => text.includes(w))) {
    return "P3";
  }
  
  // Low priority
  return "P4";
};

const generateTicketData = async (query, context = "", history = []) => {
  const apiKey = process.env.HF_API_KEY;
  if (!apiKey) {
    console.error("❌ ERROR: HF_API_KEY is not defined in your .env file!");
    return null;
  }

  const KNOWLEDGE_BASE = `
  - Printer: Restart spooler, check cables, or refill ink.
  - Password/Login: Use 'Forgot Password' on the login screen.
  - Internet/VPN: Restart router, check proxy settings, or verify credentials.
  - Software Crash: Clear cache, check for updates, or reinstall.
  - Account Access: Verify email verification or contact HR for permissions.
  `;

  const hf = new HfInference(apiKey);

  try {
    const result = await hf.chatCompletion({
      model: "Qwen/Qwen2.5-7B-Instruct",
      messages: [
        {
          role: "system",
          content: `You are an incredibly helpful AI Support Assistant and accurate data extraction agent.
1. Your goal is to solve the user's problem immediately using the Knowledge Base or Previous Resolutions.
2. If it is a clear technical issue that requires human intervention, or if the user asks for a ticket, **first ask the user for confirmation (e.g., 'Would you like me to create a ticket for this issue?')**. Only if the user confirms, then generate the ticket using this format:
[TICKET_START]
Title: [Short title - max 50 chars]
Category: [General/Technical/Billing/Login & Authentication/Account Management/Infrastructure/Security/Data & Database/Bug Report/Service Request/Performance Issues/Complaint/Integration & API/Printing/Email & Collaboration/Feature Request/Vehicle Maintenance/Traffic & Logistics/Food/Others]
Priority: [P1/P2/P3/P4]
Summary: [Exact summary of user problem - replace missing data fragments with NOT_PROVIDED]
[TICKET_END]

STRICT ANTI-HALLUCINATION INSTRUCTIONS:
- ONLY extract information directly written in the USER QUERY.
- If any template data parameter (like Order ID, Transaction ID, Platform link, or Email) is missing, empty, or corrupted, write "NOT_PROVIDED".
- NEVER assume, guess, invent, or auto-complete details. If the user provides a short number like '2345', the extracted field must stay exactly '2345'. Do not expand it.

Interaction Rules:
- **VEHICLE**: Include "Vehicle Theft" reports within the "Vehicle Maintenance" category.
- **PROGRESS**: If troubleshooting, always present steps under "Troubleshooting Steps:". If previous steps failed, provide 2 NEW advanced alternatives. NEVER repeat.
- **DECISION**: If a ticket is needed, or troubleshooting fails, explicitly ask "Would you like to create a support ticket?" or offer "Continue Troubleshooting" if more steps are available.
- **CURRENCY**: Always use ₹ (INR) for any price or amount mentioned.`
        },
        {
          role: "user",
          content: `KNOWLEDGE BASE: ${KNOWLEDGE_BASE}\nPREVIOUS RESOLUTIONS: ${context}\nUSER QUERY: ${query}`
        }
      ],
      max_tokens: 200,
      temperature: 0.1 
    });

    return result.choices[0].message.content;

  } catch (error) {
    console.error("⚠️ AI Generation Error:", error.message);
    return null;
  }
};

module.exports = { 
  generateTicketData,
  categorizeTicket,
  predictPriority,
  CATEGORIES
};