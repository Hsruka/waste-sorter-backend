const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: true }
};

exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Please provide all fields.' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    // Check for existing email OR username
    const [rows] = await connection.execute(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (rows.length > 0) {
      await connection.end();
      // Check which field already exists
      if (rows[0].email === email) {
        return res.status(400).json({ error: 'Email already exists.' });
      }
      return res.status(400).json({ error: 'Username already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert with the default role 'user'
    await connection.execute(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    await connection.end();
    res.status(201).json({ message: 'User registered successfully.' });
  } catch (error) {
    console.error('REGISTER_ERROR:', error);
    res.status(500).json({ error: 'Server error' });
  }
};


exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide email and password.' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM users WHERE email = ?', [email]);

    if (rows.length === 0) {
      await connection.end();
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      await connection.end();
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    // ▼▼▼ ADD USER ROLE TO THE PAYLOAD ▼▼▼
    const payload = {
      user: {
        id: user.id,
        role: user.role, // <-- เพิ่ม role เข้าไปใน token
      },
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });

    await connection.end();
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role, // <-- ส่ง role กลับไปให้ frontend ด้วย
      },
    });
  } catch (error) {
    console.error('LOGIN_ERROR:', error);
    res.status(500).json({ error: 'Server error' });
  }
};