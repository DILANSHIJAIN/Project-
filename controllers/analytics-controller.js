const Analytics = require("../models/analytics-model");
const Ticket = require("../models/ticket-modal");
const SLA = require("../models/sla-model");

// Generate daily analytics
const generateDailyAnalytics = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all tickets
    const tickets = await Ticket.find();
    const slas = await SLA.find();

    const ticketsByPriority = { P1: 0, P2: 0, P3: 0, P4: 0 };
    const ticketsByCategory = { Hardware: 0, Software: 0, Network: 0, Account: 0, General: 0 };
    const ticketsByStatus = { Open: 0, "In-Progress": 0, Closed: 0 };

    let totalResolutionTime = 0;

    for (const ticket of tickets) {
      ticketsByPriority[ticket.priority]++;
      const cat = ticket.aiCategory || ticket.category || "General";
      if (ticketsByCategory[cat] !== undefined) ticketsByCategory[cat]++;
      ticketsByStatus[ticket.status]++;

      if (ticket.status === "Closed") {
        const resolutionTime = (ticket.updatedAt - ticket.createdAt) / (1000 * 60 * 60);
        totalResolutionTime += resolutionTime;
      }
    }

    // Calculate SLA Compliance based on all SLAs
    let slaMetCount = 0;
    let finishedSlaCount = 0;
    slas.forEach(sla => {
      if (sla.status === "Met") slaMetCount++;
      if (sla.status !== "Active") finishedSlaCount++;
    });

    const resolvedTickets = ticketsByStatus.Closed;
    const averageResolutionTime = resolvedTickets > 0 ? totalResolutionTime / resolvedTickets : 0;
    const slaComplianceRate = finishedSlaCount > 0 ? (slaMetCount / finishedSlaCount) * 100 : 100;

    // Check if analytics for today exists
    let analytics = await Analytics.findOne({ date: today });

    if (analytics) {
      // Update existing
      analytics.totalTickets = tickets.length;
      analytics.ticketsByPriority = ticketsByPriority;
      analytics.ticketsByCategory = ticketsByCategory;
      analytics.ticketsByStatus = ticketsByStatus;
      analytics.averageResolutionTime = Math.round(averageResolutionTime * 100) / 100;
      analytics.slaComplianceRate = Math.round(slaComplianceRate * 100) / 100;
      analytics.resolvedTickets = resolvedTickets;
      await analytics.save();
    } else {
      // Create new
      analytics = new Analytics({
        date: today,
        totalTickets: tickets.length,
        ticketsByPriority,
        ticketsByCategory,
        ticketsByStatus,
        averageResolutionTime: Math.round(averageResolutionTime * 100) / 100,
        slaComplianceRate: Math.round(slaComplianceRate * 100) / 100,
        resolvedTickets,
      });
      await analytics.save();
    }

    return analytics;
  } catch (error) {
    console.error("Error generating analytics:", error);
  }
};

// Get analytics for date range
const getAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {};
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const analytics = await Analytics.find(query).sort({ date: 1 });
    return res.status(200).json(analytics);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    next(error);
  }
};

// Get analytics summary
const getAnalyticsSummary = async (req, res, next) => {
  try {
    const latestAnalytics = await Analytics.findOne().sort({ date: -1 });

    if (!latestAnalytics) {
      return res.status(200).json({ 
        totalTickets: 0, 
        averageResolutionTime: 0, 
        slaComplianceRate: 100,
        statusDistribution: { Open: 0, "In-Progress": 0, Closed: 0 },
        priorityDistribution: { P1: 0, P2: 0, P3: 0, P4: 0 },
        categoryDistribution: { Hardware: 0, Software: 0, Network: 0, Account: 0, General: 0 },
        message: "No data available yet" 
      });
    }

    const summary = {
      date: latestAnalytics.date,
      totalTickets: latestAnalytics.totalTickets,
      averageResolutionTime: latestAnalytics.averageResolutionTime,
      slaComplianceRate: latestAnalytics.slaComplianceRate,
      statusDistribution: latestAnalytics.ticketsByStatus,
      priorityDistribution: latestAnalytics.ticketsByPriority,
      categoryDistribution: latestAnalytics.ticketsByCategory,
    };

    return res.status(200).json(summary);
  } catch (error) {
    console.error("Error fetching analytics summary:", error);
    next(error);
  }
};

module.exports = {
  generateDailyAnalytics,
  getAnalytics,
  getAnalyticsSummary,
};
