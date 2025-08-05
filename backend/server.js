const express = require('express');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = 5000;

const JWT_SECRET = 'faiz123';
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// MySQL config for async/await
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // your MySQL password
  database: 'learning_portal',
};

// Test database connection on startup
async function testDatabaseConnection() {
  try {
    const conn = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected successfully!');
    await conn.end();
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    console.log('Please check:');
    console.log('1. MySQL server is running');
    console.log('2. Database "learning_portal" exists');
    console.log('3. Username and password are correct');
    console.log('4. MySQL is running on localhost:3306');
  }
}

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// JWT Auth Middleware
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Test endpoint (no authentication required)
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running!', timestamp: new Date().toISOString() });
});

// Register
app.post('/api/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  try {
    const conn = await mysql.createConnection(dbConfig);
    const [existing] = await conn.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      await conn.end();
      return res.status(409).json({ error: 'Email already exists' });
    }
    await conn.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [name, email, password, role]);
    await conn.end();
    return res.status(201).json({ message: 'Registered successfully' });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Database error: ' + err.message });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) {
    return res.status(400).json({ error: "All fields are required" });
  }
  try {
    const conn = await mysql.createConnection(dbConfig);
    const [results] = await conn.query("SELECT * FROM users WHERE email = ? AND role = ?", [email, role]);
    await conn.end();
    if (results.length === 0) {
      return res.status(401).json({ error: "No user found with this email and role" });
    }
    const user = results[0];
    if (user.password !== password) {
      return res.status(401).json({ error: "Invalid password" });
    }
    const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: "1d" });
    return res.status(200).json({
      token,
      user: { name: user.name, role: user.role }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: "Database error: " + err.message });
  }
});

// Protected dashboard example
app.get('/api/dashboard', verifyToken, (req, res) => {
  res.json({ message: `Welcome ${req.user.email}, you are a ${req.user.role}` });
});

// Add Course (with file upload) - Updated for your schema
app.post("/api/courses", verifyToken, upload.fields([{ name: "video" }, { name: "pdf" }]), async (req, res) => {
  const { title, category, description, price, duration } = req.body;
  const hasVideo = req.files.video && req.files.video.length > 0;
  const hasPdf = req.files.pdf && req.files.pdf.length > 0;

  // Require at least one file
  if (!title || !category || !description || !price || !duration || (!hasVideo && !hasPdf)) {
    return res.status(400).json({ error: "All fields and at least one file (video or PDF) are required" });
  }

  const videoUrl = hasVideo ? "/uploads/" + req.files.video[0].filename : "";
  const pdfUrl = hasPdf ? "/uploads/" + req.files.pdf[0].filename : "";

  try {
    const conn = await mysql.createConnection(dbConfig);
    const [result] = await conn.query(
      "INSERT INTO courses (title, category, description, price, duration, instructor_id, videoUrl, pdfUrl, published) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)",
      [title, category, description, price, duration, req.user.id, videoUrl, pdfUrl]
    );
    await conn.end();
    res.json({ success: true, courseId: result.insertId });
  } catch (err) {
    console.error('Add course error:', err);
    res.status(500).json({ error: "DB error: " + err.message });
  }
});

// Get Instructor's Courses (with average rating) - Updated for your schema
app.get("/api/instructor/courses", verifyToken, async (req, res) => {
  try {
    const conn = await mysql.createConnection(dbConfig);
    const [courses] = await conn.query("SELECT * FROM courses WHERE instructor_id = ?", [req.user.id]);
    for (let course of courses) {
      const [ratings] = await conn.query("SELECT AVG(rating) as avg FROM ratings WHERE course_id=?", [course.id]);
      course.averageRating = ratings[0].avg || null;
    }
    await conn.end();
    res.json(courses);
  } catch (err) {
    console.error('Get courses error:', err);
    res.status(500).json({ error: "DB error: " + err.message });
  }
});

// Get all courses (for students to browse) - ADD THIS ENDPOINT
app.get("/api/courses", async (req, res) => {
  try {
    const conn = await mysql.createConnection(dbConfig);
    const [courses] = await conn.query(`
      SELECT c.*, u.name as instructor_name 
      FROM courses c 
      LEFT JOIN users u ON c.instructor_id = u.id 
      WHERE c.published = 1
    `);
    
    // Add average rating for each course
    for (let course of courses) {
      const [ratings] = await conn.query("SELECT AVG(rating) as avg FROM ratings WHERE course_id=?", [course.id]);
      course.rating = ratings[0].avg ? parseFloat(ratings[0].avg).toFixed(1) : null;
    }
    
    await conn.end();
    res.json(courses);
  } catch (err) {
    console.error('Get all courses error:', err);
    res.status(500).json({ error: "DB error: " + err.message });
  }
});

// Edit course
app.put("/api/courses/:id", verifyToken, upload.fields([{ name: "video" }, { name: "pdf" }]), async (req, res) => {
  const { title, category, description, price, duration } = req.body;
  const updateFields = [];
  const params = [];
  if (title) { updateFields.push("title=?"); params.push(title); }
  if (category) { updateFields.push("category=?"); params.push(category); }
  if (description) { updateFields.push("description=?"); params.push(description); }
  if (price) { updateFields.push("price=?"); params.push(price); }
  if (duration) { updateFields.push("duration=?"); params.push(duration); }
  if (req.files.video) { updateFields.push("videoUrl=?"); params.push("/uploads/" + req.files.video[0].filename); }
  if (req.files.pdf) { updateFields.push("pdfUrl=?"); params.push("/uploads/" + req.files.pdf[0].filename); }
  params.push(req.params.id);

  try {
    const conn = await mysql.createConnection(dbConfig);
    await conn.query(`UPDATE courses SET ${updateFields.join(", ")} WHERE id=?`, params);
    await conn.end();
    res.json({ success: true });
  } catch (err) {
    console.error('Update course error:', err);
    res.status(500).json({ error: "DB error: " + err.message });
  }
});

// Delete course
app.delete("/api/courses/:id", verifyToken, async (req, res) => {
  try {
    const conn = await mysql.createConnection(dbConfig);

    // Check if course belongs to the instructor
    const [courses] = await conn.query(
      "SELECT * FROM courses WHERE id=? AND instructor_id=?",
      [req.params.id, req.user.id]
    );
    if (courses.length === 0) {
      await conn.end();
      return res.status(403).json({ error: "You are not allowed to delete this course." });
    }

    // Delete enrollments first
    await conn.query("DELETE FROM enrollments WHERE course_id=?", [req.params.id]);
    // Delete ratings
    await conn.query("DELETE FROM ratings WHERE course_id=?", [req.params.id]);
    // Delete the course
    await conn.query("DELETE FROM courses WHERE id=?", [req.params.id]);
    await conn.end();
    res.json({ success: true });
  } catch (err) {
    console.error('Delete course error:', err);
    res.status(500).json({ error: "DB error: " + err.message });
  }
});

// Add rating to course - Updated for your schema
app.post("/api/courses/:id/rate", verifyToken, async (req, res) => {
  const { rating } = req.body;
  try {
    const conn = await mysql.createConnection(dbConfig);
    await conn.query("INSERT INTO ratings (course_id, user_id, rating) VALUES (?, ?, ?)", [req.params.id, req.user.id, rating]);
    await conn.end();
    res.json({ success: true });
  } catch (err) {
    console.error('Add rating error:', err);
    res.status(500).json({ error: "DB error: " + err.message });
  }
});

// Get total students
app.get("/api/total-students", verifyToken, async (req, res) => {
  try {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.query("SELECT COUNT(*) as total FROM users WHERE role = 'student'");
    await conn.end();
    res.json({ total: rows[0].total });
  } catch (err) {
    console.error('Get students error:', err);
    res.status(500).json({ error: "DB error: " + err.message });
  }
});

// Enroll in a course
app.post("/api/enroll", verifyToken, async (req, res) => {
  const { course_id } = req.body;
  
  if (!course_id) {
    return res.status(400).json({ error: "Course ID is required" });
  }

  try {
    const conn = await mysql.createConnection(dbConfig);
    
    // Check if already enrolled
    const [existing] = await conn.query(
      "SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?",
      [req.user.id, course_id]
    );
    
    if (existing.length > 0) {
      await conn.end();
      return res.status(409).json({ error: "Already enrolled in this course" });
    }
    
    // Check if course exists
    const [course] = await conn.query("SELECT * FROM courses WHERE id = ?", [course_id]);
    if (course.length === 0) {
      await conn.end();
      return res.status(404).json({ error: "Course not found" });
    }
    
    // Enroll the user
    await conn.query(
      "INSERT INTO enrollments (user_id, course_id, enrolled_at) VALUES (?, ?, NOW())",
      [req.user.id, course_id]
    );
    
    await conn.end();
    res.json({ success: true, message: "Enrolled successfully" });
  } catch (err) {
    console.error('Enrollment error:', err);
    res.status(500).json({ error: "DB error: " + err.message });
  }
});

// Get user's enrolled courses
app.get("/api/my-courses", verifyToken, async (req, res) => {
  try {
    const conn = await mysql.createConnection(dbConfig);
    
    const [enrolledCourses] = await conn.query(`
      SELECT c.*, u.name as instructor_name, e.enrolled_at
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      LEFT JOIN users u ON c.instructor_id = u.id
      WHERE e.user_id = ?
      ORDER BY e.enrolled_at DESC
    `, [req.user.id]);
    
    await conn.end();
    res.json(enrolledCourses);
  } catch (err) {
    console.error('Get enrolled courses error:', err);
    res.status(500).json({ error: "DB error: " + err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log('Testing database connection...');
  testDatabaseConnection();
});