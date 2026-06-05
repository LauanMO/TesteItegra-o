import { useEffect, useState } from 'react';
import { api } from '../api';
import type { Progress } from '../types';
import './Dashboard.css';

export function Dashboard() {
  const [data, setData] = useState<Progress | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<Progress>('/user/progress', { auth: true })
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="error">{error}</div>;
  if (!data) return <p className="muted">Carregando painel…</p>;

  const s = data.stats;
  const cards = [
    { num: s.learned, lab: 'Aprendidas', accent: true },
    { num: s.learning, lab: 'Aprendendo', accent: false },
    { num: s.pending, lab: 'Pendentes', accent: false },
    { num: s.dueNow, lab: 'Para revisar', accent: false },
  ];

  return (
    <section>
      <div className="section-head rise">
        <h2>Seu painel</h2>
        <span className="tag">🔥 {data.streak} dia(s) de sequência</span>
      </div>

      <div className="statgrid">
        {cards.map((c, idx) => (
          <div className={'statcard rise' + (c.accent ? ' accent' : '')} key={idx}>
            <div className="num">{c.num}</div>
            <div className="lab">{c.lab}</div>
          </div>
        ))}
      </div>

      <div className="panel rise" style={{ marginTop: 22 }}>
        <h3 style={{ fontSize: 20, marginBottom: 8 }}>Progresso por nível</h3>
        {data.byLevel.map((l) => {
          // barra de XP
          const pct = l.total ? Math.round((Number(l.boxSum) / (l.total * l.maxBox)) * 100) : 0;
          return (
            <div className="levelrow" key={l.level}>
              <span className="lname">HSK {l.level}</span>
              <div className="bar"><span style={{ width: pct + '%' }} /></div>
              <span className="frac">{l.learned}/{l.total}</span>
            </div>
          );
        })}
      </div>

      <div className="panel rise" style={{ marginTop: 22 }}>
        <h3 style={{ fontSize: 20, marginBottom: 4 }}>Para revisar agora</h3>
        {data.dueWords.length === 0 ? (
          <p className="muted">Nada pendente — pratique no Exercício para criar revisões. 🎉</p>
        ) : (
          <div className="duelist">
            {data.dueWords.map((w) => (
              <span className="chip" key={w.id}>
                <b>{w.hanzi}</b> · {w.pinyin} — {w.translation}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
