// routes/users.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { getAllUsers, updateUser, deleteUser } = require('../controllers/userController');

// Middleware to protect all routes in this file
router.use(authMiddleware, adminMiddleware);

// GET /api/users - Get all users
router.get('/', getAllUsers);

// PUT /api/users/:id - Update a user
router.put('/:id', updateUser);

// DELETE /api/users/:id - Delete a user
router.delete('/:id', deleteUser);

module.exports = router;