const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// ... other middleware ...

const imagesDir = path.join(__dirname, 'public', 'images', 'user');
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, imagesDir);
    },
    filename: (req, file, cb) => {
        const ext = '.png'; // Chỉ lưu dưới dạng PNG
        const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
        cb(null, filename);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Chỉ hỗ trợ file PNG.'));
    },
    limits: { fileSize: 5 * 1024 * 1024 } // Giới hạn 5MB
});

app.use('/avatars', express.static('public/avatars')); // Thư mục chứa ảnh đại diện người dùng

// ... your routes ...

// PostgreSQL connection
const pool = new Pool({
  user: 'postgres',
  host: '192.168.1.8', // Đảm bảo IP này đúng và có thể truy cập được từ thiết bị/giả lập của bạn
  database: 'app_english',
  password: '123',
  port: 5432,
});

// Test route
app.get('/', (req, res) => {
  res.send('🚀 Server is running!');
});

// Register route
// Register endpoint
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin.' });
    }

    try {
        const emailCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (emailCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Email đã được sử dụng.' });
        }

        const usernameCheck = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (usernameCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Tên người dùng đã được sử dụng.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email, role',
            [username, email, hashedPassword]
        );

        const user = result.rows[0];
        res.status(201).json({
            message: 'Đăng ký thành công',
            userId: user.id,
            username: user.username,
            email: user.email,
            role: user.role
        });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ error: 'Lỗi server.' });
    }
});

// Login endpoint
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Vui lòng nhập email và mật khẩu.' });
    }

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Email hoặc mật khẩu không đúng.' });
        }

        const user = result.rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Email hoặc mật khẩu không đúng.' });
        }

        res.status(200).json({
            message: 'Đăng nhập thành công',
            userId: user.id,
            username: user.username,
            email: user.email,
            role: user.role
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Lỗi server.' });
    }
});

// Get user info endpoint
app.get('/api/user/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const result = await pool.query(
            'SELECT id, username, email, role, date_of_birth, phone_number, address, profile_image_url FROM users WHERE id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
        }

        const user = result.rows[0];
        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Lỗi server.' });
    }
});

// Update user info endpoint
app.put('/api/user/:userId', async (req, res) => {
    const { userId } = req.params;
    const { username, email, dateOfBirth, phoneNumber, address, profileImageUrl } = req.body;

    if (!username || !email || !dateOfBirth || !phoneNumber || !address) {
        return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin bắt buộc.' });
    }

    try {
        const usernameCheck = await pool.query(
            'SELECT id FROM users WHERE username = $1 AND id != $2',
            [username, userId]
        );
        if (usernameCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Tên người dùng đã được sử dụng.' });
        }

        const emailCheck = await pool.query(
            'SELECT id FROM users WHERE email = $1 AND id != $2',
            [email, userId]
        );
        if (emailCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Email đã được sử dụng.' });
        }

        const result = await pool.query(
            'UPDATE users SET username = $1, email = $2, date_of_birth = $3, phone_number = $4, address = $5, profile_image_url = $6 WHERE id = $7 RETURNING *',
            [username, email, dateOfBirth, phoneNumber, address, profileImageUrl || null, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
        }

        res.status(200).json({
            message: 'Thông tin đã được cập nhật thành công',
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Lỗi server.' });
    }
});

// Upload image endpoint
app.post('/api/upload-image', upload.single('image'), async (req, res) => {
    const { userId } = req.body;

    if (!userId || !req.file) {
        return res.status(400).json({ error: 'Thiếu userId hoặc file ảnh.' });
    }

    try {
        const imagePath = `/images/user/${req.file.filename}`;
        const result = await pool.query(
            'UPDATE users SET profile_image_url = $1 WHERE id = $2 RETURNING *',
            [imagePath, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
        }

        res.status(200).json({
            message: 'Ảnh hồ sơ đã được cập nhật.',
            profileImageUrl: imagePath
        });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ error: 'Lỗi tải ảnh lên.' });
    }
});

// Các endpoint khác giữ nguyên
app.get('/levels', async (req, res) => {
    try {
        const result = await pool.query('SELECT level_id, name, image_url FROM levels ORDER BY level_id ASC');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Lỗi khi lấy danh sách levels:', err);
        res.status(500).json({ error: 'Lỗi server, không thể lấy dữ liệu levels.' });
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
// Route để lấy tất cả câu hỏi và các đáp án liên quan cho một bài test
app.get('/tests/:test_id/questions', async (req, res) => {
  const testId = parseInt(req.params.test_id);

  if (isNaN(testId)) {
    return res.status(400).json({ error: 'ID bài kiểm tra không hợp lệ.' });
  }

  try {
    // Lấy tất cả câu hỏi cho test_id này
    const questionsResult = await pool.query(
      'SELECT question_id, test_id, type_id, content, image_path, correct_answer, audio_path FROM questions WHERE test_id = $1 ORDER BY question_id ASC',
      [testId]
    );

    if (questionsResult.rows.length === 0) {
      return res.status(200).json([]); // Trả về mảng rỗng nếu không có câu hỏi
    }

    const questionsWithAnswers = [];
    for (const question of questionsResult.rows) {
      // Với mỗi câu hỏi, lấy tất cả đáp án liên quan
      const answersResult = await pool.query(
        'SELECT answer_id, question_id, answer_text, is_correct FROM answers WHERE question_id = $1 ORDER BY answer_id ASC',
        [question.question_id]
      );
      
      // Gán mảng đáp án vào đối tượng câu hỏi
      questionsWithAnswers.push({
        ...question,
        answers: answersResult.rows,
      });
    }

    res.status(200).json(questionsWithAnswers);
  } catch (err) {
    console.error(`Lỗi khi lấy câu hỏi cho test_id ${testId}:`, err);
    res.status(500).json({ error: 'Lỗi server nội bộ khi lấy câu hỏi.' });
  }
});


app.post('/history', async (req, res) => {
    const { userId, testId, score, totalQuestions, correctAnswers, userAnswers } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (userId === undefined || testId === undefined || score === undefined || totalQuestions === undefined || correctAnswers === undefined || userAnswers === undefined) {
        return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ thông tin kết quả bài làm.' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO public.history (user_id, test_id, score, total_questions, correct_answers, user_answers)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING history_id`,
            [userId, testId, score, totalQuestions, correctAnswers, JSON.stringify(userAnswers)] // JSON.stringify() là cần thiết để lưu mảng/đối tượng JS vào cột JSONB
        );
        res.status(201).json({ 
            message: 'Kết quả bài làm đã được lưu thành công.', 
            historyId: result.rows[0].history_id 
        });
    } catch (err) {
        console.error('Lỗi khi lưu kết quả bài làm:', err);
        res.status(500).json({ error: 'Lỗi server nội bộ khi lưu kết quả bài làm.' });
    }
});


// MỚI: Route để lấy lịch sử làm bài của người dùng
app.get('/history/user/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
        return res.status(400).json({ error: 'ID người dùng không hợp lệ.' });
    }

    try {
        const result = await pool.query(
            `SELECT 
                h.history_id,
                h.user_id,
                u.username,
                h.test_id,
                t.title AS test_title,
                h.score,
                h.total_questions,
                h.correct_answers,
                h.taken_at,
                h.user_answers
            FROM 
                public.history AS h
            JOIN 
                public.users AS u ON h.user_id = u.id
            JOIN 
                public.tests AS t ON h.test_id = t.test_id
            WHERE 
                h.user_id = $1::INTEGER
            ORDER BY 
                h.taken_at DESC`, // Sắp xếp theo thời gian mới nhất
            [userId]
        );
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(`Lỗi khi lấy lịch sử bài làm cho user_id ${userId}:`, err);
        res.status(500).json({ error: 'Lỗi server nội bộ khi lấy lịch sử bài làm.' });
    }
});



app.get('/levels', async (req, res) => {
    try {
        const result = await pool.query('SELECT level_id, name, image_url  FROM levels ORDER BY level_id ASC');
        res.status(200).json(result.rows);
    } catch (err) {
      console.error('Lỗi khi lấy danh sách levels:', err);
        res.status(500).json({ error: 'Lỗi server, không thể lấy dữ liệu levels.' });
    }
});



//TRƯỜNG THÊM SỬA LẤY LEVEL
// POST /levels - Tạo level mới
app.post('/levels', async (req, res) => {
    const { name, image } = req.body;  // nhận cả ảnh

    try {
        const result = await pool.query(
            'INSERT INTO levels (name, image_url) VALUES ($1, $2) RETURNING *',
            [name, image]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Lỗi thêm cấp độ:', err);
        res.status(500).json({ error: 'Lỗi server khi thêm cấp độ' });
    }
});

// Sửa level
app.put('/levels', async (req, res) => {
    const { level_id, name, image } = req.body;

    if (!level_id) {
        return res.status(400).json({ error: 'Thiếu level_id để sửa' });
    }

    try {
        const result = await pool.query(
            'UPDATE levels SET name = $1, image_url = $2 WHERE level_id = $3 RETURNING *',
            [name, image, level_id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Cấp độ không tồn tại' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Lỗi sửa cấp độ:', err);
        res.status(500).json({ error: 'Lỗi server khi sửa cấp độ' });
    }
});


// Xóa level
app.delete('/levels', async (req, res) => {
    const { id } = req.body;  // id truyền từ frontend thực ra là level_id
    try {
        // Sử dụng tên cột đúng là level_id thay vì id
        const result = await pool.query(
            'DELETE FROM levels WHERE level_id = $1 RETURNING *',
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Cấp độ không tồn tại' });
        }

        res.json({ deletedLevel: result.rows[0] });
    } catch (err) {
        console.error('Lỗi xóa cấp độ:', err);
        res.status(500).json({ error: 'Lỗi server khi xóa cấp độ' });
    }
});

// Lấy danh sách tất cả unit
app.get('/units', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT unit_id, level_id, title, image_url FROM units ORDER BY unit_id ASC'
        );
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Lỗi khi lấy danh sách units:', err);
        res.status(500).json({ error: 'Lỗi server, không thể lấy dữ liệu units.' });
    }
});

// Thêm unit mới
app.post('/units', async (req, res) => {
    const { level_id, title, image_url } = req.body;

    if (!level_id || !title) {
        return res.status(400).json({ error: 'Thiếu level_id hoặc title' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO units (level_id, title, image_url) VALUES ($1, $2, $3) RETURNING *',
            [level_id, title, image_url]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Lỗi thêm unit:', err);
        res.status(500).json({ error: 'Lỗi server khi thêm unit' });
    }
});

// Sửa unit theo id
app.put('/units/:id', async (req, res) => {
    const unit_id = parseInt(req.params.id);
    const { level_id, title, image_url } = req.body;

    if (!level_id || !title) {
        return res.status(400).json({ error: 'Thiếu level_id hoặc title' });
    }

    try {
        const result = await pool.query(
            'UPDATE units SET level_id = $1, title = $2, image_url = $3 WHERE unit_id = $4 RETURNING *',
            [level_id, title, image_url, unit_id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Unit không tồn tại' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Lỗi sửa unit:', err);
        res.status(500).json({ error: 'Lỗi server khi sửa unit' });
    }
});

// Xóa unit theo id
app.delete('/units/:id', async (req, res) => {
    const unit_id = parseInt(req.params.id);

    try {
        const result = await pool.query(
            'DELETE FROM units WHERE unit_id = $1 RETURNING *',
            [unit_id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Unit không tồn tại' });
        }

        res.json({ deletedUnit: result.rows[0] });
    } catch (err) {
        console.error('Lỗi xóa unit:', err);
        res.status(500).json({ error: 'Lỗi server khi xóa unit' });
    }
});



// --- RANKING ROUTES ---

// API Endpoint để lấy bảng xếp hạng (ĐÃ SỬA DÙNG pool.query VÀ CỘT ID CỦA USERS)
app.get('/api/ranking', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                u.id AS user_id, -- Đổi u.user_id thành u.id
                u.username,
                SUM(h.score) AS total_score
            FROM
                users u
            JOIN
                history h ON u.id = h.user_id -- Đổi u.user_id thành u.id
            GROUP BY
                u.id, u.username -- Đổi u.user_id thành u.id
            ORDER BY
                total_score DESC;
        `);

        // Với pg, kết quả trả về trong .rows
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching ranking:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy bảng xếp hạng.' });
    }
});

app.listen(3000, () => {
  console.log('✅ Server is running at http://localhost:3000');
});