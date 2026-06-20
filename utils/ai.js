const { HfInference } = require("@huggingface/inference");

const CATEGORIES = {
  Hardware: ["printer", "monitor", "keyboard", "mouse", "cable", "device", "hardware", "equipment"],
  Software: ["crash", "error", "bug", "installation", "update", "software", "application", "program"],
  Network: ["internet", "connection", "wifi", "vpn", "network", "proxy", "download", "upload"],
  Account: ["password", "login", "access", "permission", "email", "profile", "account", "credentials"],
};

const categorizeTicket = (title, query) => {
  const text = `${title} ${query}`.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORIES)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return category;
    }
  }
  return "General";
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
  if (["help", "issue", "problem"].some(w => text.includes(w))) {
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
          content: `You are an incredibly helpful AI Support Assistant.
1. Your goal is to solve the user's problem immediately using the Knowledge Base or Previous Resolutions.
2. Before creating a ticket, ALWAYS make sure you have collected these three details from the user. If any are missing, ask for them first:
   - **Platform Name**: the platform, product, website or application the issue is about.
   - **Contact Email**: an email address where we can reach the user.
   - **Source URL**: the exact URL/page the user was on when the issue happened.
3. If it is a clear technical issue that requires human intervention, or if the user asks for a ticket, **first ask the user for confirmation (e.g., 'Would you like me to create a ticket for this issue?')**. Only if the user confirms, then generate the ticket using this format:
[TICKET_START]
Title: [Short, descriptive problem title - max 50 chars. Describe the issue ONLY. Do NOT include the platform name, contact email, or URL here]
Category: [General/Technical/Billing/Login & Authentication/Account Management/Infrastructure/Security/Data & Database/Bug Report/Service Request/Performance Issues/Complaint/Integration & API/Printing/Email & Collaboration/Feature Request/Vehicle Maintenance/Traffic & Logistics/Food]
Priority: [P1/P2/P3/P4]
Platform: [Platform/application/website the issue is about, or N/A]
Contact Email: [User's contact email, or N/A]
Source URL: [The exact URL/page where the query originated, or N/A]
Summary: [Detailed summary of the issue and recommended first steps. Do NOT repeat the contact email here]
[TICKET_END]
Priority Guide:
- P1: Critical/Urgent (system down, security issue, data loss)
- P2: High (significant feature broken, multiple users affected)
- P3: Medium (normal operations affected, single user or workaround available)
- P4: Low (minor issues, cosmetic problems, enhancement requests)

Instructions for interaction:
- **VEHICLE**: Include "Vehicle Theft" reports within the "Vehicle Maintenance" category.
- **PROGRESS**: If troubleshooting, always present steps under "Troubleshooting Steps:". If previous steps failed, provide 2 NEW advanced alternatives. NEVER repeat.
- **DECISION**: If a ticket is needed, or troubleshooting fails, explicitly ask "Would you like to create a support ticket?" or offer "Continue Troubleshooting" if more steps are available.
- **CURRENCY**: Always use ₹ (INR) for any price or amount mentioned.
- **NO DUPLICATION**: The Platform, Contact Email, and Source URL must appear ONLY in their dedicated fields. Never repeat them inside the Title or Summary.
`
        },
        {
          role: "user",
          content: `KNOWLEDGE BASE: ${KNOWLEDGE_BASE}\nPREVIOUS RESOLUTIONS: ${context}\nUSER QUERY: ${query}`
        }
      ],
      max_tokens: 200,
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