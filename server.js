require("dotenv").config();
const express = require("express");
const cors = require("cors");

const router = require("./router/auth-router");
const contactRoute = require("./router/contact-router");
const connectDb = require("./utils/db");
const errorMiddleware = require("./middlewares/error-middleware");
const serviceRoute=require("./router/service-router");
const ticketRoute = require("./router/ticket-router");
const adminRoute=require("./router/admin-router");
const notificationRoute = require("./router/notification-router");
const slaRoute = require("./router/sla-router");
const analyticsRoute = require("./router/analytics-router");
const rbacTestRoute = require("./router/rbac-test-router");
const homeRoute = require("./home-router");
const aboutRoute = require("./about-router");
const { generateDailyAnalytics } = require("./controllers/analytics-controller");

const app = express();

const corsOptions = {
    origin: "http://localhost:5173",
    methods: "GET,POST,PUT,DELETE,PATCH,HEAD",
    credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all incoming requests and their response status codes to the terminal
app.use((req, res, next) => {
    res.on("finish", () => {
        console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl} - ${res.statusCode}`);
    });
    next();
});

app.use("/api/auth", router);
app.use("/api/admin/contacts", contactRoute); // THIS LINE MUST BE EXACTLY THIS
app.use("/api/data", serviceRoute);
app.use("/api/tickets", ticketRoute);
app.use("/api/notifications", notificationRoute);
app.use("/api/sla", slaRoute);
app.use("/api/analytics", analyticsRoute);
app.use("/api/rbac-test", rbacTestRoute);
app.use("/api/home", homeRoute);
app.use("/api/about", aboutRoute);

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

        app.listen(PORT, () => {
            console.log(`server is running at port:${PORT}`);
        });
    })
    .catch((err) => {
        console.error("DB connection failed:", err);
    });