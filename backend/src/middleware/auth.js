import jwt from 'jsonwebtoken';
import { config } from '../config.js';

function extractToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

// Exige um JWT válido. Anexa req.user = { id, email }.
export function authRequired(req, res, next) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

// Não exige token, mas anexa req.user quando presente e válido.
export function authOptional(req, res, next) {
  const token = extractToken(req);
  if (token) {
    try {
      const payload = jwt.verify(token, config.jwtSecret);
      req.user = { id: payload.sub, email: payload.email };
    } catch {
      /* token inválido é ignorado no modo opcional */
    }
  }
  next();
}
