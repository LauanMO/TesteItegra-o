import { fileURLToPath } from 'node:url';
import { db } from './database.js';
import { initSchema } from './schema.js';
import { HSK1 } from './hsk1.js';

// Popula o vocabulário do HSK 1 na primeira execução. Idempotente:
// se já houver palavras de HSK 1, não faz nada.
export function runSeed() {
  const { c: count } = db.prepare("SELECT COUNT(*) c FROM vocabulary WHERE hsk_level = 1").get();
  if (count > 0) {
    return { seeded: false, existing: count };
  }

  const insert = db.prepare(
    'INSERT INTO vocabulary (hanzi, pinyin, translation, hsk_level) VALUES (?, ?, ?, 1)'
  );

  db.exec('BEGIN');
  try {
    for (const w of HSK1) insert.run(w.hanzi, w.pinyin, w.translation);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  console.log(`🌱 Seed: ${HSK1.length} palavras do HSK 1 inseridas.`);
  return { seeded: true, count: HSK1.length };
}

// Permite rodar diretamente: `npm run seed`
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  initSchema();
  console.log(runSeed());
}
