// Guard: must be logged in as admin
(function() {
  const user = getUser();
  const token = getToken();
  if (!token || !user) { window.location.href = '/admin-login.html'; return; }
  if (user.role !== 'admin') { window.location.href = '/admin-login.html'; return; }
})();

initStars();

let leaderboardData = [];
let allParticipantsData = [];

async function loadData() {
  try {
    // Load stats
    const stats = await apiRequest('GET', '/admin/stats');
    document.getElementById('st-total').textContent = stats.total_registered;
    document.getElementById('st-started').textContent = stats.started;
    document.getElementById('st-completed').textContent = stats.completed;
    document.getElementById('st-pending').textContent = stats.not_started;
    document.getElementById('st-avg').textContent = stats.avg_score;
    document.getElementById('st-high').textContent = stats.highest_score;
    document.getElementById('st-fast').textContent = stats.fastest_seconds ? formatTime(stats.fastest_seconds) : '—';

    // Load leaderboard
    const lb = await apiRequest('GET', '/admin/leaderboard');
    leaderboardData = lb.leaderboard;
    renderLeaderboard();
    renderPodium();

    // Load all participants
    const parts = await apiRequest('GET', '/admin/participants');
    allParticipantsData = parts.participants;
    renderAllParticipants();
  } catch (err) {
    console.error('Failed to load data:', err);
  }
}

function renderLeaderboard() {
  const tbody = document.getElementById('lb-body');
  const empty = document.getElementById('lb-empty');
  const wrap = document.getElementById('table-wrap');

  if (!leaderboardData || leaderboardData.length === 0) {
    empty.style.display = 'block';
    wrap.style.display = 'none';
    return;
  }

  empty.style.display = 'none';
  wrap.style.display = 'block';
  tbody.innerHTML = '';

  leaderboardData.forEach(row => {
    const tr = document.createElement('tr');
    const rankDisplay = row.rank === 1 ? '🥇 1' : row.rank === 2 ? '🥈 2' : row.rank === 3 ? '🥉 3' : row.rank;
    tr.innerHTML = `
      <td><strong>${rankDisplay}</strong></td>
      <td>${escapeHtml(row.name)}</td>
      <td>${escapeHtml(row.email)}</td>
      <td>${row.easy_score}</td>
      <td>${row.medium_score}</td>
      <td>${row.hard_score}</td>
      <td><strong>${row.total_score}</strong></td>
      <td>${formatTime(row.completion_seconds)}</td>
      <td><span class="badge badge-success">Completed</span></td>
      <td>
        <button class="btn-view-details" onclick="viewDetails(${row.participant_id})">View Details</button>
        <button class="btn-remove-participant" onclick="openRemoveModal(${row.participant_id}, '${escapeJsAttr(row.name)}')">Remove</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderPodium() {
  const podiumSection = document.getElementById('podium-section');
  const podium = document.getElementById('podium');

  if (!leaderboardData || leaderboardData.length < 3) {
    podiumSection.style.display = 'none';
    return;
  }

  podiumSection.style.display = 'block';
  const [first, second, third] = leaderboardData;

  podium.innerHTML = `
    <div class="podium-place podium-2nd">
      <div class="podium-rank">🥈</div>
      <div class="podium-name">${escapeHtml(second.name)}</div>
      <div class="podium-score">${second.total_score} pts</div>
      <div class="podium-time">${formatTime(second.completion_seconds)}</div>
    </div>
    <div class="podium-place podium-1st">
      <div class="podium-rank">🥇</div>
      <div class="podium-name">${escapeHtml(first.name)}</div>
      <div class="podium-score">${first.total_score} pts</div>
      <div class="podium-time">${formatTime(first.completion_seconds)}</div>
    </div>
    <div class="podium-place podium-3rd">
      <div class="podium-rank">🥉</div>
      <div class="podium-name">${escapeHtml(third.name)}</div>
      <div class="podium-score">${third.total_score} pts</div>
      <div class="podium-time">${formatTime(third.completion_seconds)}</div>
    </div>
  `;

  // Add confetti effect
  launchConfetti();
}

function renderAllParticipants() {
  const tbody = document.getElementById('all-body');
  tbody.innerHTML = '';

  allParticipantsData.forEach((p, idx) => {
    const tr = document.createElement('tr');
    const statusBadge = p.status === 'completed' 
      ? '<span class="badge badge-success">Completed</span>'
      : p.status === 'in_progress'
      ? '<span class="badge badge-warning">In Progress</span>'
      : '<span class="badge badge-secondary">Not Started</span>';
    
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${escapeHtml(p.name)}</td>
      <td>${escapeHtml(p.email)}</td>
      <td>${statusBadge}</td>
      <td>${p.total_score !== null ? p.total_score : '—'}</td>
      <td>${p.completion_seconds !== null ? formatTime(p.completion_seconds) : '—'}</td>
      <td>
        <button class="btn-view-details" onclick="viewDetails(${p.id})">View Details</button>
        <button class="btn-remove-participant" onclick="openRemoveModal(${p.id}, '${escapeJsAttr(p.name)}')">Remove</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function filterTable() {
  const query = document.getElementById('search-input').value.toLowerCase();
  const rows = document.querySelectorAll('#lb-body tr, #all-body tr');
  
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(query) ? '' : 'none';
  });
}

function exportCSV() {
  if (!leaderboardData || leaderboardData.length === 0) {
    alert('No data to export');
    return;
  }

  const headers = ['Rank', 'Name', 'Email', 'Easy Score', 'Medium Score', 'Hard Score', 'Total Score', 'Completion Time (seconds)', 'Status'];
  const rows = leaderboardData.map(r => [
    r.rank,
    `"${r.name}"`,
    `"${r.email}"`,
    r.easy_score,
    r.medium_score,
    r.hard_score,
    r.total_score,
    r.completion_seconds,
    'Completed'
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `aiquest-leaderboard-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function escapeJsAttr(text) {
  if (!text) return '';
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Simple confetti effect
function launchConfetti() {
  const container = document.getElementById('confetti-container');
  if (!container) return;
  
  container.innerHTML = '';
  const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#AA96DA'];
  
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.style.cssText = `
      position: fixed;
      width: 10px;
      height: 10px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      left: ${Math.random() * 100}vw;
      top: -10px;
      border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
      animation: fall ${2 + Math.random() * 3}s linear forwards;
      z-index: 1000;
    `;
    container.appendChild(confetti);
  }

  // Add animation keyframes if not present
  if (!document.getElementById('confetti-style')) {
    const style = document.createElement('style');
    style.id = 'confetti-style';
    style.textContent = `
      @keyframes fall {
        to {
          transform: translateY(100vh) rotate(720deg);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Clean up after animation
  setTimeout(() => {
    container.innerHTML = '';
  }, 5000);
}

async function viewDetails(participantId) {
  try {
    const data = await apiRequest('GET', `/admin/participant/${participantId}/details`);
    renderDetailsModal(data);
    document.getElementById('details-modal').classList.add('active');
  } catch (err) {
    console.error('Failed to load participant details:', err);
    alert('Failed to load participant details');
  }
}

function closeDetailsModal() {
  document.getElementById('details-modal').classList.remove('active');
}

function renderDetailsModal(data) {
  const p = data.participant;
  const content = document.getElementById('modal-content');
  
  const statusBadge = p.status === 'completed'
    ? '<span class="badge badge-success">Completed</span>'
    : p.status === 'in_progress'
    ? '<span class="badge badge-warning">In Progress</span>'
    : '<span class="badge badge-secondary">Not Started</span>';

  content.innerHTML = `
    <div class="details-section">
      <h3>👤 Participant Information</h3>
      <div class="details-grid">
        <div class="detail-item">
          <div class="detail-label">Name</div>
          <div class="detail-value">${escapeHtml(p.name)}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Email</div>
          <div class="detail-value">${escapeHtml(p.email)}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Status</div>
          <div class="detail-value">${statusBadge}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Completion Time</div>
          <div class="detail-value">${p.completion_seconds ? formatTime(p.completion_seconds) : '—'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Rank</div>
          <div class="detail-value highlight">${p.rank ? '#' + p.rank : '—'}</div>
        </div>
      </div>
    </div>

    <div class="details-section">
      <h3>📊 Round-wise Performance</h3>
      <div class="round-stats">
        <div class="round-stat-card easy">
          <div class="round-stat-title">🟢 Easy Round</div>
          <div class="round-stat-row">
            <span class="round-stat-label">Attended</span>
            <span class="round-stat-val">${data.easy.attended} / 10</span>
          </div>
          <div class="round-stat-row">
            <span class="round-stat-label">Correct</span>
            <span class="round-stat-val">${data.easy.correct}</span>
          </div>
          <div class="round-stat-row">
            <span class="round-stat-label">Incorrect</span>
            <span class="round-stat-val">${data.easy.incorrect}</span>
          </div>
          <div class="round-stat-row">
            <span class="round-stat-label">Unanswered</span>
            <span class="round-stat-val">${data.easy.unanswered}</span>
          </div>
          <div class="round-stat-row">
            <span class="round-stat-label">Score</span>
            <span class="round-stat-val">${data.easy.score} / ${data.easy.max_score}</span>
          </div>
        </div>

        <div class="round-stat-card medium">
          <div class="round-stat-title">🟡 Medium Round</div>
          <div class="round-stat-row">
            <span class="round-stat-label">Attended</span>
            <span class="round-stat-val">${data.medium.attended} / 10</span>
          </div>
          <div class="round-stat-row">
            <span class="round-stat-label">Correct</span>
            <span class="round-stat-val">${data.medium.correct}</span>
          </div>
          <div class="round-stat-row">
            <span class="round-stat-label">Incorrect</span>
            <span class="round-stat-val">${data.medium.incorrect}</span>
          </div>
          <div class="round-stat-row">
            <span class="round-stat-label">Unanswered</span>
            <span class="round-stat-val">${data.medium.unanswered}</span>
          </div>
          <div class="round-stat-row">
            <span class="round-stat-label">Score</span>
            <span class="round-stat-val">${data.medium.score} / ${data.medium.max_score}</span>
          </div>
        </div>

        <div class="round-stat-card hard">
          <div class="round-stat-title">🔴 Hard Round</div>
          <div class="round-stat-row">
            <span class="round-stat-label">Attended</span>
            <span class="round-stat-val">${data.hard.attended} / 5</span>
          </div>
          <div class="round-stat-row">
            <span class="round-stat-label">Correct</span>
            <span class="round-stat-val">${data.hard.correct}</span>
          </div>
          <div class="round-stat-row">
            <span class="round-stat-label">Incorrect</span>
            <span class="round-stat-val">${data.hard.incorrect}</span>
          </div>
          <div class="round-stat-row">
            <span class="round-stat-label">Unanswered</span>
            <span class="round-stat-val">${data.hard.unanswered}</span>
          </div>
          <div class="round-stat-row">
            <span class="round-stat-label">Score</span>
            <span class="round-stat-val">${data.hard.score} / ${data.hard.max_score}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="details-section">
      <h3>🏆 Final Result</h3>
      <div class="round-stat-card total">
        <div class="round-stat-row">
          <span class="round-stat-label">Total Attended</span>
          <span class="round-stat-val">${data.total.attended} / 25</span>
        </div>
        <div class="round-stat-row">
          <span class="round-stat-label">Total Correct</span>
          <span class="round-stat-val">${data.total.correct}</span>
        </div>
        <div class="round-stat-row">
          <span class="round-stat-label">Total Incorrect</span>
          <span class="round-stat-val">${data.total.incorrect}</span>
        </div>
        <div class="round-stat-row">
          <span class="round-stat-label">Total Unanswered</span>
          <span class="round-stat-val">${data.total.unanswered}</span>
        </div>
        <div class="round-stat-row">
          <span class="round-stat-label">Total Score</span>
          <span class="round-stat-val highlight">${data.total.score} / ${data.total.max_score}</span>
        </div>
        <div class="round-stat-row">
          <span class="round-stat-label">Completion Time</span>
          <span class="round-stat-val">${p.completion_seconds ? formatTime(p.completion_seconds) : '—'}</span>
        </div>
        <div class="round-stat-row">
          <span class="round-stat-label">Rank</span>
          <span class="round-stat-val highlight">${p.rank ? '#' + p.rank : '—'}</span>
        </div>
      </div>
    </div>
  `;
}

function adminLogout() {
  setToken(null);
  setUser(null);
  window.location.href = '/admin-login.html';
}

// ─── Restart Scoreboard ────────────────────────────────────────────────────────
function restartScoreboard() {
  // Show the confirmation modal
  const modal = document.getElementById('restart-modal');
  if (modal) {
    modal.style.display = 'flex';
    modal.classList.add('active');
  }
}

function cancelRestart() {
  const modal = document.getElementById('restart-modal');
  if (modal) {
    modal.classList.remove('active');
    modal.style.display = 'none';
  }
}

async function confirmRestart() {
  const btn = document.getElementById('confirm-restart-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Restarting…'; }

  try {
    await apiRequest('POST', '/admin/restart-scoreboard');
    // Hide the modal
    cancelRestart();
    // Reset local data arrays immediately
    leaderboardData = [];
    allParticipantsData = [];
    // Reload all dashboard data to show fresh scoreboard
    await loadData();
  } catch (err) {
    alert('Failed to restart scoreboard. Please try again.');
    console.error('Restart failed:', err);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '🔁 Yes, Restart Scoreboard'; }
  }
}

// ─── Remove Participant ────────────────────────────────────────────────────────
let targetParticipantId = null;

function openRemoveModal(id, name) {
  targetParticipantId = id;
  const nameEl = document.getElementById('remove-target-name');
  if (nameEl) nameEl.textContent = name;
  const modal = document.getElementById('remove-modal');
  if (modal) {
    modal.style.display = 'flex';
    modal.classList.add('active');
  }
}

function cancelRemoveParticipant() {
  targetParticipantId = null;
  const modal = document.getElementById('remove-modal');
  if (modal) {
    modal.classList.remove('active');
    modal.style.display = 'none';
  }
}

async function executeRemoveParticipant() {
  if (!targetParticipantId) return;
  const btn = document.getElementById('confirm-remove-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Removing…'; }

  try {
    const res = await apiRequest('DELETE', `/admin/participants/${targetParticipantId}`);
    cancelRemoveParticipant();
    showToast(res.message || 'Participant removed successfully.');
    await loadData();
  } catch (err) {
    alert(err.message || 'Failed to remove participant.');
    console.error('Remove participant error:', err);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Remove Participant'; }
  }
}

function showToast(msg) {
  const existing = document.querySelector('.toast-msg');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast-msg';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// Initial load
loadData();
