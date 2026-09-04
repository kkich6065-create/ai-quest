// Redirect if already logged in
(function() {
  const token = getToken();
  const user = getUser();
  if (token && user && user.role === 'participant') {
    window.location.href = '/dashboard.html';
  }
})();

initStars();

function switchTab(tab) {
  const isLogin = tab === 'login';
  document.getElementById('form-login').style.display = isLogin ? 'block' : 'none';
  document.getElementById('form-register').style.display = isLogin ? 'none' : 'block';
  document.getElementById('tab-login').classList.toggle('active', isLogin);
  document.getElementById('tab-register').classList.toggle('active', !isLogin);
}

function showAlert(id, msg, type='error') {
  const el = document.getElementById(id);
  el.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
  setTimeout(() => { el.innerHTML = ''; }, 5000);
}

async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  btn.disabled = true; btn.textContent = '⏳ Logging in...';
  try {
    const data = await apiRequest('POST', '/auth/login', {
      email: document.getElementById('login-email').value,
      password: document.getElementById('login-password').value
    }, false);
    setToken(data.token);
    setUser({ ...data.user, role: 'participant' });
    window.location.href = '/dashboard.html';
  } catch (err) {
    showAlert('login-alert', err.message);
    btn.disabled = false; btn.textContent = '🚀 Login';
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const btn = document.getElementById('reg-btn');
  btn.disabled = true; btn.textContent = '⏳ Creating account...';
  try {
    const data = await apiRequest('POST', '/auth/register', {
      name: document.getElementById('reg-name').value,
      email: document.getElementById('reg-email').value,
      password: document.getElementById('reg-password').value
    }, false);
    setToken(data.token);
    setUser({ ...data.user, role: 'participant' });
    window.location.href = '/dashboard.html';
  } catch (err) {
    showAlert('register-alert', err.message);
    btn.disabled = false; btn.textContent = '✨ Create Account';
  }
}
