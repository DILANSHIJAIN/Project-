const express=require("express");
const router=express.Router();
const { getServices, addReview, deleteServiceById, updateServiceById } = require("../controllers/service-controller");
const authMiddleware = require("../middlewares/auth-middleware");

router.route('/service').get(getServices);
router.route('/service/:id/reviews').post(authMiddleware, addReview);

// Admin routes for services
router.route('/admin/services').get(authMiddleware, getServices);
router.route('/admin/services/update/:id').patch(authMiddleware, updateServiceById);
router.route('/admin/services/delete/:id').delete(authMiddleware, deleteServiceById);

module.exports=router;