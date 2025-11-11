// server.js
require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { pool } = require('./db');

const app = express();
app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173', credentials: true })); // adjust if needed

function createToken(email) {
  return jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

function auth(req, res, next) {
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Missing token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// Basic email/password validators (simple demo)
const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const isStrongPwd = (s) => typeof s === 'string' && s.length >= 8;

// SIGN UP: create user in MySQL
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'Email & password required' });
    if (!isEmail(email)) return res.status(400).json({ message: 'Invalid email format' });
    if (!isStrongPwd(password)) return res.status(400).json({ message: 'Password must be ≥ 8 chars' });

    const hash = await bcrypt.hash(password, 10);

    const sql = 'INSERT INTO users (email, password_hash) VALUES (?, ?)';
    await pool.execute(sql, [email.toLowerCase(), hash]);

    const token = createToken(email.toLowerCase());
    return res.json({ token, email: email.toLowerCase() });
  } catch (err) {
    // Handle duplicate email
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'User already exists' });
    }
    console.error('Signup error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// LOGIN: verify against MySQL
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'Email & password required' });

    const sql = 'SELECT id, email, password_hash FROM users WHERE email = ? LIMIT 1';
    const [rows] = await pool.execute(sql, [email.toLowerCase()]);
    if (!rows.length) return res.status(401).json({ message: 'Invalid credentials' });

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = createToken(user.email);
    return res.json({ token, email: user.email });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Protected example
app.get('/api/me', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, email, created_at FROM users WHERE email = ? LIMIT 1', [req.user.email]);
    if (!rows.length) return res.status(404).json({ message: 'Not found' });
    return res.json(rows[0]);
  } catch (err) {
    console.error('Me error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
