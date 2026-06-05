const mongoose = require("mongoose");

const pageSchema = new mongoose.Schema({
    pageName: {
        type: String,
        required: true,
        unique: true,
    },
    content: {
        type: Object,
        required: true,
    },
}, { timestamps: true });

module.exports = mongoose.model("Page", pageSchema);