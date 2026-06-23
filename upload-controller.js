const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure storage destination properties
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // ✅ FIXED: Saves files cleanly into the shared root uploads directory track
        const uploadPath = path.join(process.cwd(), "uploads");
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage }).single("image");

const uploadImage = (req, res) => {
    upload(req, res, (err) => {
        if (err) return res.status(500).json({ message: "Upload failed", error: err });
        if (!req.file) return res.status(400).json({ message: "Please upload a file" });
        
        // ✅ FIXED: Returns a clean path format string back to your chat window client
        res.status(200).json({ filePath: `uploads/${req.file.filename}` });
    });
};

module.exports = { uploadImage };