import { Router } from 'express';
import { db } from '../db/database.js';
import { config } from '../config.js';
import { authOptional } from '../middleware/auth.js';

const router = Router();

// Orquestra chamadas ao Serviço de IA (Python/FastAPI). Quando IA_SERVICE_URL
// não está configurado ou o serviço falha, cai em um gerador local (fallback)
// para que o frontend continue funcional mesmo sem a chave do Gemini.
async function callIA(path, payload) {
  if (!config.iaServiceUrl) return null;
  try {
    const r = await fetch(`${config.iaServiceUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Exercício de múltipla escolha gerado localmente (sem IA).
function localExercise(word) {
  const distractors = db
    .prepare('SELECT translation FROM vocabulary WHERE translation != ? ORDER BY RANDOM() LIMIT 3')
    .all(word.translation)
    .map((r) => r.translation);
  const options = shuffle([word.translation, ...distractors]);
  return {
    source: 'fallback',
    type: 'multiple_choice',
    question: `O que significa "${word.hanzi}" (${word.pinyin})?`,
    options,
    answer: word.translation,
    word: { hanzi: word.hanzi, pinyin: word.pinyin, translation: word.translation },
  };
}

// POST /exercise/generate  { vocabularyId } | { word, pinyin, meaning }
router.post('/exercise/generate', authOptional, async (req, res) => {
  let { vocabularyId, word, pinyin, meaning } = req.body || {};
  let vocab = null;

  if (vocabularyId) {
    vocab = db.prepare('SELECT * FROM vocabulary WHERE id = ?').get(vocabularyId);
    if (!vocab) return res.status(404).json({ error: 'Vocabulário não encontrado' });
    word = vocab.hanzi;
    pinyin = vocab.pinyin;
    meaning = vocab.translation;
  }

  if (!word) {
    return res.status(400).json({ error: 'Informe vocabularyId ou { word, pinyin, meaning }' });
  }

  const ia = await callIA('/generate/exercise', { word, pinyin, meaning });
  if (ia) return res.json({ source: 'ia', ...ia });

  return res.json(
    localExercise(vocab || { hanzi: word, pinyin: pinyin || '', translation: meaning || '' })
  );
});

// POST /flashcard/example  { vocabularyId } | { word }
router.post('/flashcard/example', authOptional, async (req, res) => {
  let { vocabularyId, word } = req.body || {};

  if (vocabularyId) {
    const vocab = db.prepare('SELECT * FROM vocabulary WHERE id = ?').get(vocabularyId);
    if (vocab) word = vocab.hanzi;
  }

  if (!word) {
    return res.status(400).json({ error: 'Informe vocabularyId ou word' });
  }

  const ia = await callIA('/generate/flashcard', { word });
  if (ia) return res.json({ source: 'ia', ...ia });

  return res.json({
    source: 'fallback',
    word,
    sentence: null,
    translation: null,
    note: 'Serviço de IA indisponível — exemplo de frase não gerado.',
  });
});

export default router;
