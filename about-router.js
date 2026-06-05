const express = require("express");
const router = express.Router();
const aboutController = require("./about-controller");

// Route to get about page content
router.route("/").get(aboutController.getAboutPageContent);

module.exports = router;