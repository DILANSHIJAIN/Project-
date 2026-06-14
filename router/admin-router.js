const express = require("express");
const authMiddleware = require("../middlewares/auth-middleware");
const rbacMiddleware = require("../middlewares/rbac-middleware");
const { 
    getAllUsers, getAllContacts, updateUserById, deleteUserById, deleteContactById,
    getAllServices, updateServiceById, deleteServiceById,
    getHomePageData, getAboutPageData,
    updateHomePageContent, updateAboutPageContent,
    getContactPageData, updateContactPageContent
} = require("../controllers/admin-controller");
const router = express.Router();

// Admin-only endpoints
router.route("/users").get(authMiddleware, rbacMiddleware("admin"), getAllUsers);
router.route("/users/update/:id").patch(authMiddleware, rbacMiddleware("admin"), updateUserById);
router.route("/users/delete/:id").delete(authMiddleware, rbacMiddleware("admin"), deleteUserById);

router.route("/services").get(authMiddleware, rbacMiddleware("admin"), getAllServices);
router.route("/services/update/:id").patch(authMiddleware, rbacMiddleware("admin"), updateServiceById);
router.route("/services/delete/:id").delete(authMiddleware, rbacMiddleware("admin"), deleteServiceById);

router.route("/contacts").get(authMiddleware, rbacMiddleware("admin"), getAllContacts);
router.route("/contacts/delete/:id").delete(authMiddleware, rbacMiddleware("admin"), deleteContactById);

router.route("/home-content")
    .get(authMiddleware, rbacMiddleware("admin"), getHomePageData)
    .patch(authMiddleware, rbacMiddleware("admin"), updateHomePageContent);

router.route("/about-content")
    .get(authMiddleware, rbacMiddleware("admin"), getAboutPageData)
    .patch(authMiddleware, rbacMiddleware("admin"), updateAboutPageContent);

router.route("/contact-content")
    .get(authMiddleware, rbacMiddleware("admin"), getContactPageData)
    .patch(authMiddleware, rbacMiddleware("admin"), updateContactPageContent);

module.exports = router;