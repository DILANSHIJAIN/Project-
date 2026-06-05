const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth-middleware");
const rbacMiddleware = require("../middlewares/rbac-middleware");
const {
  getSLAForTicket,
  getAllSLAs,
  getBreachedSLAs,
} = require("../controllers/sla-controller");

// Get SLA for specific ticket (all authenticated users)
router.get("/ticket/:ticketId", authMiddleware, getSLAForTicket);

// Get all SLAs (admin only)
router.get("/all", authMiddleware, rbacMiddleware("admin"), getAllSLAs);

// Get breached SLAs (admin only)
router.get("/breached", authMiddleware, rbacMiddleware("admin"), getBreachedSLAs);

module.exports = router;
