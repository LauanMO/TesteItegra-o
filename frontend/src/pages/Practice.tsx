import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';
import { SpeakButton } from '../components/SpeakButton';
import type { Word } from '../types';
import './Exercise.css';
import './Practice.css';

// "Dominar" uma palavra = chegar ao topo das boxes de Leitner (igual ao backend, user.js).
const MAX_BOX = 5;

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

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Monta 4 alternativas: a tradução correta + 3 distratores de outras palavras.
function buildOptions(pool: Word[], correct: string): string[] {
  const distractors = shuffle(
    Array.from(new Set(pool.map((w) => w.translation).filter((t) => t && t !== correct)))
  ).slice(0, 3);
  return shuffle([correct, ...distractors]);
}

export function Practice() {
  const { refresh } = useAuth();
  const [pool, setPool] = useState<Word[]>([]);
  const [word, setWord] = useState<Word | null>(null);
  const [box, setBox] = useState(0);
  const [mastered, setMastered] = useState(false);
  const [round, setRound] = useState(0); // frases praticadas com esta palavra nesta sessão

  const [example, setExample] = useState<Example | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [result, setResult] = useState<null | boolean>(null);
  const [reveal, setReveal] = useState(false); // revelar o significado-alvo manualmente
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // carrega o vocabulário HSK 1 e começa por uma palavra aleatória
  useEffect(() => {
    api<{ vocabulary: Word[] }>('/vocabulary?level=1', { auth: true })
      .then((d) => {
        setPool(d.vocabulary);
        if (d.vocabulary.length) {
          selectWord(d.vocabulary[Math.floor(Math.random() * d.vocabulary.length)], d.vocabulary);
        }
      })
      .catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Carrega uma rodada: gera UMA frase de contexto (1 chamada de IA) e monta as
  // alternativas localmente — o usuário lê a frase e descobre o sentido da palavra.
  async function loadRound(w: Word, list: Word[]) {
    setError('');
    setPicked(null);
    setResult(null);
    setReveal(false);
    setExample(null);
    setOptions(buildOptions(list, w.translation));
    setLoading(true);
    try {
      const sample = await api<Example>('/flashcard/example', {
        method: 'POST',
        body: { vocabularyId: w.id },
        auth: true,
      });
      setExample(sample);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao gerar a frase de contexto');
    } finally {
      setLoading(false);
    }
  }

  function selectWord(w: Word, list: Word[] = pool) {
    setWord(w);
    setBox(w.progress?.box ?? 0);
    setMastered(w.progress?.status === 'learned');
    setRound(0);
    loadRound(w, list);
  }

  function nextRound() {
    if (!word) return;
    setRound((r) => r + 1);
    loadRound(word, pool);
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
      /* progresso é best-effort */
    }
  }

  function answer(option: string) {
    if (picked || !word) return;
    setPicked(option);
    record(option === word.translation);
  }

  const pct = Math.round((box / MAX_BOX) * 100);
  const showMeaning = reveal || result !== null;

  return (
    <section className="rise">
      <div className="section-head">
        <h2>Praticar</h2>
        <span className="tag">leia o contexto e descubra o significado</span>
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
          {/* palavra-alvo + medidor de domínio (significado fica oculto) */}
          <div className="panel target">
            <div className="target-row">
              <SpeakButton text={word.hanzi} size="lg" />
              <div className="target-hanzi">{word.hanzi}</div>
            </div>
            <div className="target-meta">
              {word.pinyin} ·{' '}
              <span
                className={'blurmask' + (showMeaning ? ' shown' : '')}
                onClick={() => setReveal(true)}
                title={showMeaning ? '' : 'Clique para revelar o significado'}
              >
                {word.translation}
              </span>
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

          {/* contexto + pergunta */}
          <div className="panel">
            {loading && <p className="muted center">Gerando contexto…</p>}

            {!loading && example && (
              <>
                <div className="context-head">
                  <span>Leia a frase</span>
                  <span className="badge-src">{srcLabel(example.source)}</span>
                </div>

                {example.sentence ? (
                  <>
                    <div className="context-sentence">
                      <SpeakButton text={example.sentence} size="sm" />
                      <span>{example.sentence}</span>
                    </div>
                    {example.pinyin && <div className="context-pinyin">{example.pinyin}</div>}
                  </>
                ) : (
                  <p className="muted center">{example.note || 'Frase indisponível.'}</p>
                )}

                <p className="ctx-question">
                  O que <b>{word.hanzi}</b> significa nesta frase?
                </p>
                <div className="options">
                  {options.map((opt) => {
                    let cls = 'option';
                    if (picked) {
                      if (opt === word.translation) cls += ' correct';
                      else if (opt === picked) cls += ' wrong';
                    }
                    return (
                      <button
                        key={opt}
                        className={cls}
                        disabled={!!picked}
                        onClick={() => answer(opt)}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {result !== null && (
                  <div className="center afterbox">
                    <p className={result ? 'feedback ok' : 'feedback no'}>
                      {result ? '✓ Correto!' : `✗ ${word.hanzi} significa “${word.translation}”`}
                    </p>
                    {example.translation && (example.source === 'gemini' || example.source === 'ia') && (
                      <p className="whats-happening">
                        O que está acontecendo: <i>{example.translation}</i>
                      </p>
                    )}
                    <div
                      className="actions"
                      style={{ justifyContent: 'center', gap: 10, marginTop: 12 }}
                    >
                      <button className="btn" onClick={nextRound}>Continuar →</button>
                      <button className="btn ghost" onClick={pickAnother}>Trocar palavra</button>
                    </div>
                    <p className="muted" style={{ marginTop: 10, fontSize: 13 }}>
                      {round + 1} frase(s) praticada(s) com esta palavra
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </section>
  );
}
