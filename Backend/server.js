const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const nodemailer = require('nodemailer');
require('dotenv').config(); // Tải biến môi trường từ .env

const app = express();
app.use(cors());
app.use(express.json());

// Cấu hình thư mục lưu trữ ảnh profile
const imagesDir = path.join(__dirname, '..', 'src', 'assets', 'images', 'profile');
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

// Cung cấp các file ảnh profile tĩnh
app.use('/images/profile', express.static(imagesDir));

// Cấu hình Multer để tải lên ảnh
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
        const filetypes = /png|jpg|jpeg/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Chỉ hỗ trợ file PNG.'));
    },
    limits: { fileSize: 5 * 1024 * 1024 } // Giới hạn 5MB
});

////////////////Units/////////////////////
const unitImagesDir = path.join(__dirname, '..', 'src', 'assets', 'images', 'units');
if (!fs.existsSync(unitImagesDir)) fs.mkdirSync(unitImagesDir, { recursive: true });

app.use('/images/units', express.static(unitImagesDir));

const unitImageStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, unitImagesDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
        cb(null, filename);
    }
});

const uploadUnitImage = multer({
    storage: unitImageStorage,
    fileFilter: (req, file, cb) => {
        const filetypes = /png|jpg|jpeg/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) return cb(null, true);
        cb(new Error('Chỉ hỗ trợ file PNG, JPG hoặc JPEG.'));
    },
    limits: { fileSize: 5 * 1024 * 1024 }
});

/////////////////////////Tests///////////////////
const testImagesDir = path.join(__dirname, '..', 'src', 'assets', 'images', 'tests');

// Tạo thư mục nếu nó không tồn tại
if (!fs.existsSync(testImagesDir)) {
    fs.mkdirSync(testImagesDir, { recursive: true });
}

// Cấu hình Express để phục vụ ảnh tĩnh từ thư mục này
app.use('/images/tests', express.static(testImagesDir));

// Cấu hình Multer storage cho ảnh bài test
const testImageStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, testImagesDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const filename = `test-${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
        cb(null, filename);
    }
});

// Instance Multer để xử lý tải ảnh bài test
const uploadTestImage = multer({
    storage: testImageStorage,
    fileFilter: (req, file, cb) => {
        const filetypes = /png|jpg|jpeg|gif/; // Bạn có thể thêm các định dạng khác nếu cần
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Chỉ hỗ trợ file ảnh (PNG, JPG, JPEG, GIF).'));
    },
    limits: { fileSize: 5 * 1024 * 1024 } // Giới hạn kích thước file 5MB
});

// Cập nhật hàm deleteImageFile để xử lý ảnh tests
// Đảm bảo hàm này được định nghĩa ở một nơi có thể truy cập được
const deleteTestImageFile = (relativeFilePath) => {
    if (!relativeFilePath) return;

    let fullPath;
    if (relativeFilePath.startsWith('/images/units/')) {
        fullPath = path.join(__dirname, '..', 'src', 'assets', 'images', 'units', path.basename(relativeFilePath));
    } else if (relativeFilePath.startsWith('/images/questions/')) {
        fullPath = path.join(__dirname, '..', 'src', 'assets', 'images', 'questions', path.basename(relativeFilePath));
    } else if (relativeFilePath.startsWith('/images/tests/')) { // Thêm điều kiện cho ảnh tests
        fullPath = path.join(__dirname, '..', 'src', 'assets', 'images', 'tests', path.basename(relativeFilePath));
    }
    else {
        console.warn('Đường dẫn ảnh không hợp lệ hoặc nằm ngoài thư mục cho phép:', relativeFilePath);
        return;
    }

    fs.unlink(fullPath, (err) => {
        if (err) {
            console.error(`Lỗi khi xóa file ảnh cũ: ${fullPath}`, err);
        } else {
            console.log(`Đã xóa file ảnh cũ: ${fullPath}`);
        }
    });
};

// ////////////////////////QUESTIONS///////////////
// Định nghĩa thư mục lưu trữ ảnh câu hỏi
const questionImagesDir = path.join(__dirname, '..', 'src', 'assets', 'images', 'questions');

// Tạo thư mục nếu nó không tồn tại
if (!fs.existsSync(questionImagesDir)) {
    fs.mkdirSync(questionImagesDir, { recursive: true });
}

// Cấu hình Express để phục vụ ảnh tĩnh từ thư mục này
// Đường dẫn URL sẽ là /images/questions/tên_file.jpg
app.use('/images/questions', express.static(questionImagesDir));

// Cấu hình Multer storage cho ảnh câu hỏi
const questionImageStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, questionImagesDir), // Lưu vào thư mục ảnh câu hỏi
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        // Đặt tên file độc đáo để tránh trùng lặp
        const filename = `question-${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
        cb(null, filename);
    }
});

// Instance Multer để xử lý tải ảnh câu hỏi
const uploadQuestionImage = multer({
    storage: questionImageStorage,
    fileFilter: (req, file, cb) => {
        // Chỉ chấp nhận các loại file ảnh nhất định
        const filetypes = /png|jpg|jpeg|gif/; // Bạn có thể thêm các định dạng khác nếu cần
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Chỉ hỗ trợ file ảnh (PNG, JPG, JPEG, GIF).'));
    },
    limits: { fileSize: 5 * 1024 * 1024 } // Giới hạn kích thước file 5MB
});

// Hàm hỗ trợ xóa file ảnh vật lý trên server
// Hàm này có thể xử lý cả ảnh units và questions
const deleteImageFile = (relativeFilePath) => {
    if (!relativeFilePath) return;

    let fullPath;
    // Xác định thư mục gốc của file dựa trên tiền tố đường dẫn tương đối
    if (relativeFilePath.startsWith('/images/units/')) {
        fullPath = path.join(__dirname, '..', 'src', 'assets', 'images', 'units', path.basename(relativeFilePath));
    } else if (relativeFilePath.startsWith('/images/questions/')) {
        fullPath = path.join(__dirname, '..', 'src', 'assets', 'images', 'questions', path.basename(relativeFilePath));
    } else {
        console.warn('Đường dẫn ảnh không hợp lệ hoặc nằm ngoài thư mục cho phép:', relativeFilePath);
        return;
    }

    fs.unlink(fullPath, (err) => {
        if (err) {
            console.error(`Lỗi khi xóa file ảnh cũ: ${fullPath}`, err);
        } else {
            console.log(`Đã xóa file ảnh cũ: ${fullPath}`);
        }
    });
};

// Cung cấp các file tĩnh khác
app.use('/audio', express.static('public/audio'));
app.use('/images', express.static('public/images'));
app.use('/avatars', express.static('public/avatars')); // Thư mục chứa ảnh đại diện người dùng

// Cấu hình kết nối PostgreSQL
const pool = new Pool({
    user: 'postgres',
    host: '192.168.1.53', // Đảm bảo IP này đúng và có thể truy cập được từ thiết bị/giả lập của bạn
    database: 'english',
    password: '123',
    port: 5432,
});

// Route kiểm tra server
app.get('/', (req, res) => {
    res.send('🚀 Server is running!');
});

// =================================================================================================
//                                     CÁC CHỨC NĂNG DÀNH CHO NGƯỜI DÙNG (USER)
// =================================================================================================

// Đăng ký tài khoản
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

        // Server-side password validation
        if (password.length < 8 || password.length > 50) {
            return res.status(400).json({ error: 'Mật khẩu phải có độ dài từ 8 đến 50 ký tự.' });
        }
        if (!/[a-z]/.test(password)) {
            return res.status(400).json({ error: 'Mật khẩu phải chứa ít nhất một chữ cái thường.' });
        }
        if (!/[A-Z]/.test(password)) {
            return res.status(400).json({ error: 'Mật khẩu phải chứa ít nhất một chữ cái hoa.' });
        }
        if (!/[0-9]/.test(password)) {
            return res.status(400).json({ error: 'Mật khẩu phải chứa ít nhất một chữ số.' });
        }
        if (password.includes(username) || password.includes(email.split('@')[0])) {
            return res.status(400).json({ error: 'Mật khẩu không được trùng với tên người dùng hoặc một phần email của bạn.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const defaultProfileImage = '/images/profile/avatar.png'; // Default profile image path
        
        const result = await pool.query(
            'INSERT INTO users (username, email, password, profile_image_url) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role, profile_image_url',
            [username, email, hashedPassword, defaultProfileImage]
        );

        const user = result.rows[0];
        res.status(201).json({
            message: 'Đăng ký thành công',
            userId: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            profile_image_url: user.profile_image_url
        });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ error: 'Lỗi server.' });
    }
});

// Đăng nhập
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

// Thêm route Quên mật khẩu và gửi email thật
app.post('/api/forgot-password', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Vui lòng nhập địa chỉ email.' });
    }

    try {
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'Email không tồn tại trong hệ thống.' });
        }

        // Tạo mật khẩu mới ngẫu nhiên
        const newPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Cập nhật mật khẩu mới trong DB
        await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, email]);

        // Gửi email với mật khẩu mới
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: `"English App Support" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '🔐 Mật khẩu mới cho tài khoản English App',
            html: `
                <h3>Chào bạn,</h3>
                <p>Mật khẩu mới của bạn là: <strong>${newPassword}</strong></p>
                <p>Vui lòng đăng nhập và thay đổi mật khẩu ngay sau đó.</p>
                <p>Trân trọng,<br/>Đội ngũ hỗ trợ English App</p>
            `
        };

        await transporter.sendMail(mailOptions);

        return res.status(200).json({ message: 'Mật khẩu mới đã được gửi đến email của bạn.' });
    } catch (err) {
        console.error('Lỗi khi gửi lại mật khẩu:', err);
        return res.status(500).json({ error: 'Lỗi server khi đặt lại mật khẩu.' });
    }
});

// Lấy thông tin người dùng (cho trang cá nhân)
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

// Cập nhật thông tin người dùng
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

// Tải lên ảnh profile
app.post('/api/upload-image', upload.single('image'), async (req, res) => {
    const { userId, oldImagePath } = req.body;

    if (!userId || !req.file) {
        return res.status(400).json({ error: 'Thiếu userId hoặc file ảnh.' });
    }

    // Xóa ảnh cũ nếu có
    if (oldImagePath) {
        const fullOldPath = path.join(__dirname, '..', 'src', 'assets', oldImagePath); // Ví dụ: /images/profile/xxx.jpg
        fs.unlink(fullOldPath, (err) => {
            if (err) {
                console.warn('Không thể xóa ảnh cũ:', err.message);
            } else {
                console.log('Ảnh cũ đã được xóa:', oldImagePath);
            }
        });
    }

    try {
        const imagePath = `/images/profile/${req.file.filename}`;
        const result = await pool.query(
            'UPDATE users SET profile_image_url = $1 WHERE id = $2 RETURNING *',
            [imagePath, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
        }

        res.status(200).json({
            message: 'Ảnh hồ sơ đã được cập nhật.',
            profileImageUrl: imagePath,
        });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ error: 'Lỗi tải ảnh lên.' });
    }
});

// Thay đổi mật khẩu
app.put('/api/user/:userId/change-password', async (req, res) => {
    const { userId } = req.params;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: 'Thiếu thông tin mật khẩu.' });
    }

    try {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Người dùng không tồn tại.' });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Mật khẩu cũ không đúng.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);

        return res.status(200).json({ message: 'Đổi mật khẩu thành công.' });
    } catch (err) {
        console.error('Error changing password:', err);
        return res.status(500).json({ error: 'Lỗi server khi đổi mật khẩu.' });
    }
});


// Lấy thông tin người dùng (cho HomeScreen)
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

// Lấy danh sách Levels (cấp độ)
app.get('/levels', async (req, res) => {
    try {
        const result = await pool.query('SELECT level_id, name, image_url FROM levels ORDER BY level_id ASC');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Lỗi khi lấy danh sách levels:', err);
        res.status(500).json({ error: 'Lỗi server, không thể lấy dữ liệu levels.' });
    }
});

// Lấy danh sách Units (đơn vị bài học) theo Level ID
app.get('/levels/:level_id/units', async (req, res) => {
    const levelId = parseInt(req.params.level_id); // Đảm bảo chuyển đổi sang số nguyên

    if (isNaN(levelId)) {
        return res.status(400).json({ error: 'ID cấp độ không hợp lệ.' });
    }

    try {
        const result = await pool.query(
            'SELECT unit_id, title, image_url FROM units WHERE level_id = $1 ORDER BY unit_id ASC',
            [levelId]
        );
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(`Lỗi khi lấy units cho level_id ${levelId}:`, err);
        res.status(500).json({ error: 'Lỗi server nội bộ khi lấy units' });
    }
});

// Lấy danh sách Tests (bài kiểm tra) theo Unit ID
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

// Cập nhật số lượt chơi của bài test
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

// Lấy tất cả câu hỏi và đáp án cho một bài test
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

// Lưu kết quả bài làm vào lịch sử
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

// Lấy lịch sử làm bài của người dùng
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

// Lấy bảng xếp hạng
app.get('/api/ranking', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                u.id AS user_id,
                u.username,
                u.profile_image_url,
                SUM(max_scores.max_score_per_test) AS total_score
            FROM
                users u
            JOIN
                (
                    SELECT
                        user_id,
                        test_id,
                        MAX(score) AS max_score_per_test
                    FROM
                        history
                    GROUP BY
                        user_id,
                        test_id
                ) AS max_scores ON u.id = max_scores.user_id
            GROUP BY
                u.id, u.username, u.profile_image_url
            ORDER BY
                total_score DESC;
        `);

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching ranking:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy bảng xếp hạng.' });
    }
});


// =================================================================================================
//                                     CÁC CHỨC NĂNG DÀNH CHO QUẢN TRỊ VIÊN (ADMIN)
// =================================================================================================

// Tạo Level mới
app.post('/levels', async (req, res) => {
    const { name, image } = req.body; 

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

// Sửa Level
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

// Xóa Level
// Xóa Level
app.delete('/levels', async (req, res) => {
    const { id, imageUrl } = req.body; // Now expecting imageUrl as well
    try {
        const result = await pool.query(
            'DELETE FROM levels WHERE level_id = $1 RETURNING *',
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Cấp độ không tồn tại' });
        }

        // Xóa ảnh cũ từ server nếu có
        if (imageUrl) {
            const fullImagePath = path.join(__dirname, '..', 'src', 'assets', imageUrl);
            fs.unlink(fullImagePath, (err) => {
                if (err) {
                    console.warn('Không thể xóa ảnh cấp độ:', err.message);
                } else {
                    console.log('Ảnh cấp độ đã được xóa:', imageUrl);
                }
            });
        }

        res.json({ deletedLevel: result.rows[0] });
    } catch (err) {
        console.error('Lỗi xóa cấp độ:', err);
        res.status(500).json({ error: 'Lỗi server khi xóa cấp độ' });
    }
});

// Tải lên ảnh cấp độ
app.post('/api/upload-level-image', uploadLevelImage.single('image'), async (req, res) => {
    const { oldImagePath } = req.body; // oldImagePath will be a relative path like /images/levels/old_image.png

    if (!req.file) {
        return res.status(400).json({ error: 'Thiếu file ảnh.' });
    }

    // Xóa ảnh cũ nếu có và không phải là ảnh mặc định (if you have a default image for levels)
    // For simplicity, let's assume no default image for levels for now,
    // and we delete any old image passed.
    if (oldImagePath) {
        const fullOldPath = path.join(__dirname, '..', 'src', 'assets', oldImagePath);
        fs.unlink(fullOldPath, (err) => {
            if (err) {
                console.warn('Không thể xóa ảnh cấp độ cũ:', err.message);
            } else {
                console.log('Ảnh cấp độ cũ đã được xóa:', oldImagePath);
            }
        });
    }

    try {
        const imageUrl = `/images/levels/${req.file.filename}`; // This is the URL to be stored in DB
        res.status(200).json({
            message: 'Ảnh cấp độ đã được tải lên.',
            imageUrl: imageUrl, // Return the relative path
        });
    } catch (error) {
        console.error('Error uploading level image:', error);
        res.status(500).json({ error: 'Lỗi tải ảnh cấp độ lên.' });
    }
});

// Lấy danh sách tất cả Units (đơn vị bài học)

// ======================= UNIT ROUTES =======================

/**
 * @route GET /units
 * @desc Lấy danh sách tất cả units
 * @access Public
 */
app.get('/units', async (req, res) => {
    try {
        const result = await pool.query('SELECT unit_id, level_id, title, image_url FROM units ORDER BY unit_id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error('Lỗi khi lấy danh sách units:', err);
        res.status(500).json({ error: 'Lỗi server, không thể lấy dữ liệu units.' });
    }
});

/**
 * @route GET /units/by-level/:level_id
 * @desc Lấy danh sách units theo level_id
 * @access Public
 */
app.get('/units/by-level/:level_id', async (req, res) => {
    const level_id = parseInt(req.params.level_id);

    if (isNaN(level_id)) {
        return res.status(400).json({ error: 'ID cấp độ không hợp lệ.' });
    }

    try {
        const result = await pool.query(
            'SELECT unit_id, level_id, title, image_url FROM units WHERE level_id = $1 ORDER BY unit_id ASC',
            [level_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(`Lỗi khi lấy danh sách units cho level_id ${level_id}:`, err);
        res.status(500).json({ error: 'Lỗi server, không thể lấy dữ liệu units theo cấp độ.' });
    }
});

/**
 * @route POST /units
 * @desc Thêm unit mới
 * @access Public
 */
app.post('/units', async (req, res) => {
    const { level_id, title, image_url } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!level_id || !title) {
        return res.status(400).json({ error: 'Thiếu level_id hoặc title cho unit.' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO units (level_id, title, image_url) VALUES ($1, $2, $3) RETURNING *',
            [level_id, title, image_url]
        );
        res.status(201).json(result.rows[0]); // 201 Created cho việc tạo thành công
    } catch (err) {
        console.error('Lỗi thêm unit:', err);
        // Kiểm tra lỗi vi phạm khóa ngoại (level_id không tồn tại)
        if (err.code === '23503') { // Mã lỗi PostgreSQL cho vi phạm khóa ngoại
            return res.status(400).json({ error: 'level_id không tồn tại. Không thể thêm unit.' });
        }
        res.status(500).json({ error: 'Lỗi server khi thêm unit.' });
    }
});

/**
 * @route PUT /units/:id
 * @desc Sửa thông tin unit
 * @access Public
 */
app.put('/units/:id', async (req, res) => {
    const unit_id = parseInt(req.params.id);
    const { level_id, title, image_url } = req.body;

    // Kiểm tra unit_id hợp lệ
    if (isNaN(unit_id)) {
        return res.status(400).json({ error: 'ID unit không hợp lệ.' });
    }
    // Kiểm tra các trường bắt buộc
    if (!level_id || !title) {
        return res.status(400).json({ error: 'Thiếu level_id hoặc title để sửa unit.' });
    }

    try {
        const result = await pool.query(
            'UPDATE units SET level_id = $1, title = $2, image_url = $3 WHERE unit_id = $4 RETURNING *',
            [level_id, title, image_url, unit_id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Unit không tồn tại.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Lỗi sửa unit:', err);
        // Kiểm tra lỗi vi phạm khóa ngoại
        if (err.code === '23503') {
            return res.status(400).json({ error: 'level_id không tồn tại. Không thể sửa unit.' });
        }
        res.status(500).json({ error: 'Lỗi server khi sửa unit.' });
    }
});

/**
 * @route DELETE /units/:id
 * @desc Xóa unit và ảnh liên quan
 * @access Public
 */
app.delete('/units/:id', async (req, res) => {
    const unit_id = parseInt(req.params.id);

    if (isNaN(unit_id)) {
        return res.status(400).json({ error: 'ID unit không hợp lệ.' });
    }

    try {
        // Bước 1: Lấy đường dẫn ảnh trước khi xóa bản ghi trong DB
        const selectResult = await pool.query('SELECT image_url FROM units WHERE unit_id = $1', [unit_id]);
        if (selectResult.rowCount === 0) {
            return res.status(404).json({ error: 'Unit không tồn tại.' });
        }
        const { image_url } = selectResult.rows[0];

        // Bước 2: Xóa bản ghi unit khỏi cơ sở dữ liệu
        const deleteResult = await pool.query('DELETE FROM units WHERE unit_id = $1 RETURNING *', [unit_id]);

        // Bước 3: Xóa tệp ảnh liên quan nếu có
        if (image_url) {
            // Đảm bảo đường dẫn này khớp với cấu hình Multer của bạn
            const fullPath = path.join(__dirname, '..', 'src', 'assets', image_url);
            fs.unlink(fullPath, err => {
                if (err) {
                    console.warn(`Không thể xóa ảnh unit: ${image_url}`, err.message);
                } else {
                    console.log(`Ảnh unit đã được xóa: ${image_url}`);
                }
            });
        }

        res.json({ message: 'Unit đã được xóa thành công.', deletedUnit: deleteResult.rows[0] });
    } catch (err) {
        console.error('Lỗi xóa unit:', err);
        res.status(500).json({ error: 'Lỗi server khi xóa unit.' });
    }
});

/**
 * @route POST /api/upload-unit-image
 * @desc Tải lên ảnh cho unit
 * @access Public
 */
app.post('/api/upload-unit-image', uploadUnitImage.single('image'), (req, res) => {
    const { oldImagePath } = req.body; // Đường dẫn ảnh cũ (nếu đang cập nhật)

    if (!req.file) {
        return res.status(400).json({ error: 'Thiếu file ảnh để tải lên.' });
    }

    // Xóa ảnh cũ nếu oldImagePath được cung cấp
    if (oldImagePath) {
        const fullOldPath = path.join(__dirname, '..', 'src', 'assets', oldImagePath);
        fs.unlink(fullOldPath, err => {
            if (err) {
                console.warn(`Không thể xóa ảnh cũ của unit: ${oldImagePath}`, err.message);
            } else {
                console.log(`Ảnh cũ của unit đã được xóa: ${oldImagePath}`);
            }
        });
    }

    // Xây dựng URL ảnh để lưu vào cơ sở dữ liệu
    const imageUrl = `/images/units/${req.file.filename}`;
    res.status(200).json({ message: 'Ảnh unit đã được tải lên thành công.', imageUrl });
});

app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, username, role
      FROM users
      ORDER BY id ASC
    `);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Lỗi khi lấy danh sách người dùng:', err);
    res.status(500).json({ error: 'Lỗi server khi lấy danh sách người dùng' });
  }
});




// Route: Xoá người dùng theo ID
app.delete('/api/users/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    res.status(200).json({ message: 'Người dùng đã được xoá' });
  } catch (err) {
    console.error('Lỗi khi xoá người dùng:', err);
    res.status(500).json({ error: 'Lỗi server khi xoá người dùng' });
  }
});



// Route: Cập nhật vai trò (role) của người dùng
app.put('/api/users/:id/role', async (req, res) => {
  const userId = req.params.id;
  const { role } = req.body;

  if (!role) {
    return res.status(400).json({ error: 'Vui lòng cung cấp role' });
  }

  try {
    await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2',
      [role, userId]
    );
    res.status(200).json({ message: 'Cập nhật vai trò người dùng thành công' });
  } catch (err) {
    console.error('Lỗi khi cập nhật vai trò:', err);
    res.status(500).json({ error: 'Lỗi server khi cập nhật vai trò' });
  }
});



// Khởi động server
app.listen(3000, () => {
    console.log('✅ Server is running at http://localhost:3000');
});