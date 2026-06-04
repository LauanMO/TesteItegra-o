import { useEffect, useMemo, useState } from 'react';
import { api, API_BASE } from '../api';
import type { Word } from '../types';
import './Flashcards.css';

// Fala em mandarim. Estratégia em camadas para funcionar em qualquer máquina:
//  1) TTS online (Google Translate) — não exige voz zh instalada no SO;
//  2) fallback: Web Speech API nativa, caso o navegador tenha voz em zh.
// A reprodução de áudio cross-origin via <audio> não sofre bloqueio de CORS.
// Embaralha (Fisher-Yates) para o baralho variar a cada visita.
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function speakViaWebSpeech(hanzi: string): boolean {
  if (!('speechSynthesis' in window)) return false;
  const voices = window.speechSynthesis.getVoices();
  const zh = voices.find((v) => v.lang?.toLowerCase().startsWith('zh'));
  const u = new SpeechSynthesisUtterance(hanzi);
  u.lang = zh?.lang || 'zh-CN';
  if (zh) u.voice = zh;
  u.rate = 0.85;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
  return true;
}

function speak(hanzi: string) {
  // Toca pelo proxy do backend (evita bloqueio/consent do Google no navegador).
  const url = `${API_BASE}/tts?lang=zh-CN&text=${encodeURIComponent(hanzi)}`;
  const audio = new Audio(url);
  audio.play().catch(() => {
    // Sem internet/bloqueado → tenta a voz nativa do navegador.
    if (!speakViaWebSpeech(hanzi)) {
      console.warn('[MandaRim] Não foi possível reproduzir a pronúncia.');
    }
  });
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
        setWords(shuffle(d.vocabulary));
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
