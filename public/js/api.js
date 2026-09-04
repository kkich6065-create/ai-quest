// Shared API client — automatically attaches JWT token
const API_BASE = '/api';

function getToken() { return localStorage.getItem('aq_token'); }
function setToken(t) { localStorage.setItem('aq_token', t); }
function removeToken() { localStorage.removeItem('aq_token'); }
function getUser() {
  try { return JSON.parse(localStorage.getItem('aq_user') || 'null'); } catch { return null; }
}
function setUser(u) { localStorage.setItem('aq_user', JSON.stringify(u)); }
function removeUser() { localStorage.removeItem('aq_user'); }

async function apiRequest(method, path, body = null, requireAuth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (requireAuth) {
    const token = getToken();
    if (!token) { window.location.href = '/login.html'; return; }
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(API_BASE + path, {
    method, headers, body: body ? JSON.stringify(body) : null
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function logout() {
  removeToken(); removeUser();
  localStorage.removeItem('aq_quiz_state');
  window.location.href = '/login.html';
}

function adminLogout() {
  removeToken(); removeUser();
  window.location.href = '/admin-login.html';
}

function formatTime(seconds) {
  if (seconds == null || isNaN(seconds) || seconds < 0) return '--:--';
  const sec = Math.floor(seconds);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

// Star canvas
function initStars(canvasId = 'star-canvas') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let stars = [];
  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  function createStars() {
    stars = Array.from({length: 150}, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.3,
      a: Math.random(),
      speed: Math.random() * 0.008 + 0.002
    }));
  }
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach(s => {
      s.a += s.speed;
      const alpha = (Math.sin(s.a) + 1) / 2 * 0.8 + 0.1;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,220,255,${alpha})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  resize(); createStars(); draw();
  window.addEventListener('resize', () => { resize(); createStars(); });
}
