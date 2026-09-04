const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'quiz.db.json');
const adapter = new FileSync(dbPath);
const db = low(adapter);

// ─── Default schema ───────────────────────────────────────────────────────────
db.defaults({
  participants: [],
  admins: [],
  quiz_attempts: [],
  _nextIds: {
    participants: 1,
    admins: 1,
    quiz_attempts: 1
  }
}).write();

// ─── Helper: auto-increment IDs ───────────────────────────────────────────────
function nextId(table) {
  db.read();

  let id = db.get(`_nextIds.${table}`).value();

  if (id == null || typeof id !== 'number' || isNaN(id)) {
    const existing = db.get(table).value() || [];
    const maxId = existing.reduce(
      (max, item) => Math.max(max, item.id || 0),
      0
    );
    id = maxId + 1;
  }

  db.set(`_nextIds.${table}`, id + 1).write();
  return id;
}

// ─── Seed / Update Admin ──────────────────────────────────────────────────────
function seedAdmin() {
  db.read();

  const rawEmail = process.env.ADMIN_EMAIL || 'admin@aiquest.com';
  const email = String(rawEmail).toLowerCase().trim();

  const rawPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
  // Clean up any surrounding quotes or extra spaces from env vars
  const password = String(rawPassword).replace(/^["']|["']$/g, '').trim();

  const hash = bcrypt.hashSync(password, 12);

  const admins = db.get('admins').value() || [];
  const existing = admins.find(a => a.email && String(a.email).toLowerCase().trim() === email);

  if (!existing) {
    const newAdmin = {
      id: nextId('admins'),
      email: email,
      password_hash: hash
    };
    db.get('admins').push(newAdmin).write();
    console.log(`✅ Admin seeded: ${email}`);
  } else {
    db.get('admins')
      .find(a => a.email && String(a.email).toLowerCase().trim() === email)
      .assign({
        email: email,
        password_hash: hash
      })
      .write();
    console.log(`✅ Admin password updated: ${email}`);
  }
}

seedAdmin();

module.exports = {
  db,
  nextId
};