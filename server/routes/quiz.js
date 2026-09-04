const express = require('express');
const { db, nextId } = require('../database');
const QUESTIONS = require('../questions');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function selectQuestions() {
  const pick = (pool, count) => shuffle(pool).slice(0, count).map(q => {
    // Shuffle answer options but track correct answer
    const opts = ['A','B','C','D'];
    const correctText = q.options[opts.indexOf(q.correct)];
    const shuffled = shuffle(q.options);
    const newCorrect = opts[shuffled.indexOf(correctText)];
    return { ...q, options: shuffled, correct: newCorrect };
  });
  return [
    ...pick(QUESTIONS.easy, 10),
    ...pick(QUESTIONS.medium, 10),
    ...pick(QUESTIONS.hard, 5)
  ];
}

// POST /api/quiz/start
router.post('/start', (req, res) => {
  db.read();
  const pid = req.user.id;
  const participantExists = db.get('participants').find({ id: pid }).value();
  if (!participantExists) {
    return res.status(401).json({ error: 'Account no longer exists' });
  }

  let attempt = db.get('quiz_attempts').find({ participant_id: pid }).value();

  if (attempt && attempt.status === 'completed')
    return res.status(400).json({ error: 'You have already completed this quiz' });

  if (attempt && attempt.status === 'in_progress')
    return res.status(400).json({ error: 'Quiz already started', attempt_id: attempt.id });

  // Create new attempt
  const questions = selectQuestions();
  const now = new Date().toISOString();
  const newAttempt = {
    id: nextId('quiz_attempts'),
    participant_id: pid,
    status: 'in_progress',
    start_timestamp: now,
    submit_timestamp: null,
    completion_seconds: null,
    easy_score: 0, medium_score: 0, hard_score: 0, total_score: 0,
    questions_json: JSON.stringify(questions.map(q => ({
      id: q.id, text: q.text, options: q.options, correct: q.correct
    }))),
    answers_json: '{}',
    current_round: 1,
    current_question: 0,
    created_at: now
  };
  db.get('quiz_attempts').push(newAttempt).write();

  // Send questions without correct answers
  const safeQuestions = questions.map(({ correct, ...rest }) => rest);
  res.json({ attempt_id: newAttempt.id, start_timestamp: now, questions: safeQuestions });
});

// GET /api/quiz/progress
router.get('/progress', (req, res) => {
  db.read();
  const attempt = db.get('quiz_attempts').find({ participant_id: req.user.id }).value();
  if (!attempt) return res.json({ status: 'not_started' });

  const safeQuestions = attempt.status !== 'not_started'
    ? JSON.parse(attempt.questions_json).map(({ correct, ...rest }) => rest)
    : [];

  const easy_correct = attempt.easy_correct || 0;
  const medium_correct = attempt.medium_correct || 0;
  const hard_correct = attempt.hard_correct || 0;
  const easy_incorrect = attempt.easy_incorrect || 0;
  const medium_incorrect = attempt.medium_incorrect || 0;
  const hard_incorrect = attempt.hard_incorrect || 0;
  const easy_unanswered = attempt.easy_unanswered !== undefined ? attempt.easy_unanswered : (attempt.status === 'completed' ? 0 : 10);
  const medium_unanswered = attempt.medium_unanswered !== undefined ? attempt.medium_unanswered : (attempt.status === 'completed' ? 0 : 10);
  const hard_unanswered = attempt.hard_unanswered !== undefined ? attempt.hard_unanswered : (attempt.status === 'completed' ? 0 : 5);

  res.json({
    status: attempt.status,
    attempt_id: attempt.id,
    start_timestamp: attempt.start_timestamp,
    questions: safeQuestions,
    answers: JSON.parse(attempt.answers_json),
    current_round: attempt.current_round,
    current_question: attempt.current_question,
    easy_score: attempt.easy_score,
    medium_score: attempt.medium_score,
    hard_score: attempt.hard_score,
    total_score: attempt.total_score,
    submit_timestamp: attempt.submit_timestamp,
    completion_seconds: attempt.completion_seconds,
    easy_attended: attempt.easy_attended || 0,
    easy_correct,
    easy_incorrect,
    easy_unanswered,
    medium_attended: attempt.medium_attended || 0,
    medium_correct,
    medium_incorrect,
    medium_unanswered,
    hard_attended: attempt.hard_attended || 0,
    hard_correct,
    hard_incorrect,
    hard_unanswered,
    total_attended: (attempt.easy_attended || 0) + (attempt.medium_attended || 0) + (attempt.hard_attended || 0),
    total_correct: easy_correct + medium_correct + hard_correct,
    total_incorrect: easy_incorrect + medium_incorrect + hard_incorrect,
    total_unanswered: easy_unanswered + medium_unanswered + hard_unanswered
  });
});

// POST /api/quiz/answer — save an answer progressively
router.post('/answer', (req, res) => {
  db.read();
  const { question_id, answer, current_round, current_question } = req.body;
  const attempt = db.get('quiz_attempts').find({ participant_id: req.user.id }).value();
  if (!attempt || attempt.status !== 'in_progress')
    return res.status(400).json({ error: 'No active quiz attempt' });

  const answers = JSON.parse(attempt.answers_json);
  if (question_id !== undefined && answer !== undefined) {
    answers[question_id] = answer;
  }

  db.get('quiz_attempts').find({ id: attempt.id })
    .assign({
      answers_json: JSON.stringify(answers),
      current_round: current_round || attempt.current_round,
      current_question: current_question !== undefined ? current_question : attempt.current_question
    }).write();

  res.json({ saved: true });
});

// POST /api/quiz/submit — final submission
router.post('/submit', (req, res) => {
  db.read();
  const attempt = db.get('quiz_attempts').find({ participant_id: req.user.id }).value();
  if (!attempt) return res.status(400).json({ error: 'No quiz attempt found' });
  if (attempt.status === 'completed') return res.status(400).json({ error: 'Quiz already submitted' });
  if (attempt.status !== 'in_progress') return res.status(400).json({ error: 'Quiz not started' });

  const questions = JSON.parse(attempt.questions_json);
  const answers = JSON.parse(attempt.answers_json);

  let easy_score = 0, medium_score = 0, hard_score = 0;
  let easy_attended = 0, easy_correct = 0, easy_incorrect = 0, easy_unanswered = 0;
  let medium_attended = 0, medium_correct = 0, medium_incorrect = 0, medium_unanswered = 0;
  let hard_attended = 0, hard_correct = 0, hard_incorrect = 0, hard_unanswered = 0;

  questions.forEach((q, idx) => {
    const userAnswer = answers[q.id];
    if (idx < 10) {
      // Easy round (questions 0-9: 10 questions, 1 point each, max 10)
      if (userAnswer) {
        easy_attended++;
        if (userAnswer === q.correct) {
          easy_correct++;
          easy_score += 1;
        } else {
          easy_incorrect++;
        }
      } else {
        easy_unanswered++;
      }
    } else if (idx < 20) {
      // Medium round (questions 10-19: 10 questions, 2 points each, max 20)
      if (userAnswer) {
        medium_attended++;
        if (userAnswer === q.correct) {
          medium_correct++;
          medium_score += 2;
        } else {
          medium_incorrect++;
        }
      } else {
        medium_unanswered++;
      }
    } else {
      // Hard round (questions 20-24: 5 questions, 4 points each, max 20)
      if (userAnswer) {
        hard_attended++;
        if (userAnswer === q.correct) {
          hard_correct++;
          hard_score += 4;
        } else {
          hard_incorrect++;
        }
      } else {
        hard_unanswered++;
      }
    }
  });

  const now = new Date().toISOString();
  const startMs = new Date(attempt.start_timestamp).getTime();
  const rawDiff = Math.round((new Date(now).getTime() - startMs) / 1000);
  const completion_seconds = Math.max(1, isNaN(rawDiff) ? 1 : rawDiff);
  const total_score = easy_score + medium_score + hard_score;

  db.get('quiz_attempts').find({ id: attempt.id }).assign({
    status: 'completed',
    submit_timestamp: now,
    completion_seconds,
    easy_score,
    medium_score,
    hard_score,
    total_score,
    // Detailed statistics per round
    easy_attended, easy_correct, easy_incorrect, easy_unanswered,
    medium_attended, medium_correct, medium_incorrect, medium_unanswered,
    hard_attended, hard_correct, hard_incorrect, hard_unanswered
  }).write();

  res.json({
    easy_score, medium_score, hard_score,
    total_score,
    completion_seconds,
    easy_attended, easy_correct, easy_incorrect, easy_unanswered,
    medium_attended, medium_correct, medium_incorrect, medium_unanswered,
    hard_attended, hard_correct, hard_incorrect, hard_unanswered,
    total_attended: easy_attended + medium_attended + hard_attended,
    total_correct: easy_correct + medium_correct + hard_correct,
    total_incorrect: easy_incorrect + medium_incorrect + hard_incorrect,
    total_unanswered: easy_unanswered + medium_unanswered + hard_unanswered
  });
});

module.exports = router;
