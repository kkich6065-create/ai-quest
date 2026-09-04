const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, nextId } = require('../database');
const router = express.Router();

// POST /api/auth/register
router.post('/register', (req, res) => {
  db.read();
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email, and password are required' });

  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const normalizedEmail = String(email).toLowerCase().trim();
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@aiquest.com').toLowerCase().trim();

  if (normalizedEmail === adminEmail) {
    return res.status(400).json({ error: 'This email address is reserved for administration.' });
  }

  const existing = db.get('participants').find(p => p.email && String(p.email).toLowerCase().trim() === normalizedEmail).value();
  if (existing) return res.status(409).json({ error: 'An account with this email already exists' });

  const hash = bcrypt.hashSync(String(password).trim(), 10);
  const participant = {
    id: nextId('participants'),
    name: name.trim(),
    email: normalizedEmail,
    password_hash: hash,
    created_at: new Date().toISOString()
  };
  db.get('participants').push(participant).write();

  const jwtSecret = process.env.JWT_SECRET || 'aiquest_super_secret_key_2024_change_in_production';
  const token = jwt.sign(
    { id: participant.id, name: participant.name, email: participant.email, role: 'participant' },
    jwtSecret,
    { expiresIn: '8h' }
  );
  res.json({ token, user: { id: participant.id, name: participant.name, email: participant.email } });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  db.read();
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const normalizedEmail = String(email).toLowerCase().trim();
  const inputPassword = String(password).trim();

  const participant = db.get('participants').find(p => p.email && String(p.email).toLowerCase().trim() === normalizedEmail).value();
  if (!participant || !bcrypt.compareSync(inputPassword, participant.password_hash))
    return res.status(401).json({ error: 'Invalid email or password' });

  const jwtSecret = process.env.JWT_SECRET || 'aiquest_super_secret_key_2024_change_in_production';
  const token = jwt.sign(
    { id: participant.id, name: participant.name, email: participant.email, role: 'participant' },
    jwtSecret,
    { expiresIn: '8h' }
  );
  res.json({ token, user: { id: participant.id, name: participant.name, email: participant.email } });
});

// POST /api/auth/admin/login
router.post('/admin/login', (req, res) => {
  db.read();
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const normalizedEmail = String(email).toLowerCase().trim();
  const inputPassword = String(password).replace(/^["']|["']$/g, '').trim();

  const admin = db.get('admins').find(a => a.email && String(a.email).toLowerCase().trim() === normalizedEmail).value();
  if (!admin) {
    console.log(`⚠️ Admin login attempt failed: Account not found for "${normalizedEmail}"`);
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }

  const isMatch = bcrypt.compareSync(inputPassword, admin.password_hash);
  if (!isMatch) {
    console.log(`⚠️ Admin login attempt failed: Password mismatch for "${normalizedEmail}"`);
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }

  const jwtSecret = process.env.JWT_SECRET || 'aiquest_super_secret_key_2024_change_in_production';
  const token = jwt.sign(
    { id: admin.id, email: admin.email, role: 'admin' },
    jwtSecret,
    { expiresIn: '12h' }
  );

  console.log(`🔑 Admin login successful for "${normalizedEmail}"`);
  res.json({ token, user: { email: admin.email, role: 'admin' } });
});

// GET /api/auth/me
const { authMiddleware } = require('../middleware/auth');
router.get('/me', authMiddleware, (req, res) => {
  db.read();
  res.json({ user: req.user });
});

module.exports = router;
