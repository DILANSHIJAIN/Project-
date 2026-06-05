const { Schema, model } = require("mongoose");

const slaSchema = new Schema(
  {
    ticketId: {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
    },
    priority: {
      type: String,
      enum: ["P1", "P2", "P3", "P4"],
      required: true,
    },
    responseTimeTarget: {
      type: Number, // in hours
      required: true,
    },
    resolutionTimeTarget: {
      type: Number, // in hours
      required: true,
    },
    responseDeadline: {
      type: Date,
      required: true,
    },
    resolutionDeadline: {
      type: Date,
      required: true,
    },
    responseMet: {
      type: Boolean,
      default: false,
    },
    resolutionMet: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["Active", "Breached", "Met"],
      default: "Active",
    },
  },
  { timestamps: true }
);

// Auto-calculate if SLA is breached
slaSchema.pre("save", function (next) {
  const now = new Date();
  if (now > this.resolutionDeadline && this.status === "Active") {
    this.status = "Breached";
  }
  next();
});

const SLA = model("SLA", slaSchema);
module.exports = SLA;
