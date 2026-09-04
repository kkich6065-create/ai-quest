const express = require('express');
const { db } = require('../database');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware, adminOnly);

// GET /api/admin/stats
router.get('/stats', (req, res) => {
  db.read();
  const participants = db.get('participants').value();
  const attempts = db.get('quiz_attempts').value();
  const completed = attempts.filter(a => a.status === 'completed');
  const inProgress = attempts.filter(a => a.status === 'in_progress');
  const scores = completed.map(a => a.total_score);
  const times = completed.map(a => a.completion_seconds).filter(Boolean);

  const notStartedCount = Math.max(0, participants.filter(p => !attempts.some(a => a.participant_id === p.id)).length);

  res.json({
    total_registered: participants.length,
    started: inProgress.length + completed.length,
    completed: completed.length,
    not_started: notStartedCount,
    avg_score: scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length*10)/10 : 0,
    highest_score: scores.length ? Math.max(...scores) : 0,
    fastest_seconds: times.length ? Math.min(...times) : null
  });
});

// GET /api/admin/leaderboard
router.get('/leaderboard', (req, res) => {
  db.read();
  const participants = db.get('participants').value();
  const attempts = db.get('quiz_attempts').filter({ status: 'completed' }).value();

  const rows = attempts.map(a => {
    const p = participants.find(p => p.id === a.participant_id);
    return {
      participant_id: a.participant_id,
      name: p ? p.name : 'Unknown',
      email: p ? p.email : '',
      easy_score: a.easy_score,
      medium_score: a.medium_score,
      hard_score: a.hard_score,
      total_score: a.total_score,
      completion_seconds: a.completion_seconds,
      submit_timestamp: a.submit_timestamp
    };
  });

  rows.sort((a, b) => {
    if (b.total_score !== a.total_score) return b.total_score - a.total_score;
    return (a.completion_seconds || 9999999) - (b.completion_seconds || 9999999);
  });

  rows.forEach((r, i) => { r.rank = i + 1; });
  res.json({ leaderboard: rows });
});

// GET /api/admin/participants
router.get('/participants', (req, res) => {
  db.read();
  const participants = db.get('participants').value();
  const attempts = db.get('quiz_attempts').value();

  const data = participants.map(p => {
    const attempt = attempts.find(a => a.participant_id === p.id);
    return {
      id: p.id, name: p.name, email: p.email, created_at: p.created_at,
      status: attempt ? attempt.status : 'not_started',
      total_score: attempt ? attempt.total_score : null,
      completion_seconds: attempt ? attempt.completion_seconds : null,
      easy_score: attempt ? attempt.easy_score : null,
      medium_score: attempt ? attempt.medium_score : null,
      hard_score: attempt ? attempt.hard_score : null
    };
  });

  res.json({ participants: data });
});

// GET /api/admin/participant/:id/details
router.get('/participant/:id/details', (req, res) => {
  db.read();
  const participantId = parseInt(req.params.id);
  const participant = db.get('participants').find({ id: participantId }).value();
  
  if (!participant) {
    return res.status(404).json({ error: 'Participant not found' });
  }

  const attempt = db.get('quiz_attempts').find({ participant_id: participantId }).value();
  
  if (!attempt) {
    return res.json({
      participant: {
        id: participant.id,
        name: participant.name,
        email: participant.email,
        status: 'not_started',
        completion_seconds: null,
        rank: null
      },
      easy: { attended: 0, correct: 0, incorrect: 0, unanswered: 10, score: 0, max_score: 10 },
      medium: { attended: 0, correct: 0, incorrect: 0, unanswered: 10, score: 0, max_score: 20 },
      hard: { attended: 0, correct: 0, incorrect: 0, unanswered: 5, score: 0, max_score: 20 },
      total: { attended: 0, correct: 0, incorrect: 0, unanswered: 25, score: 0, max_score: 50 }
    });
  }

  // Calculate rank matching exact leaderboard ordering
  const completedAttempts = db.get('quiz_attempts').filter({ status: 'completed' }).value();
  const sorted = completedAttempts
    .map(a => ({ participant_id: a.participant_id, total_score: a.total_score, completion_seconds: a.completion_seconds }))
    .sort((a, b) => {
      if (b.total_score !== a.total_score) return b.total_score - a.total_score;
      return (a.completion_seconds || 9999999) - (b.completion_seconds || 9999999);
    });
  
  const rankIdx = attempt.status === 'completed' 
    ? sorted.findIndex(s => s.participant_id === participantId)
    : -1;
  const rank = rankIdx !== -1 ? rankIdx + 1 : null;

  const easy_unanswered = attempt.easy_unanswered !== undefined ? attempt.easy_unanswered : (attempt.status === 'completed' ? 0 : 10);
  const medium_unanswered = attempt.medium_unanswered !== undefined ? attempt.medium_unanswered : (attempt.status === 'completed' ? 0 : 10);
  const hard_unanswered = attempt.hard_unanswered !== undefined ? attempt.hard_unanswered : (attempt.status === 'completed' ? 0 : 5);

  const response = {
    participant: {
      id: participant.id,
      name: participant.name,
      email: participant.email,
      status: attempt.status,
      completion_seconds: attempt.completion_seconds,
      rank
    },
    easy: {
      attended: attempt.easy_attended || 0,
      correct: attempt.easy_correct || 0,
      incorrect: attempt.easy_incorrect || 0,
      unanswered: easy_unanswered,
      score: attempt.easy_score || 0,
      max_score: 10
    },
    medium: {
      attended: attempt.medium_attended || 0,
      correct: attempt.medium_correct || 0,
      incorrect: attempt.medium_incorrect || 0,
      unanswered: medium_unanswered,
      score: attempt.medium_score || 0,
      max_score: 20
    },
    hard: {
      attended: attempt.hard_attended || 0,
      correct: attempt.hard_correct || 0,
      incorrect: attempt.hard_incorrect || 0,
      unanswered: hard_unanswered,
      score: attempt.hard_score || 0,
      max_score: 20
    },
    total: {
      attended: (attempt.easy_attended || 0) + (attempt.medium_attended || 0) + (attempt.hard_attended || 0),
      correct: (attempt.easy_correct || 0) + (attempt.medium_correct || 0) + (attempt.hard_correct || 0),
      incorrect: (attempt.easy_incorrect || 0) + (attempt.medium_incorrect || 0) + (attempt.hard_incorrect || 0),
      unanswered: easy_unanswered + medium_unanswered + hard_unanswered,
      score: attempt.total_score || 0,
      max_score: 50
    }
  };

  res.json(response);
});

// DELETE /api/admin/participants/:id
// Removes a participant and their quiz attempts from the database.
router.delete('/participants/:id', (req, res) => {
  db.read();
  const participantId = parseInt(req.params.id, 10);
  if (isNaN(participantId)) {
    return res.status(400).json({ error: 'Invalid participant ID' });
  }

  const participant = db.get('participants').find({ id: participantId }).value();
  if (!participant) {
    return res.status(404).json({ error: 'Participant not found' });
  }

  try {
    // Delete attempt records belonging to this participant
    db.get('quiz_attempts').remove({ participant_id: participantId }).write();
    // Delete the participant account
    db.get('participants').remove({ id: participantId }).write();

    res.json({ success: true, message: 'Participant removed successfully.' });
  } catch (err) {
    console.error('Delete participant error:', err);
    res.status(500).json({ error: 'Failed to remove participant.' });
  }
});

// POST /api/admin/restart-scoreboard
// Clears all quiz attempt data so a fresh competition can begin.
// Participants, admins, and the question bank are NOT affected.
router.post('/restart-scoreboard', (req, res) => {
  db.read();
  try {
    // Remove every attempt record
    db.set('quiz_attempts', []).write();
    // Reset the quiz_attempts auto-increment counter to 1
    db.set('_nextIds.quiz_attempts', 1).write();

    res.json({ success: true, message: 'Scoreboard restarted. All competition data cleared. Participant accounts and questions are intact.' });
  } catch (err) {
    console.error('Restart scoreboard error:', err);
    res.status(500).json({ error: 'Failed to restart scoreboard.' });
  }
});

module.exports = router;

