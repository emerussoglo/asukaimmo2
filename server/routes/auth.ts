import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { getDb } from '../db.js';
import { hashPassword, verifyPassword, createSession, requireAuth, AuthRequest } from '../auth.js';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Le nom, l’email et le mot de passe sont obligatoires.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit comporter au moins 6 caractères.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const db = getDb();

    // Check if email already registered
    const existing = await db.execute({
      sql: 'SELECT id FROM users WHERE LOWER(email) = ?',
      args: [normalizedEmail],
    });

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Cet email est déjà utilisé. Veuillez vous connecter.' });
    }

    const userId = `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const { hash, salt } = hashPassword(password);
    const userRole = role || 'PROPRIETAIRE';

    // Insert user into Turso
    await db.execute({
      sql: `INSERT INTO users (
        id, name, email, password_hash, salt, phone, whatsapp, role, plan,
        listings_count, max_listings, is_verified, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'FREE', 0, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      args: [
        userId,
        name.trim(),
        normalizedEmail,
        hash,
        salt,
        phone?.trim() || '',
        phone?.trim() || '',
        userRole,
      ],
    });

    // Create default free subscription
    const subId = `sub_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    await db.execute({
      sql: `INSERT INTO subscriptions (id, user_id, plan_id, status, billing_cycle, started_at)
            VALUES (?, ?, 'FREE', 'ACTIVE', 'MONTHLY', CURRENT_TIMESTAMP)`,
      args: [subId, userId],
    });

    // Create session
    const token = await createSession(userId);

    const user = {
      id: userId,
      name: name.trim(),
      email: normalizedEmail,
      phone: phone?.trim() || '',
      whatsapp: phone?.trim() || '',
      role: userRole,
      plan: 'FREE',
      listings_count: 0,
      max_listings: 1,
      is_verified: true,
      created_at: new Date().toISOString(),
    };

    return res.status(201).json({
      message: 'Compte créé avec succès.',
      user,
      token,
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Erreur serveur lors de la création du compte.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Veuillez saisir votre email et votre mot de passe.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const db = getDb();

    const userRes = await db.execute({
      sql: 'SELECT * FROM users WHERE LOWER(email) = ?',
      args: [normalizedEmail],
    });

    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Identifiants invalides. Aucun compte trouvé avec cet email.' });
    }

    const u = userRes.rows[0];

    // If password_hash is not set (legacy or initial migration), allow initial update or check password
    if (!u.password_hash || !u.salt) {
      // First login setup
      const { hash, salt } = hashPassword(password);
      await db.execute({
        sql: 'UPDATE users SET password_hash = ?, salt = ? WHERE id = ?',
        args: [hash, salt, u.id],
      });
    } else {
      const isValid = verifyPassword(password, u.password_hash as string, u.salt as string);
      if (!isValid) {
        return res.status(401).json({ error: 'Identifiants invalides. Mot de passe incorrect.' });
      }
    }

    const token = await createSession(u.id as string);

    // Refresh listings count
    const countRes = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM listings WHERE owner_id = ?',
      args: [u.id],
    });
    const currentListingsCount = Number(countRes.rows[0]?.count) || 0;

    const user = {
      id: u.id as string,
      name: u.name as string,
      email: u.email as string,
      phone: (u.phone as string) || '',
      whatsapp: (u.whatsapp as string) || '',
      role: (u.role as string) || 'PROPRIETAIRE',
      avatar: (u.avatar as string) || '',
      is_verified: Number(u.is_verified) === 1,
      plan: (u.plan as string) || 'FREE',
      listings_count: currentListingsCount,
      max_listings: Number(u.max_listings) || 1,
      bio: (u.bio as string) || '',
      city: (u.city as string) || 'Cotonou',
      created_at: (u.created_at as string) || new Date().toISOString(),
    };

    return res.json({
      message: 'Connexion réussie.',
      user,
      token,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Erreur serveur lors de la connexion.' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const db = getDb();

    // Refresh listings count from database
    const countRes = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM listings WHERE owner_id = ?',
      args: [user.id],
    });
    user.listings_count = Number(countRes.rows[0]?.count) || 0;

    return res.json({ user });
  } catch (err: any) {
    console.error('Auth check error:', err);
    return res.status(500).json({ error: 'Erreur lors de la récupération de la session.' });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const db = getDb();
    try {
      await db.execute({
        sql: 'DELETE FROM sessions WHERE token = ?',
        args: [token],
      });
    } catch (e) {
      console.warn('Error deleting session on logout:', e);
    }
  }
  return res.json({ message: 'Déconnexion effectuée.' });
});

export default router;
