import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import type { Word } from '../types';
import './Flashcards.css';

function speak(hanzi: string) {
  if (!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(hanzi);
  u.lang = 'zh-CN';
  u.rate = 0.85;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

export function Flashcards() {
  const [level, setLevel] = useState(1);
  const [words, setWords] = useState<Word[]>([]);
  const [i, setI] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api<{ vocabulary: Word[] }>(`/vocabulary?level=${level}`, { auth: true })
      .then((d) => {
        setWords(d.vocabulary);
        setI(0);
        setRevealed(false);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [level]);

  const word = words[i];
  const levels = useMemo(() => [1, 2, 3, 4, 5, 6], []);

  function go(delta: number) {
    if (!words.length) return;
    setI((prev) => (prev + delta + words.length) % words.length);
    setRevealed(false);
  }

  return (
    <section className="rise">
      <div className="section-head">
        <h2>Flashcards</h2>
        <span className="tag">caractere → pinyin → tradução</span>
      </div>

      <div className="deckbar">
        <span className="muted">Nível</span>
        <select className="inline" value={level} onChange={(e) => setLevel(Number(e.target.value))}>
          {levels.map((l) => (
            <option key={l} value={l}>HSK {l}</option>
          ))}
        </select>
        {words.length > 0 && <span className="count">{i + 1} / {words.length}</span>}
      </div>

      {error && <div className="error">{error}</div>}
      {loading && <p className="muted">Carregando vocabulário…</p>}

      {!loading && !error && !word && (
        <div className="panel center">
          <p className="muted">Nenhuma palavra cadastrada para o HSK {level} ainda.</p>
        </div>
      )}

      {word && (
        <>
          <div className="flashcard" key={word.id}>
            <span className="corner">字</span>
            <div className="hanzi">{word.hanzi}</div>
            <div className={revealed ? 'pinyin' : 'pinyin reveal-hidden'}>{word.pinyin}</div>
            <div className={revealed ? 'trans' : 'trans reveal-hidden'}>{word.translation}</div>

            <div className="actions">
              <button className="btn ghost" onClick={() => speak(word.hanzi)}>🔊 Pronúncia</button>
              <button className="btn ghost" onClick={() => setRevealed((r) => !r)}>
                {revealed ? 'Ocultar' : 'Revelar'}
              </button>
            </div>
          </div>

          <div className="actions" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18 }}>
            <button className="btn ghost" onClick={() => go(-1)}>← Anterior</button>
            <button className="btn" onClick={() => go(1)}>Próximo →</button>
          </div>
        </>
      )}
    </section>
  );
}
