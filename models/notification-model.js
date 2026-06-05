const { Schema, model } = require("mongoose");

const notificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ticketId: {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
      required: null,
    },
    type: {
      type: String,
      enum: ["ticket_created", "ticket_updated", "ticket_closed", "sla_warning", "sla_breached", "admin_alert"],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: String,
      enum: ["P1", "P2", "P3", "P4"],
      default: "P3",
    },
  },
  { timestamps: true }
);

const Notification = model("Notification", notificationSchema);
module.exports = Notification;
