# AI-Powered Helpdesk & Ticketing System - Backend API

This is the server-side application for the AI-Powered Helpdesk System. It handles the core business logic, database management, authentication, and orchestrates machine learning tasks using the Hugging Face Inference API.

---

## ⚙️ Backend Features
* **Ticket Management APIs:** Structured RESTful CRUD routes handling ticket lifecycles from creation to resolution.
* **Role-Based Access Control (RBAC):** Secure authorization layers via JWT mapping permissions dynamically across Admins, Support Agents, and Customers.
* **Notifications:** Server-side event triggers for ticket updates and assignments.
* **SLA Tracking:** Background clocking to monitor priority compliance against designated Service Level Agreements.

### 🧠 Hugging Face AI Integration
* **AI-Generated Ticket Summaries:** Automated generation of concise overviews for lengthy customer tickets using `facebook/bart-large-cnn`.
* **Priority & Classification:** NLP classification pipelines checking incoming text to predict ticket categories and flag high-priority emergencies instantly.

---

## 🛠️ Tech Stack
* **Runtime Environment:** Node.js
* **Framework:** Express.js
* **Database:** MongoDB (via Mongoose ODM)
* **AI Services:** Hugging Face Inference API (`@huggingface/inference`)

---

## ⚙️ Getting Started

### Prerequisites
* Node.js (v18+ recommended)
* MongoDB instance running locally or via Atlas Cloud
* Hugging Face User Access Token (HF_TOKEN)

### Installation & Setup

1. **Clone the backend repository:**
   ```bash
   git clone [https://github.com/your-username/ai-helpdesk-backend.git](https://github.com/your-username/ai-helpdesk-backend.git)
   cd ai-helpdesk-backend
Set up Environment Variables:
Create a .env file in the root directory:

Code snippet
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
HF_TOKEN=your_huggingface_access_token
Install Dependencies & Run Server:

Bash
npm install
npm start
The server will typically spin up on http://localhost:5000.


---

### 🎨 Repo 2: The Frontend Repository (`ai-helpdesk-frontend`)
Create a `README.md` in your frontend folder. This should focus on the user interface, state management, and how it communicates with your backend API.

```markdown
# AI-Powered Helpdesk & Ticketing System - Client UI

This is the client-side user interface for the AI-Powered Helpdesk System. It provides an intuitive, responsive interface for customers to submit tickets, an AI chatbot for immediate triage, and comprehensive dashboards for support agents and administrators.

---

## 🖥️ Frontend Features
* **Ticket Dashboard:** A clean UI for support agents to view, filter, update, and manage incoming customer service queries.
* **Chat Interface:** Real-time conversational interface providing automated initial assistance and issue triage powered by open-source LLMs.
* **Admin Panel:** Administrative controls over system configurations, active tickets, and team privileges.
* **Analytics Dashboard:** Metrics visualization showing resolution tracking, active queue loads, and system-wide performance.

---

## 🛠️ Tech Stack
* **Framework:** React
* **Styling:** [e.g., Tailwind CSS / Bootstrap]
* **State Management / HTTP Client:** [e.g., Context API, Axios]

---

## ⚙️ Getting Started

### Prerequisites
* Node.js (v18+ recommended)
* Running backend instance (see backend repository)

### Installation & Setup

1. **Clone the frontend repository:**
   ```bash
   git clone [https://github.com/your-username/ai-helpdesk-frontend.git](https://github.com/DILANSHIJAIN/project-frontend.git)
   cd project-frontend
Configure Environment Variables (Optional):
If you use a .env file to point to your backend:

Code snippet
REACT_APP_API_URL=http://localhost:5000
Install Dependencies & Start Development Server:

Bash
npm install
npm start
The application will open automatically on http://localhost:3000.


---

### 💡 Quick tip for your portfolio/resume:
At the top of the **Backend** README, add a line like: *“Looking for the frontend UI repo? Click https://github.com/DILANSHIJAIN/project-frontend
