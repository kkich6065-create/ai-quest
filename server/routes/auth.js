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

  const normalizedEmail = email.toLowerCase().trim();
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@aiquest.com').toLowerCase().trim();
  if (normalizedEmail === adminEmail) {
    return res.status(400).json({ error: 'This email address is reserved for administration.' });
  }

  const existing = db.get('participants').find({ email: normalizedEmail }).value();
  if (existing) return res.status(409).json({ error: 'An account with this email already exists' });

  const hash = bcrypt.hashSync(password, 10);
  const participant = {
    id: nextId('participants'),
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password_hash: hash,
    created_at: new Date().toISOString()
  };
  db.get('participants').push(participant).write();

  const token = jwt.sign(
    { id: participant.id, name: participant.name, email: participant.email, role: 'participant' },
    process.env.JWT_SECRET, { expiresIn: '8h' }
  );
  res.json({ token, user: { id: participant.id, name: participant.name, email: participant.email } });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  db.read();
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const participant = db.get('participants').find({ email: email.toLowerCase() }).value();
  if (!participant || !bcrypt.compareSync(password, participant.password_hash))
    return res.status(401).json({ error: 'Invalid email or password' });

  const token = jwt.sign(
    { id: participant.id, name: participant.name, email: participant.email, role: 'participant' },
    process.env.JWT_SECRET, { expiresIn: '8h' }
  );
  res.json({ token, user: { id: participant.id, name: participant.name, email: participant.email } });
});

// POST /api/auth/admin/login
router.post('/admin/login', (req, res) => {
  db.read();
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const admin = db.get('admins').find({ email: email.toLowerCase() }).value();
  if (!admin || !bcrypt.compareSync(password, admin.password_hash))
    return res.status(401).json({ error: 'Invalid admin credentials' });

  const token = jwt.sign(
    { id: admin.id, email: admin.email, role: 'admin' },
    process.env.JWT_SECRET, { expiresIn: '12h' }
  );
  res.json({ token, user: { email: admin.email, role: 'admin' } });
});

// GET /api/auth/me
const { authMiddleware } = require('../middleware/auth');
router.get('/me', authMiddleware, (req, res) => {
  db.read();
  res.json({ user: req.user });
});

module.exports = router;
