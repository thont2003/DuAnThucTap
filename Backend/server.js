const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// ... other middleware ...

const imagesDir = path.join(__dirname, 'public', 'images');
console.log('Đường dẫn phục vụ ảnh tĩnh:', imagesDir);
app.use('/images', express.static(imagesDir));

// ... your routes ...

// PostgreSQL connection
const pool = new Pool({
  user: 'postgres',
  host: '192.168.1.15', // Đảm bảo IP này đúng và có thể truy cập được từ thiết bị/giả lập của bạn
  database: 'app_english',
  password: '123',
  port: 5432,
});

// Test route
app.get('/', (req, res) => {
  res.send('🚀 Server is running!');
});

// Register route
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ thông tin' });
  }

  try {
    const userCheck = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Tên người dùng hoặc email đã tồn tại' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id',
      [username, email, hashedPassword]
    );

    res.status(201).json({ 
      message: 'Đăng ký thành công', 
      userId: result.rows[0].id 
    });
  } catch (err) {
    console.error('Lỗi đăng ký:', err);
    res.status(500).json({ error: 'Lỗi server, vui lòng thử lại sau' });
  }
});

// Login route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Vui lòng cung cấp email và mật khẩu' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ error: 'Email không tồn tại' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Mật khẩu không đúng' });
    }

    res.status(200).json({ 
      message: 'Đăng nhập thành công', 
      userId: user.id,
      username: user.username // Trả về username sau khi đăng nhập thành công
    });
  } catch (err) {
    console.error('Lỗi đăng nhập:', err);
    res.status(500).json({ error: 'Lỗi server, vui lòng thử lại sau' });
  }
});

// Route lấy danh sách levels
app.get('/levels', async (req, res) => {
    try {
        const result = await pool.query('SELECT level_id, name, image_url FROM levels ORDER BY level_id ASC');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Lỗi khi lấy danh sách levels:', err);
        res.status(500).json({ error: 'Lỗi server, không thể lấy dữ liệu levels.' });
    }
});

// Route lấy danh sách units theo level_id
// ĐÃ SỬA: XÓA ĐỊNH NGHĨA TRÙNG LẶP Ở CUỐI FILE
app.get('/levels/:level_id/units', async (req, res) => {
    const levelId = parseInt(req.params.level_id); // Đảm bảo chuyển đổi sang số nguyên

    if (isNaN(levelId)) {
        return res.status(400).json({ error: 'ID cấp độ không hợp lệ.' });
    }

    try {
        const result = await pool.query(
            'SELECT unit_id, title, image_url FROM units WHERE level_id = $1 ORDER BY unit_id ASC', // Đổi title thành name cho khớp frontend
            [levelId]
        );
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(`Lỗi khi lấy units cho level_id ${levelId}:`, err);
        res.status(500).json({ error: 'Lỗi server nội bộ khi lấy units' });
    }
});

// Thêm Route lấy danh sách tests theo unit_id
app.get('/tests/:unit_id', async (req, res) => {
    const unitId = parseInt(req.params.unit_id);

    if (isNaN(unitId)) {
        return res.status(400).json({ error: 'ID unit không hợp lệ.' });
    }

    try {
        const result = await pool.query(
            `SELECT tests.*, 
             (SELECT COUNT(*) FROM questions WHERE questions.test_id = tests.test_id) AS question_count
             FROM tests 
             WHERE unit_id = $1 
             ORDER BY test_id ASC`,
            [unitId]
        );
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(`Lỗi khi lấy tests cho unit_id ${unitId}:`, err);
        res.status(500).json({ error: 'Lỗi server nội bộ khi lấy tests' });
    }
});
app.post('/tests/:test_id/start', async (req, res) => {
    const testId = parseInt(req.params.test_id);

    if (isNaN(testId)) {
        return res.status(400).json({ error: 'ID bài kiểm tra không hợp lệ.' });
    }

    try {
        await pool.query(
            'UPDATE tests SET play_count = play_count + 1 WHERE test_id = $1',
            [testId]
        );
        res.status(200).json({ message: 'Play count updated successfully.' });
    } catch (err) {
        console.error(`Lỗi khi cập nhật play_count cho test_id ${testId}:`, err);
        res.status(500).json({ error: 'Lỗi server nội bộ khi cập nhật play_count' });
    }
});



// Get user info route (dành cho HomeScreen)
app.get('/api/user', async (req, res) => {
  const userId = req.query.userId; 

  if (!userId) {
    return res.status(400).json({ error: 'Vui lòng cung cấp userId' });
  }

  try {
    const result = await pool.query('SELECT username FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'Người dùng không tồn tại' });
    }

    res.status(200).json({ username: user.username });
  } catch (err) {
    console.error('Lỗi khi lấy thông tin người dùng:', err);
    res.status(500).json({ error: 'Lỗi server, vui lòng thử lại sau' });
  }
});


app.listen(3000, () => {
  console.log('✅ Server is running at http://localhost:3000');
});