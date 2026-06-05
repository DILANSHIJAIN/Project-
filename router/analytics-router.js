const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth-middleware");
const rbacMiddleware = require("../middlewares/rbac-middleware");
const {
  getAnalytics,
  getAnalyticsSummary,
} = require("../controllers/analytics-controller");

// Get analytics summary (all authenticated users)
router.get("/summary", authMiddleware, getAnalyticsSummary);

// Get detailed analytics for date range (admin only)
router.get("/", authMiddleware, rbacMiddleware("admin"), getAnalytics);

module.exports = router;
