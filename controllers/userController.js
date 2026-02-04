// controllers/userController.js
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false}
};


// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT id, username, email, role, createdAt FROM users');
    await connection.end();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Update user role
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!role) {
    return res.status(400).json({ error: 'Role is required.' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    await connection.end();
    res.json({ message: 'User updated successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete a user
exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute('DELETE FROM users WHERE id = ?', [id]);
    await connection.end();
    res.json({ message: 'User deleted successfully.' });
  } catch (error) {
    // Handle potential foreign key constraint errors
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
         return res.status(400).json({ error: 'Cannot delete user. They have associated waste data.' });
    }
    res.status(500).json({ error: 'Server error' });
  }
};