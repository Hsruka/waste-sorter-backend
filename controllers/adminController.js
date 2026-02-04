const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false}
};

// ดึงข้อมูลขยะทั้งหมดจากทุก user
exports.getAllWasteData = async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      `SELECT w.id, w.waste_type, w.imageUrl, w.createdAt, u.username
       FROM wastes w
       JOIN users u ON w.user_id = u.id
       ORDER BY w.createdAt DESC`
    );
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.error("GET_ALL_WASTE_ERROR:", error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ดึงข้อมูลสถิติขยะเพื่อใช้ในกราฟ
exports.getWasteStats = async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      `SELECT waste_type, COUNT(*) as count
       FROM wastes
       GROUP BY waste_type
       ORDER BY count DESC`
    );
    await connection.end();
    res.json(rows);
  } catch (error)
  {
    console.error("GET_WASTE_STATS_ERROR:", error);
    res.status(500).json({ error: 'Server error' });
  }
};

// อัปเดตประเภทขยะ (สำหรับ Admin)
exports.updateWasteData = async (req, res) => {
  const { id } = req.params; // ID ของขยะที่ต้องการแก้
  const { waste_type } = req.body; // ประเภทใหม่ที่จะอัปเดต

  if (!waste_type) {
    return res.status(400).json({ error: 'Waste type is required.' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      'UPDATE wastes SET waste_type = ? WHERE id = ?',
      [waste_type, id]
    );
    await connection.end();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Waste record not found.' });
    }

    res.json({ message: 'Waste data updated successfully.' });
  } catch (error) {
    console.error("UPDATE_WASTE_ERROR:", error);
    res.status(500).json({ error: 'Server error' });
  }
};

//สำหรับการ์ดสรุป (KPI Cards)
exports.getKpiStats = async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // 1. ขยะทั้งหมด
    const [wasteRows] = await connection.execute('SELECT COUNT(*) as totalWaste FROM wastes');
    
    // 2. ขยะที่เพิ่มวันนี้
    const [todayRows] = await connection.execute('SELECT COUNT(*) as todayWaste FROM wastes WHERE DATE(createdAt) = CURDATE()');
    
    // 3. ผู้ใช้ทั้งหมด
    const [userRows] = await connection.execute('SELECT COUNT(*) as totalUsers FROM users');
    
    await connection.end();
    
    res.json({
      totalWaste: wasteRows[0].totalWaste || 0,
      todayWaste: todayRows[0].todayWaste || 0,
      totalUsers: userRows[0].totalUsers || 0,
    });
    
  } catch (error) {
    console.error("GET_KPI_STATS_ERROR:", error);
    res.status(500).json({ error: 'Server error' });
  }
};

//สำหรับกราฟแท่ง (Top Users)
exports.getUserStats = async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      `SELECT u.username, COUNT(w.id) as count
       FROM wastes w
       JOIN users u ON w.user_id = u.id
       GROUP BY w.user_id
       ORDER BY count DESC
       LIMIT 5` // ดึง 5 อันดับแรก
    );
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.error("GET_USER_STATS_ERROR:", error);
    res.status(500).json({ error: 'Server error' });
  }
};