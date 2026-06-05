import { useEffect, useState } from 'react';
import { api, API_BASE } from '../api';
import { useAuth } from '../auth';
import type { Word, Exercise as Ex } from '../types';
import './Exercise.css';
import './Practice.css';

// "Dominar" uma palavra 
const MAX_BOX = 5;

type Mode = 'choice' | 'pinyin';

interface Example {
  source: string;
  word: string;
  sentence: string | null;
  pinyin: string | null;
  translation: string | null;
  note?: string | null;
}

function srcLabel(source: string) {
  if (source === 'gemini' || source === 'ia') return 'via IA · Gemini';
  if (source === 'mock') return 'IA (mock)';
  return 'gerador local';
}

// remove marcas de tom e espaços para comparar pinyin
function normPinyin(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

function speak(hanzi: string) {
  const audio = new Audio(`${API_BASE}/tts?lang=zh-CN&text=${encodeURIComponent(hanzi)}`);
  audio.play().catch(() => {
    /* sem áudio é tolerável */
  });
}

export function Practice() {
  const { refresh } = useAuth();
  const [pool, setPool] = useState<Word[]>([]);
  const [word, setWord] = useState<Word | null>(null);
  const [box, setBox] = useState(0);
  const [mastered, setMastered] = useState(false);
  const [round, setRound] = useState(0); // exercícios feitos com esta palavra nesta sessão

  const [mode, setMode] = useState<Mode>('choice');
  const [ex, setEx] = useState<Ex | null>(null);
  const [example, setExample] = useState<Example | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [typed, setTyped] = useState('');
  const [result, setResult] = useState<null | boolean>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // carrega o vocabulário HSK 1 e começa por uma palavra aleatória
  useEffect(() => {
    api<{ vocabulary: Word[] }>('/vocabulary?level=1', { auth: true })
      .then((d) => {
        setPool(d.vocabulary);
        if (d.vocabulary.length) {
          selectWord(d.vocabulary[Math.floor(Math.random() * d.vocabulary.length)]);
        }
      })
      .catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Carrega uma rodada (exercício + frase de exemplo) para a MESMA palavra.
  async function loadRound(w: Word, m: Mode) {
    setError('');
    setPicked(null);
    setTyped('');
    setResult(null);
    setEx(null);
    setExample(null);
    setLoading(true);
    try {
      // a frase de exemplo dá o "contexto"
      const exampleReq = api<Example>('/flashcard/example', {
        method: 'POST',
        body: { vocabularyId: w.id },
        auth: true,
      });
      if (m === 'choice') {
        const [exercise, sample] = await Promise.all([
          api<Ex>('/exercise/generate', { method: 'POST', body: { vocabularyId: w.id }, auth: true }),
          exampleReq,
        ]);
        setEx(exercise);
        setExample(sample);
      } else {
        setExample(await exampleReq);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar exercício');
    } finally {
      setLoading(false);
    }
  }

  function selectWord(w: Word) {
    setWord(w);
    setBox(w.progress?.box ?? 0);
    setMastered(w.progress?.status === 'learned');
    setRound(0);
    setMode('choice');
    loadRound(w, 'choice');
  }

  function nextRound() {
    if (!word) return;
    // alterna escolha ↔ pinyin para variar o jeito de praticar a mesma palavra
    const m: Mode = mode === 'choice' ? 'pinyin' : 'choice';
    setMode(m);
    setRound((r) => r + 1);
    loadRound(word, m);
  }

  function pickAnother() {
    if (!pool.length) return;
    const others = pool.filter((w) => w.id !== word?.id && w.progress?.status !== 'learned');
    const arr = others.length ? others : pool.filter((w) => w.id !== word?.id);
    if (arr.length) selectWord(arr[Math.floor(Math.random() * arr.length)]);
  }

  async function record(correct: boolean) {
    if (!word) return;
    setResult(correct);
    try {
      const resp = await api<{ progress: { box: number; status: string } }>('/user/progress', {
        method: 'POST',
        body: { vocabularyId: word.id, correct },
        auth: true,
      });
      setBox(resp.progress.box);
      if (resp.progress.status === 'learned') setMastered(true);
      refresh(); // atualiza a barra de XP / streak no resto do app
    } catch {
    }
  }

  function answerChoice(option: string) {
    if (picked || !ex) return;
    setPicked(option);
    record(option === ex.answer);
  }

  function checkPinyin(e: React.FormEvent) {
    e.preventDefault();
    if (result !== null || !word) return;
    record(normPinyin(typed) === normPinyin(word.pinyin));
  }

  const pct = Math.round((box / MAX_BOX) * 100);

  return (
    <section className="rise">
      <div className="section-head">
        <h2>Praticar</h2>
        <span className="tag">treine a mesma palavra até dominar</span>
      </div>

      {/* escolha da palavra */}
      <div className="deckbar">
        <span className="muted">Palavra</span>
        <select
          className="inline"
          value={word?.id ?? ''}
          onChange={(e) => {
            const w = pool.find((p) => p.id === Number(e.target.value));
            if (w) selectWord(w);
          }}
        >
          {pool.map((w) => (
            <option key={w.id} value={w.id}>
              {w.hanzi} — {w.pinyin}
            </option>
          ))}
        </select>
        <button className="btn ghost small" onClick={pickAnother} disabled={!pool.length}>
          🎲 Outra palavra
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {word && (
        <>
          {/* palavra-alvo + medidor de domínio */}
          <div className="panel target">
            <button className="speak-btn" title="Pronúncia" onClick={() => speak(word.hanzi)}>
              🔊
            </button>
            <div className="target-hanzi">{word.hanzi}</div>
            <div className="target-meta">
              {word.pinyin} · {word.translation}
            </div>

            <div className="meter" aria-label={`Domínio: ${box} de ${MAX_BOX}`}>
              {Array.from({ length: MAX_BOX }).map((_, idx) => (
                <span key={idx} className={'seg' + (idx < box ? ' on' : '')} />
              ))}
            </div>
            <div className="meter-label">
              {mastered ? (
                <span className="mastered">🏆 Palavra dominada!</span>
              ) : (
                <>Domínio {pct}% · acerte mais {MAX_BOX - box}× para dominar</>
              )}
            </div>
          </div>

          {/* frase de contexto */}
          <div className="panel context-card">
            <div className="context-head">
              <span>Em contexto</span>
              {example && <span className="badge-src">{srcLabel(example.source)}</span>}
            </div>
            {!example ? (
              <p className="muted center" style={{ margin: 0 }}>Gerando frase…</p>
            ) : example.sentence ? (
              <>
                <div className="context-sentence" onClick={() => speak(example.sentence!)} title="Ouvir">
                  {example.sentence}
                </div>
                {example.pinyin && <div className="context-pinyin">{example.pinyin}</div>}
                {example.translation && <div className="context-trans">{example.translation}</div>}
              </>
            ) : (
              <p className="muted center" style={{ margin: 0 }}>
                {example.note || 'Frase de exemplo indisponível no momento.'}
              </p>
            )}
          </div>

          {/* exercício */}
          <div className="panel">
            {loading && <p className="muted center">Gerando exercício…</p>}

            {/* múltipla escolha */}
            {mode === 'choice' && ex && (
              <>
                <p style={{ fontSize: 19, marginTop: 0 }}>
                  {ex.question} <span className="badge-src">{srcLabel(ex.source)}</span>
                </p>
                <div className="options">
                  {ex.options.map((opt) => {
                    let cls = 'option';
                    if (picked) {
                      if (opt === ex.answer) cls += ' correct';
                      else if (opt === picked) cls += ' wrong';
                    }
                    return (
                      <button
                        key={opt}
                        className={cls}
                        disabled={!!picked}
                        onClick={() => answerChoice(opt)}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* escrever o pinyin */}
            {mode === 'pinyin' && !loading && (
              <form onSubmit={checkPinyin}>
                <p className="center muted" style={{ marginTop: 0 }}>
                  Qual é o pinyin de <b style={{ color: 'var(--text)' }}>{word.hanzi}</b>?
                </p>
                <div className="field" style={{ maxWidth: 320, margin: '14px auto 0' }}>
                  <label>Digite o pinyin (com ou sem tons)</label>
                  <input
                    value={typed}
                    autoFocus
                    disabled={result !== null}
                    onChange={(e) => setTyped(e.target.value)}
                    placeholder="ex.: ni, hao, beijing"
                  />
                </div>
                {result === null && (
                  <div className="center" style={{ marginTop: 16 }}>
                    <button className="btn" type="submit">Verificar</button>
                  </div>
                )}
              </form>
            )}

            {/* feedback + próxima */}
            {result !== null && (
              <div className="center" style={{ marginTop: 18 }}>
                <p className={result ? 'feedback ok' : 'feedback no'}>
                  {result ? '✓ Correto!' : `✗ Resposta certa: ${word.pinyin} — ${word.translation}`}
                </p>
                <div className="actions" style={{ justifyContent: 'center', gap: 10, marginTop: 8 }}>
                  <button className="btn" onClick={nextRound}>Continuar →</button>
                  <button className="btn ghost" onClick={pickAnother}>Trocar palavra</button>
                </div>
                <p className="muted" style={{ marginTop: 10, fontSize: 13 }}>
                  {round + 1} exercício(s) nesta palavra
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
