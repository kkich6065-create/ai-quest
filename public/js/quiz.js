// Guard
(function() {
  const u = getUser(); const t = getToken();
  if (!t || !u) { window.location.href = '/login.html'; return; }
  if (u.role === 'admin') { window.location.href = '/admin.html'; return; }
})();

initStars();
document.getElementById('qh-user').textContent = '👤 ' + (getUser().name || '');

// ─── State ───────────────────────────────────────────────────────────────────
let state = null;
let timerInterval = null;
let currentRound = 1;      // 1,2,3
let currentIdx = 0;        // index within round (0-24)
let roundScores = [0, 0, 0];
let submitting = false;

const ROUND_COUNTS = [10, 10, 5];
const ROUND_OFFSETS = [0, 10, 20];
const ROUND_LABELS = ['Easy', 'Medium', 'Hard'];
const ROUND_COLORS = ['badge-easy', 'badge-medium', 'badge-hard'];
const MARKS = [1, 2, 4];

// ─── Init ─────────────────────────────────────────────────────────────────────
async function init() {
  // Try localStorage first (fast restore)
  const saved = localStorage.getItem('aq_quiz_state');
  if (saved) {
    state = JSON.parse(saved);
  }
  // Verify with server (authoritative)
  try {
    const progress = await apiRequest('GET', '/quiz/progress');
    if (progress.status === 'completed') {
      window.location.href = '/result.html'; return;
    }
    if (progress.status !== 'in_progress') {
      window.location.href = '/dashboard.html'; return;
    }
    // Merge server state and retain any unsaved local answers
    const localAnswers = state ? (state.answers || {}) : {};
    const mergedAnswers = { ...progress.answers, ...localAnswers };
    state = {
      questions: progress.questions,
      answers: mergedAnswers,
      start_timestamp: progress.start_timestamp,
      current_round: progress.current_round || (state ? state.current_round : 1) || 1,
      current_question: progress.current_question !== undefined ? progress.current_question : ((state ? state.current_question : 0) || 0)
    };
    localStorage.setItem('aq_quiz_state', JSON.stringify(state));
  } catch {
    if (!state) { window.location.href = '/dashboard.html'; return; }
  }
  currentRound = state.current_round || 1;
  currentIdx   = state.current_question || 0;
  startTimer();
  renderQuestion();
  renderNavigator();
  updateRoundIndicators();
}

// ─── Timer ───────────────────────────────────────────────────────────────────
function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - new Date(state.start_timestamp).getTime()) / 1000);
    document.getElementById('timer').textContent = '⏱️ ' + formatTime(elapsed);
  }, 1000);
}

// ─── Question helpers ─────────────────────────────────────────────────────────
function getRoundCount(round) {
  return ROUND_COUNTS[round - 1];
}
function getRoundOffset(round) {
  return ROUND_OFFSETS[round - 1];
}
function getQ(round, idx) {
  const offset = getRoundOffset(round);
  return state.questions[offset + idx];
}
function globalIdx(round, idx) { return getRoundOffset(round) + idx; }

// ─── Render ──────────────────────────────────────────────────────────────────
function renderQuestion() {
  const q = getQ(currentRound, currentIdx);
  if (!q) return;

  const count = getRoundCount(currentRound);
  const roundLabel = ROUND_LABELS[currentRound - 1];
  document.getElementById('prog-label').textContent = `Round ${currentRound} — ${roundLabel}`;
  document.getElementById('prog-count').textContent = `${currentIdx + 1} / ${count}`;
  document.getElementById('progress-fill').style.width = `${((currentIdx + 1) / count) * 100}%`;
  document.getElementById('q-number').textContent = `Question ${currentIdx + 1} of ${count}`;

  const badge = document.getElementById('q-badge');
  badge.className = 'badge ' + ROUND_COLORS[currentRound - 1];
  badge.textContent = roundLabel.toUpperCase();

  document.getElementById('q-text').textContent = q.text;

  const opts = ['A','B','C','D'];
  opts.forEach((letter, i) => {
    const btn = document.getElementById('opt-' + letter);
    btn.querySelector('.opt-text').textContent = q.options[i];
    btn.className = 'option-btn';
    if (state.answers[q.id] === letter) btn.classList.add('selected');
  });

  // Prev / Next / Submit
  document.getElementById('prev-btn').disabled = (currentIdx === 0);
  const isLastQ = currentIdx === count - 1;
  document.getElementById('next-btn').style.display = isLastQ ? 'none' : 'inline-flex';
  document.getElementById('submit-round-btn').style.display = isLastQ ? 'inline-flex' : 'none';

  renderNavigator();
}

function renderNavigator() {
  const count = getRoundCount(currentRound);
  const nav = document.getElementById('q-navigator');
  nav.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const q = getQ(currentRound, i);
    const btn = document.createElement('button');
    btn.className = 'qn-btn';
    btn.textContent = i + 1;
    if (state.answers[q.id]) btn.classList.add('answered');
    if (i === currentIdx) btn.classList.add('current');
    btn.onclick = () => { currentIdx = i; renderQuestion(); };
    nav.appendChild(btn);
  }
}

function updateRoundIndicators() {
  for (let r = 1; r <= 3; r++) {
    const el = document.getElementById('ri-' + r);
    el.className = 'ri';
    if (r < currentRound) el.classList.add('done');
    else if (r === currentRound) el.classList.add('active');
  }
}

// ─── Interact ─────────────────────────────────────────────────────────────────
function selectOption(letter) {
  const q = getQ(currentRound, currentIdx);
  state.answers[q.id] = letter;
  localStorage.setItem('aq_quiz_state', JSON.stringify(state));
  // Save to server (fire and forget)
  apiRequest('POST', '/quiz/answer', {
    question_id: q.id, answer: letter,
    current_round: currentRound, current_question: currentIdx
  }).catch(() => {});
  renderQuestion();
}

function navigate(dir) {
  const count = getRoundCount(currentRound);
  const newIdx = currentIdx + dir;
  if (newIdx < 0 || newIdx >= count) return;
  currentIdx = newIdx;
  renderQuestion();
}

// ─── Round Submit ─────────────────────────────────────────────────────────────
function showSubmitRoundModal() {
  const count = getRoundCount(currentRound);
  const offset = getRoundOffset(currentRound);
  const answered = state.questions.slice(offset, offset + count)
    .filter(q => state.answers[q.id]).length;
  const unanswered = count - answered;
  const emoji = unanswered === 0 ? '✅' : '⚠️';
  const msg = unanswered === 0
    ? `All ${count} questions answered. Ready to submit Round ${currentRound}?`
    : `You have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}. Unanswered questions score 0. Submit anyway?`;
  document.getElementById('sr-modal-emoji').textContent = emoji;
  document.getElementById('sr-modal-title').textContent = `Submit Round ${currentRound}?`;
  document.getElementById('sr-modal-msg').textContent = msg;
  document.getElementById('submit-round-modal').classList.add('active');
}
function closeSubmitModal() {
  document.getElementById('submit-round-modal').classList.remove('active');
}

function submitRound() {
  closeSubmitModal();
  if (currentRound === 3) {
    document.getElementById('final-submit-modal').classList.add('active');
    return;
  }
  // Show transition screen
  const count = getRoundCount(currentRound);
  const offset = getRoundOffset(currentRound);
  const roundQs = state.questions.slice(offset, offset + count);
  // We don't know exact score yet (server calculates), show answered count as estimation
  const answered = roundQs.filter(q => state.answers[q.id]).length;
  showRoundTransition(currentRound, answered, count);
}

function showRoundTransition(round, answered, count) {
  const names = ['Easy', 'Medium', 'Hard'];
  const emojis = ['🎉', '🚀', '🏆'];
  const msgs = [
    'Great work! Get ready for the Medium round — things get trickier!',
    'Outstanding! The final Hard round awaits. Give it your best!',
    ''
  ];
  document.getElementById('rt-emoji').textContent = emojis[round - 1];
  document.getElementById('rt-title').textContent = `Round ${round} — ${names[round-1]} Complete!`;
  document.getElementById('rt-subtitle').textContent = `Questions answered: ${answered} / ${count}`;
  document.getElementById('rt-score-label').textContent = 'Answers Saved';
  document.getElementById('rt-score-value').textContent = `${answered}/${count}`;
  document.getElementById('rt-msg').textContent = msgs[round - 1];
  document.getElementById('rt-btn').textContent = round < 3
    ? `Continue to Round ${round + 1} — ${names[round]} →`
    : 'Submit Final Quiz 🏁';
  document.getElementById('round-transition').style.display = 'flex';
  document.getElementById('quiz-main').style.display = 'none';
}

function continueToNextRound() {
  if (currentRound >= 3) {
    document.getElementById('round-transition').style.display = 'none';
    document.getElementById('quiz-main').style.display = 'block';
    document.getElementById('final-submit-modal').classList.add('active');
    return;
  }
  currentRound++;
  currentIdx = 0;
  state.current_round = currentRound;
  state.current_question = 0;
  localStorage.setItem('aq_quiz_state', JSON.stringify(state));
  apiRequest('POST', '/quiz/answer', { current_round: currentRound, current_question: 0 }).catch(() => {});
  document.getElementById('round-transition').style.display = 'none';
  document.getElementById('quiz-main').style.display = 'block';
  updateRoundIndicators();
  renderQuestion();
}

// ─── Final Submit ─────────────────────────────────────────────────────────────
async function submitFinal() {
  if (submitting) return;
  submitting = true;
  clearInterval(timerInterval);
  try {
    const result = await apiRequest('POST', '/quiz/submit');
    localStorage.removeItem('aq_quiz_state');
    localStorage.setItem('aq_result', JSON.stringify(result));
    window.location.href = '/result.html';
  } catch (err) {
    submitting = false;
    if (err.message.includes('already submitted')) {
      localStorage.removeItem('aq_quiz_state');
      window.location.href = '/result.html';
    } else {
      alert('Submission error: ' + err.message);
    }
  }
}

// Close modals on overlay click
document.querySelectorAll('.modal-overlay').forEach(el => {
  el.addEventListener('click', e => {
    if (e.target === el) el.classList.remove('active');
  });
});

init();
