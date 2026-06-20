const { Schema, model } = require("mongoose");

const ticketSchema = new Schema(

  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      required: true,
      default: "General",
    },

    query: {
      type: String,
      required: true,
    },

    platform: {
      type: String,
      default: "",
    },

    contactEmail: {
      type: String,
      default: "",
    },

    sourceUrl: {
      type: String,
      default: "",
    },

    priority: {
      type: String,
      default: "P3",
      enum: ["P1", "P2", "P3", "P4"],
    },

    status: {
      type: String,
      default: "Open",
    },

    aiSummary: {
      type: String,
      default: "",
    },

    aiCategory: {
      type: String,
      default: "",
    },

  },

  { timestamps: true }

);

const Ticket = model("Ticket", ticketSchema);

module.exports = Ticket;