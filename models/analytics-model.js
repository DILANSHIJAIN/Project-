const { Schema, model } = require("mongoose");

const analyticsSchema = new Schema(
  {
    date: {
      type: Date,
      required: true,
      default: () => new Date().setHours(0, 0, 0, 0),
    },
    totalTickets: {
      type: Number,
      default: 0,
    },
    ticketsByPriority: {
      P1: { type: Number, default: 0 },
      P2: { type: Number, default: 0 },
      P3: { type: Number, default: 0 },
      P4: { type: Number, default: 0 },
    },
    ticketsByCategory: {
      Hardware: { type: Number, default: 0 },
      Software: { type: Number, default: 0 },
      Network: { type: Number, default: 0 },
      Account: { type: Number, default: 0 },
      General: { type: Number, default: 0 },
    },
    ticketsByStatus: {
      Open: { type: Number, default: 0 },
      "In-Progress": { type: Number, default: 0 },
      Closed: { type: Number, default: 0 },
    },
    averageResolutionTime: {
      type: Number, // in hours
      default: 0,
    },
    slaComplianceRate: {
      type: Number, // percentage 0-100
      default: 100,
    },
    resolvedTickets: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const Analytics = model("Analytics", analyticsSchema);
module.exports = Analytics;
