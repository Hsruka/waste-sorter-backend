// routes/waste.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../middleware/authMiddleware');
const { addWaste, getHistory } = require('../controllers/wasteController');

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Append extension
  },
});

const upload = multer({ storage: storage });

// POST /api/waste - Add new waste record (protected)
// 'image' คือชื่อ field ที่ส่งมาจาก frontend
router.post('/', authMiddleware, upload.single('image'), addWaste);

// GET /api/waste/history - Get user's waste history (protected)
router.get('/history', authMiddleware, getHistory);

module.exports = router;