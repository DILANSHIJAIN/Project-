const dotenv = require("dotenv");
const result = dotenv.config();

if (result.error) {
    console.error("❌ Failed to load .env file:", result.error);
} else {
    console.log("✅ .env file loaded successfully. Keys found:", Object.keys(result.parsed || {}));
}

const express = require("express");
const path = require("path");
const os = require("os");
const cors = require("cors");

const router = require("./router/auth-router");
const contactRoute = require("./router/contact-router");
const connectDb = require("./utils/db");
const errorMiddleware = require("./middlewares/error-middleware");
const serviceRoute = require("./router/service-router");
const ticketRoute = require("./router/ticket-router");
const adminRoute = require("./router/admin-router");
const notificationRoute = require("./router/notification-router");
const slaRoute = require("./router/sla-router");
const analyticsRoute = require("./router/analytics-router");
const rbacTestRoute = require("./router/rbac-test-router");
const homeRoute = require("./home-router");
const aboutRoute = require("./about-router");
const uploadRoute = require("./upload-router");
const { generateDailyAnalytics } = require("./controllers/analytics-controller");

const app = express();

// ✅ UPDATED: Dynamically whitelists Vercel branch/preview sub-domains to resolve your CORS blocks
const corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = [
            process.env.FRONTEND_URL, 
            "http://localhost:5173", 
            "http://127.0.0.1:5173",
            "http://10.238.173.228:5173"
        ];
        
        // Clean trailing slash if present
        const cleanOrigin = origin ? origin.replace(/\/$/, "") : null;

        // Trust the request if it has no origin (like mobile tools), matches our list, or ends with .vercel.app
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes(cleanOrigin) || origin.endsWith(".vercel.app")) {
            callback(null, true);
        } else {
            console.error(`🛑 Blocked by CORS: Origin was [${origin}]`);
            callback(new Error("Not allowed by CORS"));
        }
    },
    methods: "GET,POST,PUT,DELETE,PATCH,HEAD",
    credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use("/images", express.static(path.join(__dirname, "public/images")));

// Log all incoming requests and their response status codes to the terminal
app.use((req, res, next) => {
    res.on("finish", () => {
        console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl} - ${res.statusCode}`);
    });
    next();
});

app.use("/api/auth", router);
app.use("/api/admin/contacts", contactRoute); 
app.use("/api/data", serviceRoute);
app.use("/api/tickets", ticketRoute);
app.use("/api/notifications", notificationRoute);
app.use("/api/sla", slaRoute);
app.use("/api/analytics", analyticsRoute);
app.use("/api/rbac-test", rbacTestRoute);
app.use("/api/home", homeRoute);
app.use("/api/about", aboutRoute);
app.use("/api/upload", uploadRoute);

app.get("/", (req, res) => {
    res.status(200).send("Welcome to AI-Powered Helpdesk & Ticketing System");
});

// Admin routes should typically be protected
app.use("/api/admin", adminRoute);
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

connectDb()
    .then(async () => {
        // Generate daily analytics on server start
        try {
            await generateDailyAnalytics();
            console.log("✅ Analytics generated successfully");
        } catch (err) {
            console.warn("⚠️ Analytics generation failed:", err.message);
        }

        // World-class IP detection to help with mobile testing
        const networkInterfaces = os.networkInterfaces();
        let networkIp = "localhost";
        for (const interfaceName in networkInterfaces) {
            const iface = networkInterfaces[interfaceName].find(details => details.family === 'IPv4' && !details.internal);
            if (iface) networkIp = iface.address;
        }

        app.listen(PORT, () => {
            console.log(`🚀 Server running! Local: http://localhost:${PORT} | Network: http://${networkIp}:${PORT}`);
        });
    })
    .catch((err) => {
        box.log("DB connection failed:", err);
    });