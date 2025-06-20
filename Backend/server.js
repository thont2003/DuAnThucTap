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

// Cấu hình thư mục lưu trữ ảnh cấp độ
const levelImagesDir = path.join(__dirname, '..', 'src', 'assets', 'images', 'levels');
if (!fs.existsSync(levelImagesDir)) {
    fs.mkdirSync(levelImagesDir, { recursive: true });
}

// Cung cấp các file ảnh cấp độ tĩnh
app.use('/images/levels', express.static(levelImagesDir));
// Cấu hình Multer để tải lên ảnh cấp độ
// Cấu hình Multer để tải lên ảnh cấp độ
const levelImageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, levelImagesDir); // Use the dedicated directory for level images
    },
    filename: (req, file, cb) => {
        const ext = '.png';
        // CORRECTED: Use backticks (`) for template literals
        const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
        cb(null, filename);
    }
});

const uploadLevelImage = multer({
    storage: levelImageStorage,
    fileFilter: (req, file, cb) => {
        const filetypes = /png|jpg|jpeg/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Chỉ hỗ trợ file PNG/JPG/JPEG.'));
    },
    limits: { fileSize: 5 * 1024 * 1024 } // Limit 5MB
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

app.get('/units', async (req, res) => {
    try {
        const result = await pool.query('SELECT unit_id, level_id, title, image_url FROM units ORDER BY unit_id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error('Lỗi khi lấy danh sách units:', err);
        res.status(500).json({ error: 'Lỗi server, không thể lấy dữ liệu units.' });
    }
});

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

// Thêm đoạn code này vào file backend (ví dụ: app.js hoặc server.js) của bạn

app.get('/tests', async (req, res) => {
    try {
        const { level_id, unit_id } = req.query; // Lấy level_id và unit_id từ query parameters

        let query = 'SELECT test_id, level_id, unit_id, title, description, image_url, play_count FROM tests';
        const params = [];
        const conditions = [];

        if (level_id) {
            conditions.push('level_id = $' + (conditions.length + 1));
            params.push(parseInt(level_id));
        }
        if (unit_id) {
            conditions.push('unit_id = $' + (conditions.length + 1));
            params.push(parseInt(unit_id));
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY test_id ASC'; // Sắp xếp theo test_id

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Lỗi khi lấy danh sách tests:', err);
        res.status(500).json({ error: 'Lỗi server, không thể lấy dữ liệu tests.' });
    }
});
app.post('/tests', async (req, res) => {
    const { level_id, unit_id, title, image_url, description } = req.body;

    if (!level_id || !title) {
        return res.status(400).json({ error: 'Thiếu level_id hoặc title cho bài test.' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO tests (level_id, unit_id, title, image_url, description)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [parseInt(level_id), unit_id ? parseInt(unit_id) : null, title, image_url || null, description || null]
        );
        res.status(201).json(result.rows[0]); // 201 Created
    } catch (err) {
        console.error('Lỗi khi thêm bài test:', err);
        if (err.code === '23503') { // Foreign key violation
            return res.status(400).json({ error: 'level_id hoặc unit_id không tồn tại. Không thể thêm bài test.' });
        }
        res.status(500).json({ error: 'Lỗi server khi thêm bài test.' });
    }
});
app.put('/tests/:id', async (req, res) => {
    const test_id = parseInt(req.params.id);
    const { level_id, unit_id, title, image_url, description } = req.body;

    if (isNaN(test_id)) {
        return res.status(400).json({ error: 'ID bài test không hợp lệ.' });
    }
    if (!level_id || !title) {
        return res.status(400).json({ error: 'Thiếu level_id hoặc title để sửa bài test.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Lấy đường dẫn ảnh hiện tại của bài test từ database trước khi cập nhật
        const oldTestResult = await client.query(
            'SELECT image_url FROM tests WHERE test_id = $1',
            [test_id]
        );
        const oldImageUrl = oldTestResult.rows[0] ? oldTestResult.rows[0].image_url : null;

        // 2. Cập nhật thông tin bài test trong database
        const updateTestQuery = `
            UPDATE tests
            SET level_id = $1, unit_id = $2, title = $3, image_url = $4, description = $5
            WHERE test_id = $6
            RETURNING *
        `;
        const updatedTestResult = await client.query(
            updateTestQuery,
            [
                parseInt(level_id),
                unit_id ? parseInt(unit_id) : null,
                title,
                image_url || null,
                description || null,
                test_id
            ]
        );

        if (updatedTestResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Không tìm thấy bài test để cập nhật.' });
        }

        // 3. Xử lý xóa file ảnh cũ nếu có ảnh mới được cung cấp và khác ảnh cũ, hoặc nếu ảnh cũ bị xóa
        if (oldImageUrl && (image_url !== oldImageUrl || image_url === null)) {
            // Đảm bảo deleteImageFile có thể xử lý đường dẫn tương đối của ảnh tests
            deleteImageFile(oldImageUrl);
        }

        await client.query('COMMIT');
        res.status(200).json(updatedTestResult.rows[0]);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Lỗi khi cập nhật bài test:', err);
        if (err.code === '23503') { // Foreign key violation
            return res.status(400).json({ error: 'level_id hoặc unit_id không tồn tại. Không thể cập nhật bài test.' });
        }
        res.status(500).json({ error: 'Lỗi server khi cập nhật bài test.' });
    } finally {
        client.release();
    }
});
app.delete('/tests/:id', async (req, res) => {
    const test_id = parseInt(req.params.id);

    if (isNaN(test_id)) {
        return res.status(400).json({ error: 'ID bài test không hợp lệ.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Lấy đường dẫn ảnh của bài test trước khi xóa khỏi database
        const getImageUrlResult = await client.query(
            'SELECT image_url FROM tests WHERE test_id = $1',
            [test_id]
        );
        const imageUrlToDelete = getImageUrlResult.rows[0] ? getImageUrlResult.rows[0].image_url : null;

        // 2. Xóa bài test khỏi database
        const deleteResult = await client.query(
            'DELETE FROM tests WHERE test_id = $1 RETURNING *',
            [test_id]
        );

        if (deleteResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Không tìm thấy bài test.' });
        }

        await client.query('COMMIT'); // Commit transaction trước khi xóa file vật lý

        // 3. Xóa file ảnh vật lý trên server sau khi database đã được cập nhật thành công
        if (imageUrlToDelete) {
            // Đảm bảo deleteImageFile có thể xử lý đường dẫn tương đối của ảnh tests
            deleteImageFile(imageUrlToDelete);
        }

        res.status(200).json({ message: 'Đã xóa bài test thành công.', deletedTest: deleteResult.rows[0] });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Lỗi khi xóa bài test:', err);
        res.status(500).json({ error: 'Lỗi server khi xóa bài test.' });
    } finally {
        client.release();
    }
});
app.post('/api/upload-test-image', uploadTestImage.single('testImage'), (req, res) => {
    if (req.file) {
        const oldImagePath = req.body.oldImagePath;
        if (oldImagePath) {
            // Đảm bảo oldImagePath là đường dẫn tương đối đúng với hàm deleteImageFile
            deleteTestImageFile(oldImagePath);
        }
        const imageUrl = `/images/tests/${req.file.filename}`;
        res.status(200).json({ imageUrl });
    } else {
        res.status(400).json({ error: 'Không có file ảnh nào được tải lên.' });
    }
}, (error, req, res, next) => {
    console.error('Lỗi khi tải ảnh bài test:', error);
    res.status(400).json({ error: error.message || 'Lỗi khi tải ảnh lên.' });
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

app.post('/api/upload-question-image', uploadQuestionImage.single('questionImage'), (req, res) => {
    if (req.file) {
        // Nếu có đường dẫn ảnh cũ được gửi trong body, tiến hành xóa ảnh cũ đó
        const oldImagePath = req.body.oldImagePath;
        if (oldImagePath) {
            deleteImageFile(oldImagePath); // Sử dụng hàm xóa file đã định nghĩa
        }
        // Trả về đường dẫn tương đối của ảnh mới được tải lên
        const imageUrl = `/images/questions/${req.file.filename}`;
        res.status(200).json({ imageUrl });
    } else {
        res.status(400).json({ error: 'Không có file ảnh nào được tải lên.' });
    }
}, (error, req, res, next) => {
    // Xử lý lỗi từ Multer (ví dụ: kích thước file quá lớn, sai định dạng file)
    console.error('Lỗi khi tải ảnh câu hỏi:', error);
    res.status(400).json({ error: error.message || 'Lỗi khi tải ảnh lên.' });
}); 

app.get('/questiontypes', async (req, res) => {
  try {
    const result = await pool.query('SELECT type_id, type_name FROM questiontypes ORDER BY type_id ASC');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Lỗi khi lấy loại câu hỏi:', error);
    res.status(500).json({ error: 'Lỗi server.' });
  }
});

app.get('/questions', async (req, res) => {
  const { type_id, level_id, unit_id, test_id } = req.query;

  if (!type_id || isNaN(type_id)) {
    return res.status(400).json({ error: 'type_id không hợp lệ.' });
  }

  try {
    const filters = ['q.type_id = $1'];
    const values = [parseInt(type_id)];
    let paramIdx = 2;

    if (level_id && !isNaN(level_id)) {
      filters.push(`t.level_id = $${paramIdx}`);
      values.push(parseInt(level_id));
      paramIdx++;
    }

    if (unit_id && !isNaN(unit_id)) {
      filters.push(`t.unit_id = $${paramIdx}`);
      values.push(parseInt(unit_id));
      paramIdx++;
    }

    if (test_id && !isNaN(test_id)) {
      filters.push(`q.test_id = $${paramIdx}`);
      values.push(parseInt(test_id));
      paramIdx++;
    }

    const query = `
      SELECT q.question_id, q.test_id, q.type_id, q.content, q.image_path, q.correct_answer, q.audio_path
      FROM questions q
      LEFT JOIN tests t ON q.test_id = t.test_id
      WHERE ${filters.join(' AND ')}
      ORDER BY q.question_id ASC
    `;

    const result = await pool.query(query, values);
    const questions = result.rows;
    const questionIds = questions.map(q => q.question_id);

    let answers = [];
    if (questionIds.length > 0 && parseInt(type_id) === 1) {
      const answersResult = await pool.query(
        'SELECT answer_id, question_id, answer_text, is_correct FROM answers WHERE question_id = ANY($1::int[])',
        [questionIds]
      );
      answers = answersResult.rows;
    }

    const questionsWithAnswers = questions.map(q => ({
      ...q,
      answers: parseInt(type_id) === 1
        ? answers.filter(a => a.question_id === q.question_id)
        : [],
    }));

    res.status(200).json(questionsWithAnswers);
  } catch (err) {
    console.error('Lỗi khi lấy câu hỏi:', err);
    res.status(500).json({ error: 'Lỗi server.' });
  }
});

app.post('/questions', async (req, res) => {
    const {
        type_id,
        test_id,
        content,
        image_path, // Đã đổi tên từ 'image' sang 'image_path' để phù hợp với database
        correct_answer,
        answers,
        audio_path
    } = req.body;

    if (!type_id || isNaN(type_id) || !content) {
        return res.status(400).json({ error: 'Thiếu type_id hoặc content không hợp lệ.' });
    }

    if (parseInt(type_id) === 1) { // Kiểm tra cho loại câu hỏi trắc nghiệm
        if (!Array.isArray(answers) || answers.length !== 4) {
            return res.status(400).json({ error: 'Câu hỏi trắc nghiệm phải có đúng 4 đáp án.' });
        }
    }

    const client = await pool.connect(); // Bắt đầu một transaction database
    try {
        await client.query('BEGIN');

        const insertQuestionQuery = `
            INSERT INTO questions (test_id, type_id, content, image_path, correct_answer, audio_path)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING question_id
        `;
        const insertValues = [
            test_id || null, // test_id có thể null
            type_id,
            content,
            image_path || null, // Lưu đường dẫn ảnh nhận được từ frontend
            parseInt(type_id) === 2 ? correct_answer : null, // correct_answer chỉ cho loại câu hỏi điền/tự luận
            audio_path || null // audio_path có thể null
        ];

        const result = await client.query(insertQuestionQuery, insertValues);
        const questionId = result.rows[0].question_id;

        let insertedAnswers = [];

        if (parseInt(type_id) === 1 && Array.isArray(answers)) {
            const insertAnswerQuery = `
                INSERT INTO answers (question_id, answer_text, is_correct)
                VALUES ($1, $2, $3)
                RETURNING answer_id, answer_text, is_correct
            `;

            for (const a of answers) {
                // Đảm bảo is_correct là boolean để lưu vào database
                const is_correct_bool = typeof a.is_correct === 'boolean' ? a.is_correct : (a.is_correct === 'true' || a.is_correct === 1);
                const answerResult = await client.query(insertAnswerQuery, [questionId, a.answer_text, is_correct_bool]);
                insertedAnswers.push({
                    answer_id: answerResult.rows[0].answer_id,
                    question_id: questionId,
                    answer_text: answerResult.rows[0].answer_text,
                    is_correct: answerResult.rows[0].is_correct
                });
            }
        }

        await client.query('COMMIT'); // Hoàn tất transaction

        const responseData = {
            question_id: questionId,
            test_id: test_id || null,
            type_id: parseInt(type_id),
            content,
            image_path: image_path || null,
            correct_answer: parseInt(type_id) === 2 ? correct_answer : null,
            audio_path: audio_path || null,
            answers: parseInt(type_id) === 1 ? insertedAnswers : []
        };

        res.status(201).json(responseData);

    } catch (error) {
        await client.query('ROLLBACK'); // Hoàn tác transaction nếu có lỗi
        console.error('Lỗi khi thêm câu hỏi:', error);
        res.status(500).json({ error: 'Lỗi server khi thêm câu hỏi.' });
    } finally {
        client.release(); // Giải phóng client khỏi pool
    }
});

app.put('/questions/:id', async (req, res) => {
    const questionId = parseInt(req.params.id);
    const {
        content,
        image_path,       // Đường dẫn ảnh mới hoặc null
        audio_path,       // Đã đổi tên từ 'audio' sang 'audio_path' cho nhất quán
        correct_answer,   // Đã đổi tên từ 'correct' sang 'correct_answer' cho nhất quán
        type_id,
        answers
    } = req.body;

    if (isNaN(questionId)) {
        return res.status(400).json({ error: 'ID câu hỏi không hợp lệ.' });
    }

    if (!content || !type_id) {
        return res.status(400).json({ error: 'Thiếu dữ liệu cập nhật.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Lấy đường dẫn ảnh hiện tại của câu hỏi từ database trước khi cập nhật
        const oldQuestionResult = await client.query(
            'SELECT image_path FROM questions WHERE question_id = $1',
            [questionId]
        );
        const oldImagePath = oldQuestionResult.rows[0] ? oldQuestionResult.rows[0].image_path : null;

        // 2. Cập nhật thông tin câu hỏi trong database
        const updateQuestionQuery = `
            UPDATE questions
            SET content = $1,
                image_path = $2,
                correct_answer = $3,
                audio_path = $4
            WHERE question_id = $5
            RETURNING question_id, test_id, type_id, content, image_path, correct_answer, audio_path
        `;
        const updatedQuestionResult = await client.query(
            updateQuestionQuery,
            [
                content,
                image_path || null, // Lưu đường dẫn ảnh mới (hoặc null)
                type_id === 2 ? correct_answer : null,
                audio_path || null,
                questionId
            ]
        );

        if (updatedQuestionResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Không tìm thấy câu hỏi để cập nhật.' });
        }
        const updatedQuestion = updatedQuestionResult.rows[0];

        // 3. Xử lý xóa file ảnh cũ nếu có ảnh mới được cung cấp và khác ảnh cũ, hoặc nếu ảnh cũ bị xóa
        if (oldImagePath && (image_path !== oldImagePath || image_path === null)) {
            deleteImageFile(oldImagePath);
        }

        // 4. Xóa tất cả đáp án cũ và thêm lại đáp án mới (nếu là câu hỏi trắc nghiệm)
        await client.query('DELETE FROM answers WHERE question_id = $1', [questionId]);
        if (type_id === 1 && Array.isArray(answers) && answers.length > 0) {
            // Kiểm tra số lượng đáp án cho câu hỏi trắc nghiệm
            if (answers.length !== 4) {
                 await client.query('ROLLBACK');
                 return res.status(400).json({ error: 'Câu hỏi trắc nghiệm phải có đúng 4 đáp án.' });
            }
            const insertAnswerQuery = `
                INSERT INTO answers (question_id, answer_text, is_correct)
                VALUES ($1, $2, $3)
            `;
            for (const a of answers) {
                const is_correct_bool = typeof a.is_correct === 'boolean' ? a.is_correct : (a.is_correct === 'true' || a.is_correct === 1);
                await client.query(insertAnswerQuery, [questionId, a.answer_text, is_correct_bool]);
            }
        }

        await client.query('COMMIT');

        // 5. Lấy lại các đáp án đã cập nhật để gửi về cho frontend trong response
        let answerRows = [];
        if (type_id === 1) {
            const answerResult = await pool.query(
                `SELECT answer_id, question_id, answer_text, is_correct FROM answers WHERE question_id = $1`,
                [questionId]
            );
            answerRows = answerResult.rows;
        }

        res.status(200).json({
            ...updatedQuestion,
            answers: type_id === 1 ? answerRows : []
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Lỗi khi cập nhật câu hỏi:', error);
        res.status(500).json({ error: 'Lỗi server khi cập nhật câu hỏi.' });
    } finally {
        client.release();
    }
});

app.delete('/questions/:id', async (req, res) => {
    const questionId = parseInt(req.params.id);
    if (isNaN(questionId)) {
        return res.status(400).json({ error: 'ID câu hỏi không hợp lệ.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Lấy đường dẫn ảnh của câu hỏi trước khi xóa khỏi database
        const getImagePathResult = await client.query(
            'SELECT image_path FROM questions WHERE question_id = $1',
            [questionId]
        );
        const imagePathToDelete = getImagePathResult.rows[0] ? getImagePathResult.rows[0].image_path : null;

        // 2. Xóa các câu trả lời liên quan đến câu hỏi này
        await client.query('DELETE FROM answers WHERE question_id = $1', [questionId]);

        // 3. Xóa câu hỏi khỏi database
        const deleteResult = await client.query(
            'DELETE FROM questions WHERE question_id = $1 RETURNING question_id',
            [questionId]
        );

        if (deleteResult.rows.length === 0) {
            await client.query('ROLLBACK'); // Hoàn tác nếu không tìm thấy câu hỏi
            return res.status(404).json({ error: 'Không tìm thấy câu hỏi.' });
        }

        await client.query('COMMIT'); // Commit transaction trước khi xóa file vật lý

        // 4. Xóa file ảnh vật lý trên server sau khi database đã được cập nhật thành công
        if (imagePathToDelete) {
            deleteImageFile(imagePathToDelete); // Sử dụng hàm xóa file đã định nghĩa
        }

        res.status(200).json({ message: 'Đã xóa câu hỏi thành công.' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Lỗi khi xóa câu hỏi:', error);
        res.status(500).json({ error: 'Lỗi server khi xóa câu hỏi.' });
    } finally {
        client.release();
    }
});


// Khởi động server
app.listen(3000, () => {
    console.log('✅ Server is running at http://localhost:3000');
});