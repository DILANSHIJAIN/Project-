const express = require("express");
const router = express.Router();
const homeController = require("./home-controller");

// Route to get home page content
router.route("/").get(homeController.getHomePageContent);

module.exports = router;