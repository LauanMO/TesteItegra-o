import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const config = {
  port: Number(process.env.PORT) || 3001,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-troque-em-producao',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  iaServiceUrl: (process.env.IA_SERVICE_URL || '').replace(/\/$/, ''),
  // Por padrão o banco fica em backend/data/mandarim.db (ignorado pelo git).
  dbPath: process.env.DB_PATH || path.join(__dirname, '..', 'data', 'mandarim.db'),
};
