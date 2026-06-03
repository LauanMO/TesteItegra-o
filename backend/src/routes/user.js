import { Router } from 'express';
import { db } from '../db/database.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();
router.use(authRequired);

// Intervalos (em dias) da repetição espaçada por "box" de Leitner (índice = box, 0..5).
// Acertar sobe de box (revisa mais tarde); errar desce de box (volta mais cedo).
const INTERVALS = [0, 1, 2, 4, 7, 15];
const MAX_BOX = INTERVALS.length - 1;

function userStats(userId) {
  const total = db.prepare('SELECT COUNT(*) c FROM vocabulary').get().c;
  const learned = db
    .prepare("SELECT COUNT(*) c FROM progress WHERE user_id = ? AND status = 'learned'")
    .get(userId).c;
  const studied = db.prepare('SELECT COUNT(*) c FROM progress WHERE user_id = ?').get(userId).c;
  const dueNow = db
    .prepare("SELECT COUNT(*) c FROM progress WHERE user_id = ? AND next_review <= datetime('now')")
    .get(userId).c;
  return {
    totalWords: total,
    learned,
    learning: studied - learned,
    studied,
    pending: total - learned,
    dueNow,
  };
}

function updateStreak(userId) {
  const u = db.prepare('SELECT streak_count, last_study_date FROM users WHERE id = ?').get(userId);
  const today = db.prepare("SELECT date('now') d").get().d;
  const yesterday = db.prepare("SELECT date('now', '-1 day') d").get().d;
  if (u.last_study_date === today) return u.streak_count; // já contabilizado hoje
  const streak = u.last_study_date === yesterday ? u.streak_count + 1 : 1;
  db.prepare('UPDATE users SET streak_count = ?, last_study_date = ? WHERE id = ?').run(
    streak,
    today,
    userId
  );
  return streak;
}

// GET /user/profile
router.get('/profile', (req, res) => {
  const u = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!u) return res.status(404).json({ error: 'Usuário não encontrado' });
  res.json({
    user: {
      id: u.id,
      name: u.name,
      email: u.email,
      hskLevel: u.hsk_level,
      streak: u.streak_count,
      lastStudyDate: u.last_study_date,
      createdAt: u.created_at,
    },
    stats: userStats(u.id),
  });
});

// GET /user/progress
router.get('/progress', (req, res) => {
  const userId = req.user.id;

  const byLevel = db
    .prepare(
      `SELECT v.hsk_level AS level,
              COUNT(*) AS total,
              SUM(CASE WHEN p.status = 'learned' THEN 1 ELSE 0 END) AS learned,
              SUM(CASE WHEN p.id IS NOT NULL THEN 1 ELSE 0 END) AS studied
       FROM vocabulary v
       LEFT JOIN progress p ON p.vocabulary_id = v.id AND p.user_id = ?
       GROUP BY v.hsk_level
       ORDER BY v.hsk_level`
    )
    .all(userId);

  const dueWords = db
    .prepare(
      `SELECT v.id, v.hanzi, v.pinyin, v.translation, v.hsk_level AS level, p.box, p.next_review
       FROM progress p
       JOIN vocabulary v ON v.id = p.vocabulary_id
       WHERE p.user_id = ? AND p.next_review <= datetime('now')
       ORDER BY p.next_review ASC
       LIMIT 20`
    )
    .all(userId);

  const u = db.prepare('SELECT streak_count, last_study_date FROM users WHERE id = ?').get(userId);

  res.json({
    stats: userStats(userId),
    streak: u.streak_count,
    lastStudyDate: u.last_study_date,
    byLevel,
    dueWords,
  });
});

// POST /user/progress  { vocabularyId, correct }
router.post('/progress', (req, res) => {
  const userId = req.user.id;
  const { vocabularyId, correct } = req.body || {};

  if (vocabularyId == null || typeof correct !== 'boolean') {
    return res
      .status(400)
      .json({ error: 'vocabularyId (number) e correct (boolean) são obrigatórios' });
  }

  const vocab = db.prepare('SELECT id FROM vocabulary WHERE id = ?').get(vocabularyId);
  if (!vocab) return res.status(404).json({ error: 'Vocabulário não encontrado' });

  const existing = db
    .prepare('SELECT * FROM progress WHERE user_id = ? AND vocabulary_id = ?')
    .get(userId, vocabularyId);

  let box = existing ? existing.box : 0;
  let correctCount = existing ? existing.correct_count : 0;
  let wrongCount = existing ? existing.wrong_count : 0;

  if (correct) {
    box = Math.min(box + 1, MAX_BOX);
    correctCount += 1;
  } else {
    box = Math.max(box - 1, 0);
    wrongCount += 1;
  }

  const status = box >= MAX_BOX ? 'learned' : 'learning';
  const nextReview = db
    .prepare("SELECT datetime('now', ?) v")
    .get(`+${INTERVALS[box]} days`).v;

  if (existing) {
    db.prepare(
      `UPDATE progress
       SET box = ?, status = ?, correct_count = ?, wrong_count = ?,
           last_reviewed = datetime('now'), next_review = ?
       WHERE id = ?`
    ).run(box, status, correctCount, wrongCount, nextReview, existing.id);
  } else {
    db.prepare(
      `INSERT INTO progress
        (user_id, vocabulary_id, box, status, correct_count, wrong_count, last_reviewed, next_review)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?)`
    ).run(userId, vocabularyId, box, status, correctCount, wrongCount, nextReview);
  }

  const streak = updateStreak(userId);

  res.json({
    progress: {
      vocabularyId,
      box,
      status,
      correctCount,
      wrongCount,
      nextReview,
    },
    streak,
    stats: userStats(userId),
  });
});

export default router;
