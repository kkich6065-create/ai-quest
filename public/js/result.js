(function() {
  const u = getUser(); const t = getToken();
  if (!t || !u) { window.location.href = '/login.html'; return; }
})();
initStars();

const user = getUser();
const resNameEl = document.getElementById('res-name');
if (resNameEl) {
  resNameEl.textContent = (user && user.name) ? user.name : 'Champion';
}

function launchConfetti() {
  const colors = ['#00d4ff','#7c3aed','#fbbf24','#10b981','#f43f5e','#a855f7'];
  const container = document.getElementById('confetti-container');
  for (let i = 0; i < 80; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.cssText = `
      left:${Math.random()*100}%;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      width:${6+Math.random()*8}px;
      height:${6+Math.random()*8}px;
      animation-duration:${2+Math.random()*3}s;
      animation-delay:${Math.random()*2}s;
      border-radius:${Math.random()>0.5?'50%':'2px'};
    `;
    container.appendChild(piece);
  }
  setTimeout(() => container.innerHTML = '', 6000);
}

function getPerformanceMsg(total) {
  if (total >= 45) return '🌟 Phenomenal! You are a true AI Champion!';
  if (total >= 37) return '🚀 Excellent work! You have outstanding knowledge!';
  if (total >= 27) return '⭐ Great job! A solid performance across all rounds!';
  if (total >= 17) return '👍 Good effort! Keep exploring AI and Computer Science!';
  return '💪 Keep learning! Every expert was once a beginner!';
}

async function loadResult() {
  // Try cached result first
  const cached = localStorage.getItem('aq_result');

  try {
    const progress = await apiRequest('GET', '/quiz/progress');
    if (progress.status === 'completed') {
      showResult(progress);
      return;
    }
  } catch {}

  if (cached) {
    showResult(JSON.parse(cached));
    return;
  }
  document.getElementById('res-total').textContent = 'N/A';
}

function showResult(r) {
  document.getElementById('res-total').textContent = r.total_score != null ? r.total_score : 0;
  document.getElementById('res-easy').textContent = `${r.easy_score || 0} / 10`;
  document.getElementById('res-medium').textContent = `${r.medium_score || 0} / 20`;
  document.getElementById('res-hard').textContent = `${r.hard_score || 0} / 20`;
  
  const correct = r.total_correct !== undefined ? r.total_correct : ((r.easy_correct || 0) + (r.medium_correct || 0) + (r.hard_correct || 0));
  const incorrect = r.total_incorrect !== undefined ? r.total_incorrect : ((r.easy_incorrect || 0) + (r.medium_incorrect || 0) + (r.hard_incorrect || 0));
  const unanswered = r.total_unanswered !== undefined ? r.total_unanswered : ((r.easy_unanswered || 0) + (r.medium_unanswered || 0) + (r.hard_unanswered || 0));

  const elCorrect = document.getElementById('res-correct');
  const elIncorrect = document.getElementById('res-incorrect');
  const elUnanswered = document.getElementById('res-unanswered');
  if (elCorrect) elCorrect.textContent = correct;
  if (elIncorrect) elIncorrect.textContent = incorrect;
  if (elUnanswered) elUnanswered.textContent = unanswered;

  document.getElementById('res-time').textContent = formatTime(r.completion_seconds);
  document.getElementById('res-perf-msg').textContent = getPerformanceMsg(r.total_score || 0);
  launchConfetti();
}

loadResult();
