const SLA = require("../models/sla-model");
const Ticket = require("../models/ticket-modal");

// SLA configurations in hours
const SLA_CONFIG = {
  P1: { response: 1, resolution: 4 },
  P2: { response: 4, resolution: 8 },
  P3: { response: 24, resolution: 48 },
  P4: { response: 72, resolution: 120 },
};

// Create SLA when ticket is created
const createSLA = async (ticketId, priority) => {
  try {
    const config = SLA_CONFIG[priority] || SLA_CONFIG.P3;
    const now = new Date();
    const responseDeadline = new Date(now.getTime() + config.response * 60 * 60 * 1000);
    const resolutionDeadline = new Date(now.getTime() + config.resolution * 60 * 60 * 1000);

    const sla = new SLA({
      ticketId,
      priority,
      responseTimeTarget: config.response,
      resolutionTimeTarget: config.resolution,
      responseDeadline,
      resolutionDeadline,
    });

    await sla.save();
    return sla;
  } catch (error) {
    console.error("Error creating SLA:", error);
  }
};

// Get SLA for ticket
const getSLAForTicket = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const sla = await SLA.findOne({ ticketId });

    if (!sla) {
      return res.status(404).json({ message: "SLA not found" });
    }

    return res.status(200).json(sla);
  } catch (error) {
    console.error("Error fetching SLA:", error);
    next(error);
  }
};

// Get all SLAs
const getAllSLAs = async (req, res, next) => {
  try {
    const slas = await SLA.find()
      .populate("ticketId")
      .sort({ resolutionDeadline: 1 });

    return res.status(200).json(slas);
  } catch (error) {
    console.error("Error fetching SLAs:", error);
    next(error);
  }
};

// Get breached SLAs
const getBreachedSLAs = async (req, res, next) => {
  try {
    const breachedSLAs = await SLA.find({ status: "Breached" })
      .populate("ticketId")
      .sort({ resolutionDeadline: 1 });

    return res.status(200).json(breachedSLAs);
  } catch (error) {
    console.error("Error fetching breached SLAs:", error);
    next(error);
  }
};

// Check and update SLA status
const checkSLAStatus = async () => {
  try {
    const slas = await SLA.find({ status: { $ne: "Met" } });
    const now = new Date();

    for (const sla of slas) {
      if (now > sla.resolutionDeadline && sla.status === "Active") {
        sla.status = "Breached";
        await sla.save();
      }
    }
  } catch (error) {
    console.error("Error checking SLA status:", error);
  }
};

module.exports = {
  createSLA,
  getSLAForTicket,
  getAllSLAs,
  getBreachedSLAs,
  checkSLAStatus,
  SLA_CONFIG,
};
