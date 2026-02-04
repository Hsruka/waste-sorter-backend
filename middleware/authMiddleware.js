// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  let token = req.header('Authorization');
  
  if (!token) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }

  // Support both "Bearer <token>" and just "<token>"
  if (token.startsWith('Bearer ')) {
    token = token.slice(7, token.length).trimLeft();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user; // req.user will contain { id: userId }
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token is not valid' });
  }
};