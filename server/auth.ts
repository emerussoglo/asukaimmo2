import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { getDb } from './db.js';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  role: string;
  avatar?: string;
  is_verified: boolean;
  plan: string;
  listings_count: number;
  max_listings: number;
  bio?: string;
  city?: string;
  created_at: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
  token?: string;
}

export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const computedHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computedHash, 'hex'));
  } catch {
    return false;
  }
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function createSession(userId: string): Promise<string> {
  const db = getDb();
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
  const id = `sess_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

  await db.execute({
    sql: 'INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
    args: [id, userId, token, expiresAt],
  });

  return token;
}

export async function getUserByToken(token: string): Promise<AuthUser | null> {
  const db = getDb();
  const now = new Date().toISOString();

  const sessRes = await db.execute({
    sql: 'SELECT user_id, expires_at FROM sessions WHERE token = ?',
    args: [token],
  });

  if (sessRes.rows.length === 0) return null;
  const session = sessRes.rows[0];

  if ((session.expires_at as string) < now) {
    // expired
    await db.execute({ sql: 'DELETE FROM sessions WHERE token = ?', args: [token] });
    return null;
  }

  const userRes = await db.execute({
    sql: 'SELECT * FROM users WHERE id = ?',
    args: [session.user_id],
  });

  if (userRes.rows.length === 0) return null;
  const u = userRes.rows[0];

  return {
    id: u.id as string,
    name: u.name as string,
    email: u.email as string,
    phone: (u.phone as string) || '',
    whatsapp: (u.whatsapp as string) || '',
    role: (u.role as string) || 'PROPRIETAIRE',
    avatar: (u.avatar as string) || '',
    is_verified: Number(u.is_verified) === 1,
    plan: (u.plan as string) || 'FREE',
    listings_count: Number(u.listings_count) || 0,
    max_listings: Number(u.max_listings) || 1,
    bio: (u.bio as string) || '',
    city: (u.city as string) || 'Cotonou',
    created_at: (u.created_at as string) || new Date().toISOString(),
  };
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  if (!token) {
    return res.status(401).json({ error: 'Non authentifié. Veuillez vous connecter.' });
  }

  try {
    const user = await getUserByToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Session invalide ou expirée.' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (err: any) {
    console.error('Auth verification error:', err);
    return res.status(500).json({ error: 'Erreur lors de la vérification de la session.' });
  }
}
