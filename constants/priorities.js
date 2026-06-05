/**
 * Ticket Priority System
 * Standard P1-P4 priority levels with descriptions
 */

const PRIORITIES = {
  P1: {
    level: "P1",
    name: "Critical",
    description: "System down, security issue, major functionality broken",
    color: "#dc2626", // Red
    responseTime: "1 hour"
  },
  P2: {
    level: "P2",
    name: "High",
    description: "Significant feature broken, workaround unavailable",
    color: "#f97316", // Orange
    responseTime: "4 hours"
  },
  P3: {
    level: "P3",
    name: "Medium",
    description: "Normal operations affected, workaround available",
    color: "#eab308", // Yellow
    responseTime: "1 day"
  },
  P4: {
    level: "P4",
    name: "Low",
    description: "Minor issues, cosmetic problems, enhancement requests",
    color: "#22c55e", // Green
    responseTime: "5 days"
  }
};

const PRIORITY_LEVELS = ["P1", "P2", "P3", "P4"];

module.exports = {
  PRIORITIES,
  PRIORITY_LEVELS
};
