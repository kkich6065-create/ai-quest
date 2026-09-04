// Guard: must be logged in as participant
(function() {
  const user = getUser();
  const token = getToken();
  if (!token || !user) { window.location.href = '/login.html'; return; }
  if (user.role === 'admin') { window.location.href = '/admin.html'; return; }
})();

initStars();

const user = getUser();
document.getElementById('welcome-name').textContent = user.name;
document.getElementById('db-user-name').textContent = '👤 ' + user.name;

// Check existing quiz progress
async function loadProgress() {
  try {
    const data = await apiRequest('GET', '/quiz/progress');
    if (data.status === 'completed') {
      document.getElementById('completed-banner').style.display = 'flex';
      document.getElementById('start-section').style.display = 'none';
      document.getElementById('db-status-msg').textContent = '🏆 You have completed the quiz! Great job!';
    } else if (data.status === 'in_progress') {
      document.getElementById('db-status-msg').textContent = '⏳ You have a quiz in progress — click Start to continue!';
      const btn = document.getElementById('start-btn');
      btn.textContent = '▶️ Continue Quiz';
    }
  } catch {}
}
loadProgress();

function startQuiz() {
  document.getElementById('confirm-modal').classList.add('active');
}
function closeModal() {
  document.getElementById('confirm-modal').classList.remove('active');
}

async function confirmStart() {
  const btn = document.getElementById('confirm-start-btn');
  btn.disabled = true; btn.textContent = '⏳ Starting...';
  try {
    // Check if already in progress
    const progress = await apiRequest('GET', '/quiz/progress');
    if (progress.status === 'in_progress') {
      // Resume
      localStorage.setItem('aq_quiz_state', JSON.stringify({
        questions: progress.questions,
        answers: progress.answers,
        start_timestamp: progress.start_timestamp,
        current_round: progress.current_round,
        current_question: progress.current_question
      }));
      window.location.href = '/quiz.html';
      return;
    }
    // New start
    const data = await apiRequest('POST', '/quiz/start');
    localStorage.setItem('aq_quiz_state', JSON.stringify({
      questions: data.questions,
      answers: {},
      start_timestamp: data.start_timestamp,
      current_round: 1,
      current_question: 0
    }));
    window.location.href = '/quiz.html';
  } catch (err) {
    if (err.message.includes('already completed')) {
      alert('You have already completed this quiz!');
      window.location.reload();
    } else if (err.message.includes('already started')) {
      // Resume existing
      const progress = await apiRequest('GET', '/quiz/progress');
      localStorage.setItem('aq_quiz_state', JSON.stringify({
        questions: progress.questions,
        answers: progress.answers,
        start_timestamp: progress.start_timestamp,
        current_round: progress.current_round,
        current_question: progress.current_question
      }));
      window.location.href = '/quiz.html';
    } else {
      alert(err.message);
      btn.disabled = false; btn.textContent = 'Yes, Start! 🎯';
    }
  }
}

// Close modal on overlay click
document.getElementById('confirm-modal').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});
