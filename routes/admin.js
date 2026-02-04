const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { 
  getAllWasteData, 
  getWasteStats, 
  updateWasteData, 
  getUserStats,
  getKpiStats,
} = require('../controllers/adminController');

// GET /api/admin/waste/all - ดึงข้อมูลขยะทั้งหมด
router.get('/waste/all', [authMiddleware, adminMiddleware], getAllWasteData);

// GET /api/admin/waste/stats - ดึงข้อมูลสถิติสำหรับกราฟ
router.get('/waste/stats', [authMiddleware, adminMiddleware], getWasteStats);

// PUT /api/admin/waste/:id - อัปเดตข้อมูลขยะ
router.put('/waste/:id', [authMiddleware, adminMiddleware], updateWasteData);

// GET /api/admin/user/stats - ดึงข้อมูลสถิติผู้ใช้งาน
router.get('/user/stats', [authMiddleware, adminMiddleware], getUserStats);

// GET /api/admin/kpi-stats - สำหรับการ์ดสรุป
router.get('/kpi-stats', [authMiddleware, adminMiddleware], getKpiStats);

module.exports = router;