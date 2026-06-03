import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import lessonRoutes from './routes/lessons.js';
import vocabularyRoutes from './routes/vocabulary.js';
import exerciseRoutes from './routes/exercises.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/', (_req, res) =>
    res.json({ name: 'MandaRim API', status: 'ok', health: '/health' })
  );
  app.get('/health', (_req, res) =>
    res.json({ status: 'ok', time: new Date().toISOString() })
  );

  app.use('/auth', authRoutes);
  app.use('/user', userRoutes);
  app.use('/lessons', lessonRoutes);
  app.use('/vocabulary', vocabularyRoutes);
  app.use('/', exerciseRoutes); // /exercise/generate, /flashcard/example

  // 404
  app.use((_req, res) => res.status(404).json({ error: 'Rota não encontrada' }));

  // Tratador de erros
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  });

  return app;
}
