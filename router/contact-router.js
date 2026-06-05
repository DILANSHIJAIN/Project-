const express = require("express");
const router = express.Router();
const { contactForm, getAllContacts, deleteContactById, updateContactById } = require("../controllers/contact-controller");
const authMiddleware = require("../middlewares/auth-middleware");
const rbacMiddleware = require("../middlewares/rbac-middleware");

// Admin Routes - Simplified to match the mount point in server.js
router.route("/")
    .post(contactForm)
    .get(authMiddleware, rbacMiddleware("admin"), getAllContacts);

router.route("/delete/:id").delete(authMiddleware, rbacMiddleware("admin"), deleteContactById);
router.route("/update/:id").patch(authMiddleware, rbacMiddleware("admin"), updateContactById);

module.exports=router;