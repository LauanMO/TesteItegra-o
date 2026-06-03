import { Router } from 'express';
import { db } from '../db/database.js';

const router = Router();

const HSK_TITLES = {
  1: 'HSK 1 — Básico',
  2: 'HSK 2',
  3: 'HSK 3',
  4: 'HSK 4',
  5: 'HSK 5',
  6: 'HSK 6',
};
const LESSON_SIZE = 10;

// GET /lessons              -> visão geral dos níveis HSK 1..6
// GET /lessons?level=1      -> lições do nível (palavras agrupadas em blocos de 10)
router.get('/', (req, res) => {
  const level = req.query.level ? Number(req.query.level) : null;

  if (level) {
    const words = db
      .prepare('SELECT id, hanzi, pinyin, translation FROM vocabulary WHERE hsk_level = ? ORDER BY id')
      .all(level);

    const lessons = [];
    for (let i = 0; i < words.length; i += LESSON_SIZE) {
      const index = lessons.length + 1;
      const chunk = words.slice(i, i + LESSON_SIZE);
      lessons.push({
        id: `hsk${level}-${index}`,
        level,
        index,
        title: `Lição ${index}`,
        wordCount: chunk.length,
        words: chunk,
      });
    }

    return res.json({
      level,
      title: HSK_TITLES[level] || `HSK ${level}`,
      lessonCount: lessons.length,
      lessons,
    });
  }

  const counts = db
    .prepare('SELECT hsk_level AS level, COUNT(*) AS c FROM vocabulary GROUP BY hsk_level')
    .all();
  const countByLevel = Object.fromEntries(counts.map((r) => [r.level, r.c]));

  const levels = [1, 2, 3, 4, 5, 6].map((l) => {
    const wordCount = countByLevel[l] || 0;
    return {
      level: l,
      title: HSK_TITLES[l],
      wordCount,
      lessonCount: Math.ceil(wordCount / LESSON_SIZE),
      available: wordCount > 0,
    };
  });

  res.json({ levels });
});

export default router;
