import { Router } from 'express';
import { db } from '../db/database.js';
import { authOptional } from '../middleware/auth.js';

const router = Router();

// GET /vocabulary?level=1&limit=200
// Público. Se houver token válido, anexa o progresso do usuário em cada palavra.
router.get('/', authOptional, (req, res) => {
  const level = req.query.level ? Number(req.query.level) : null;
  const limit = req.query.limit ? Math.min(Number(req.query.limit), 500) : 500;

  const rows = level
    ? db.prepare('SELECT * FROM vocabulary WHERE hsk_level = ? ORDER BY id LIMIT ?').all(level, limit)
    : db.prepare('SELECT * FROM vocabulary ORDER BY hsk_level, id LIMIT ?').all(limit);

  const progressMap = {};
  if (req.user) {
    const rows2 = db
      .prepare('SELECT vocabulary_id, status, box, next_review FROM progress WHERE user_id = ?')
      .all(req.user.id);
    for (const p of rows2) progressMap[p.vocabulary_id] = p;
  }

  const vocabulary = rows.map((r) => ({
    id: r.id,
    hanzi: r.hanzi,
    pinyin: r.pinyin,
    translation: r.translation,
    hskLevel: r.hsk_level,
    example: r.example,
    progress: progressMap[r.id]
      ? {
          status: progressMap[r.id].status,
          box: progressMap[r.id].box,
          nextReview: progressMap[r.id].next_review,
        }
      : null,
  }));

  res.json({ level: level || 'all', count: vocabulary.length, vocabulary });
});

export default router;
