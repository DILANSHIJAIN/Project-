const Notification = require("../models/notification-model");
const Ticket = require("../models/ticket-modal");
const User = require("../models/user-model");

// Get notifications for logged-in user
const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    next(error);
  }
};

// Mark notification as read
const markAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );

    return res.status(200).json({ message: "Marked as read", notification });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    next(error);
  }
};

// Get unread count
const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const unreadCount = await Notification.countDocuments({
      userId,
      isRead: false,
    });

    return res.status(200).json({ unreadCount });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    next(error);
  }
};

// Create notification (internal use)
const createNotification = async (userId, type, title, message, ticketId = null, priority = "P3") => {
  try {
    const notification = new Notification({
      userId,
      ticketId,
      type,
      title,
      message,
      priority,
    });
    await notification.save();
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  getUnreadCount,
  createNotification,
};
