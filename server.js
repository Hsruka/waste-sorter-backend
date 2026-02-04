// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const authRoutes = require('./routes/auth');
const wasteRoutes = require('./routes/waste');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/users');

app.use('/api/auth', authRoutes);
app.use('/api/waste', wasteRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});