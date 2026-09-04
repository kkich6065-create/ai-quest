require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Init DB (runs schema + seed)
require('./database');

const app = express();
app.use(cors());
app.use(express.json());

// Static frontend
app.use(express.static(path.join(__dirname, '..', 'public')));

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/quiz', require('./routes/quiz'));
app.use('/api/admin', require('./routes/admin'));

// Fallback: serve index.html for any unknown route
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`\n🚀 AI Quest server running at http://${HOST}:${PORT}`);
  console.log(`   Admin login: ${process.env.ADMIN_EMAIL || 'admin@aiquest.com'}`);
});

