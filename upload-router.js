const express = require("express");
const router = express.Router();
const { uploadImage } = require("./upload-controller");

// Endpoint for image uploads
router.post("/", uploadImage);

module.exports = router;