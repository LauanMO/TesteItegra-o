import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';
import type { Word, Exercise as Ex } from '../types';
import './Exercise.css';

type Mode = 'choice' | 'pinyin';

function srcLabel(source: string) {
  if (source === 'gemini') return 'via IA · Gemini';
  if (source === 'mock') return 'IA (mock)';
  return 'gerador local';
}

// remove marcas de tom e espaços para comparar pinyin: "Běijīng" -> "beijing"
function normPinyin(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

export function Exercise() {
  const { refresh } = useAuth();
  const [mode, setMode] = useState<Mode>('choice');
  const [pool, setPool] = useState<Word[]>([]);
  const [word, setWord] = useState<Word | null>(null);
  const [ex, setEx] = useState<Ex | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [typed, setTyped] = useState('');
  const [result, setResult] = useState<null | boolean>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api<{ vocabulary: Word[] }>('/vocabulary?level=1', { auth: true })
      .then((d) => setPool(d.vocabulary))
      .catch((e) => setError(e.message));
  }, []);

  function pickWord(): Word | null {
    if (!pool.length) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  async function next() {
    setError('');
    setPicked(null);
    setTyped('');
    setResult(null);
    setEx(null);
    const w = pickWord();
    setWord(w);
    if (!w) return;

    if (mode === 'choice') {
      setLoading(true);
      try {
        const data = await api<Ex>('/exercise/generate', {
          method: 'POST',
          body: { vocabularyId: w.id },
          auth: true,
        });
        setEx(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao gerar exercício');
      } finally {
        setLoading(false);
      }
    }
  }

  // primeira questão quando o pool carrega ou o modo muda
  useEffect(() => {
    if (pool.length) next();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool.length, mode]);

  async function record(correct: boolean) {
    if (!word) return;
    setResult(correct);
    try {
      await api('/user/progress', {
        method: 'POST',
        body: { vocabularyId: word.id, correct },
        auth: true,
      });
      refresh();
    } catch {
      /* progresso é best-effort */
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

  return (
    <section className="rise">
      <div className="section-head">
        <h2>Exercício</h2>
        <span className="tag">HSK 1</span>
      </div>

      <div className="modeswitch">
        <button className={mode === 'choice' ? 'active' : ''} onClick={() => setMode('choice')}>
          Múltipla escolha
        </button>
        <button className={mode === 'pinyin' ? 'active' : ''} onClick={() => setMode('pinyin')}>
          Escrever o pinyin
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="panel">
        {!word && <p className="muted center">Carregando…</p>}

        {/* ---------- Múltipla escolha ---------- */}
        {mode === 'choice' && word && (
          <>
            {loading && <p className="muted center">Gerando exercício…</p>}
            {ex && (
              <>
                <p style={{ fontSize: 19, marginTop: 0 }}>
                  {ex.question}{' '}
                  <span className="badge-src">{srcLabel(ex.source)}</span>
                </p>
                <div className="options">
                  {ex.options.map((opt) => {
                    let cls = 'option';
                    if (picked) {
                      if (opt === ex.answer) cls += ' correct';
                      else if (opt === picked) cls += ' wrong';
                    }
                    return (
                      <button key={opt} className={cls} disabled={!!picked} onClick={() => answerChoice(opt)}>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}

        {/* ---------- Escrever o pinyin ---------- */}
        {mode === 'pinyin' && word && (
          <form onSubmit={checkPinyin}>
            <div className="prompt-hanzi">{word.hanzi}</div>
            <p className="center muted" style={{ marginTop: 8 }}>{word.translation}</p>
            <div className="field" style={{ maxWidth: 320, margin: '18px auto 0' }}>
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

        {/* ---------- Feedback ---------- */}
        {result !== null && word && (
          <div className="center" style={{ marginTop: 18 }}>
            <p className={result ? 'feedback ok' : 'feedback no'}>
              {result ? '✓ Correto!' : `✗ Resposta certa: ${word.pinyin} — ${word.translation}`}
            </p>
            <button className="btn" onClick={next} style={{ marginTop: 8 }}>Próxima →</button>
          </div>
        )}
      </div>
    </section>
  );
}
