const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // ใช้ Middleware นี้หลังจาก authMiddleware
  // เพื่อให้แน่ใจว่า req.user มีอยู่แล้ว
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admins only.' });
  }

  next();
};