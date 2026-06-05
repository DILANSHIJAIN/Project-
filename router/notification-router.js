const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth-middleware");
const {
  getNotifications,
  markAsRead,
  getUnreadCount,
} = require("../controllers/notification-controller");

// Get all notifications for logged-in user
router.get("/", authMiddleware, getNotifications);

// Get unread notification count
router.get("/unread-count", authMiddleware, getUnreadCount);

// Mark notification as read
router.put("/:notificationId/read", authMiddleware, markAsRead);

module.exports = router;
