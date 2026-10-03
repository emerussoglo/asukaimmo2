import { Router, Response } from 'express';
import crypto from 'crypto';
import { getDb } from '../db.js';
import { requireAuth, AuthRequest, hashPassword, verifyPassword } from '../auth.js';

const router = Router();

// Require authentication on all dashboard routes
router.use(requireAuth);

function parseListingRow(r: any) {
  let images: string[] = [];
  try {
    images = typeof r.images === 'string' ? JSON.parse(r.images) : r.images || [];
  } catch {
    images = [];
  }

  let features: string[] = [];
  try {
    features = typeof r.features === 'string' ? JSON.parse(r.features) : r.features || [];
  } catch {
    features = [];
  }

  return {
    id: r.id as string,
    slug: r.slug as string,
    title: r.title as string,
    description: (r.description as string) || '',
    transactionType: r.transaction_type as string,
    propertyType: r.property_type as string,
    price: Number(r.price) || 0,
    priceUnit: (r.price_unit as string) || '/ mois',
    country: (r.country as string) || 'Bénin',
    city: r.city as string,
    neighborhood: r.neighborhood as string,
    address: (r.address as string) || '',
    latitude: Number(r.latitude) || 6.36,
    longitude: Number(r.longitude) || 2.4,
    bedrooms: Number(r.bedrooms) || 0,
    bathrooms: Number(r.bathrooms) || 0,
    surface: Number(r.surface) || 0,
    images,
    features,
    status: (r.status as string) || 'PUBLISHED',
    isFeatured: Number(r.is_featured) === 1,
    isSponsored: Number(r.is_sponsored) === 1,
    likesCount: Number(r.likes_count) || 0,
    viewsCount: Number(r.views_count) || 0,
    contactsCount: Number(r.contacts_count) || 0,
    ownerId: r.owner_id as string,
    ownerName: (r.owner_name as string) || '',
    ownerPhone: (r.owner_phone as string) || '',
    ownerWhatsapp: (r.owner_whatsapp as string) || '',
    ownerRole: (r.owner_role as string) || '',
    ownerAvatar: (r.owner_avatar as string) || '',
    isOwnerVerified: Number(r.is_owner_verified) === 1,
    publishedAt: (r.created_at as string) || new Date().toISOString(),
    updatedAt: (r.updated_at as string) || new Date().toISOString(),
  };
}

// GET /api/dashboard/overview - REAL database numbers, NO fake numbers!
router.get('/overview', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const db = getDb();

    // Real user listings count
    const listRes = await db.execute({
      sql: 'SELECT * FROM listings WHERE owner_id = ? ORDER BY created_at DESC',
      args: [user.id],
    });

    const myListings = listRes.rows.map(parseListingRow);

    const totalBiens = myListings.length;
    const publishedCount = myListings.filter((l) => l.status === 'PUBLISHED').length;
    const sponsoredCount = myListings.filter((l) => l.isSponsored).length;
    const viewsCount = myListings.reduce((sum, l) => sum + (l.viewsCount || 0), 0);
    const contactsCount = myListings.reduce((sum, l) => sum + (l.contactsCount || 0), 0);
    const favoritesCount = myListings.reduce((sum, l) => sum + (l.likesCount || 0), 0);

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        plan: user.plan,
        maxListings: user.max_listings,
      },
      stats: {
        totalBiens,
        publishedCount,
        sponsoredCount,
        viewsCount,
        contactsCount,
        favoritesCount,
      },
      recentListings: myListings.slice(0, 5),
    });
  } catch (err: any) {
    console.error('Dashboard overview error:', err);
    return res.status(500).json({ error: 'Erreur lors du chargement du tableau de bord.' });
  }
});

// GET /api/dashboard/listings - User's listings only
router.get('/listings', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const db = getDb();

    const listRes = await db.execute({
      sql: 'SELECT * FROM listings WHERE owner_id = ? ORDER BY created_at DESC',
      args: [user.id],
    });

    const listings = listRes.rows.map(parseListingRow);
    return res.json({ listings });
  } catch (err: any) {
    console.error('Dashboard listings error:', err);
    return res.status(500).json({ error: 'Erreur lors du chargement de vos annonces.' });
  }
});

// GET /api/dashboard/listings/:id
router.get('/listings/:id', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const db = getDb();

    const listRes = await db.execute({
      sql: 'SELECT * FROM listings WHERE id = ? AND owner_id = ?',
      args: [id, user.id],
    });

    if (listRes.rows.length === 0) {
      return res.status(404).json({ error: 'Annonce introuvable ou vous n’avez pas l’autorisation d’y accéder.' });
    }

    return res.json({ listing: parseListingRow(listRes.rows[0]) });
  } catch (err: any) {
    console.error('Get listing by ID error:', err);
    return res.status(500).json({ error: 'Erreur lors de la récupération de l’annonce.' });
  }
});

// POST /api/dashboard/listings - Create listing
router.post('/listings', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const db = getDb();

    // Check plan quota in real database
    const countRes = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM listings WHERE owner_id = ?',
      args: [user.id],
    });
    const currentCount = Number(countRes.rows[0]?.count) || 0;

    if (currentCount >= user.max_listings) {
      return res.status(403).json({
        error: `Quota atteint : votre forfait ${user.plan} est limité à ${user.max_listings} annonce(s). Veuillez mettre à niveau votre abonnement.`,
        code: 'QUOTA_REACHED',
      });
    }

    const {
      title,
      description,
      transactionType,
      propertyType,
      price,
      priceUnit,
      country,
      city,
      neighborhood,
      address,
      latitude,
      longitude,
      bedrooms,
      bathrooms,
      surface,
      images,
      features,
    } = req.body;

    if (!title || !price || !city) {
      return res.status(400).json({ error: 'Le titre, le prix et la ville sont obligatoires.' });
    }

    const listingId = `lst_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const slugBase = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const slug = `${slugBase || 'bien'}-${Date.now().toString().slice(-4)}`;

    await db.execute({
      sql: `INSERT INTO listings (
        id, slug, title, description, transaction_type, property_type,
        price, price_unit, country, city, neighborhood, address,
        latitude, longitude, bedrooms, bathrooms, surface,
        images, features, status, is_featured, is_sponsored,
        likes_count, views_count, contacts_count,
        owner_id, owner_name, owner_phone, owner_whatsapp,
        owner_role, is_owner_verified, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PUBLISHED', 0, 0, 0, 0, 0, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      args: [
        listingId,
        slug,
        title.trim(),
        description?.trim() || '',
        transactionType || 'RENT',
        propertyType || 'Appartement',
        Number(price) || 0,
        priceUnit || (transactionType === 'RENT' ? '/ mois' : 'total'),
        country || 'Bénin',
        city.trim(),
        neighborhood?.trim() || city.trim(),
        address?.trim() || '',
        Number(latitude) || 6.36,
        Number(longitude) || 2.4,
        Number(bedrooms) || 0,
        Number(bathrooms) || 0,
        Number(surface) || 0,
        JSON.stringify(images || []),
        JSON.stringify(features || []),
        user.id,
        user.name,
        user.phone || '',
        user.whatsapp || user.phone || '',
        user.role || 'Propriétaire',
        user.is_verified ? 1 : 0,
      ],
    });

    // Update listings_count in users table
    await db.execute({
      sql: 'UPDATE users SET listings_count = listings_count + 1 WHERE id = ?',
      args: [user.id],
    });

    const newListingRes = await db.execute({
      sql: 'SELECT * FROM listings WHERE id = ?',
      args: [listingId],
    });

    return res.status(201).json({
      message: 'Annonce publiée avec succès dans Turso.',
      listing: parseListingRow(newListingRes.rows[0]),
    });
  } catch (err: any) {
    console.error('Create listing error:', err);
    return res.status(500).json({ error: 'Erreur lors de la publication de l’annonce.' });
  }
});

// PUT /api/dashboard/listings/:id - Update listing
router.put('/listings/:id', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const db = getDb();

    // Verify ownership
    const check = await db.execute({
      sql: 'SELECT id FROM listings WHERE id = ? AND owner_id = ?',
      args: [id, user.id],
    });

    if (check.rows.length === 0) {
      return res.status(403).json({ error: 'Accès refusé. Vous n’êtes pas le propriétaire de cette annonce.' });
    }

    const {
      title,
      description,
      transactionType,
      propertyType,
      price,
      priceUnit,
      country,
      city,
      neighborhood,
      address,
      latitude,
      longitude,
      bedrooms,
      bathrooms,
      surface,
      images,
      features,
      status,
    } = req.body;

    await db.execute({
      sql: `UPDATE listings SET
        title = ?,
        description = ?,
        transaction_type = ?,
        property_type = ?,
        price = ?,
        price_unit = ?,
        country = ?,
        city = ?,
        neighborhood = ?,
        address = ?,
        latitude = ?,
        longitude = ?,
        bedrooms = ?,
        bathrooms = ?,
        surface = ?,
        images = ?,
        features = ?,
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND owner_id = ?`,
      args: [
        title?.trim(),
        description?.trim() || '',
        transactionType || 'RENT',
        propertyType || 'Appartement',
        Number(price) || 0,
        priceUnit || '/ mois',
        country || 'Bénin',
        city?.trim(),
        neighborhood?.trim() || city?.trim(),
        address?.trim() || '',
        Number(latitude) || 6.36,
        Number(longitude) || 2.4,
        Number(bedrooms) || 0,
        Number(bathrooms) || 0,
        Number(surface) || 0,
        JSON.stringify(images || []),
        JSON.stringify(features || []),
        status || 'PUBLISHED',
        id,
        user.id,
      ],
    });

    const updatedRes = await db.execute({
      sql: 'SELECT * FROM listings WHERE id = ?',
      args: [id],
    });

    return res.json({
      message: 'Annonce mise à jour avec succès.',
      listing: parseListingRow(updatedRes.rows[0]),
    });
  } catch (err: any) {
    console.error('Update listing error:', err);
    return res.status(500).json({ error: 'Erreur lors de la mise à jour de l’annonce.' });
  }
});

// DELETE /api/dashboard/listings/:id - Delete listing
router.delete('/listings/:id', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const db = getDb();

    // Verify ownership
    const check = await db.execute({
      sql: 'SELECT id FROM listings WHERE id = ? AND owner_id = ?',
      args: [id, user.id],
    });

    if (check.rows.length === 0) {
      return res.status(403).json({ error: 'Accès refusé. Vous n’êtes pas le propriétaire de cette annonce.' });
    }

    // Delete listing favorites first
    await db.execute({
      sql: 'DELETE FROM listing_favorites WHERE listing_id = ?',
      args: [id],
    });

    // Delete listing
    await db.execute({
      sql: 'DELETE FROM listings WHERE id = ? AND owner_id = ?',
      args: [id, user.id],
    });

    // Decrement user listing count
    await db.execute({
      sql: 'UPDATE users SET listings_count = MAX(0, listings_count - 1) WHERE id = ?',
      args: [user.id],
    });

    return res.json({ message: 'Annonce supprimée avec succès.' });
  } catch (err: any) {
    console.error('Delete listing error:', err);
    return res.status(500).json({ error: 'Erreur lors de la suppression de l’annonce.' });
  }
});

// PATCH /api/dashboard/listings/:id/status - Toggle status
router.patch('/listings/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { status } = req.body;
    const db = getDb();

    const allowed = ['PUBLISHED', 'PAUSED', 'RENTED', 'SOLD', 'DRAFT'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Statut invalide.' });
    }

    const check = await db.execute({
      sql: 'SELECT id FROM listings WHERE id = ? AND owner_id = ?',
      args: [id, user.id],
    });

    if (check.rows.length === 0) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }

    await db.execute({
      sql: 'UPDATE listings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND owner_id = ?',
      args: [status, id, user.id],
    });

    return res.json({ message: 'Statut mis à jour.', status });
  } catch (err: any) {
    console.error('Status update error:', err);
    return res.status(500).json({ error: 'Erreur lors du changement de statut.' });
  }
});

// PATCH /api/dashboard/listings/:id/boost - Toggle boost
router.patch('/listings/:id/boost', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const db = getDb();

    const check = await db.execute({
      sql: 'SELECT is_sponsored FROM listings WHERE id = ? AND owner_id = ?',
      args: [id, user.id],
    });

    if (check.rows.length === 0) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }

    const currentSponsored = Number(check.rows[0].is_sponsored) === 1;
    const newSponsored = currentSponsored ? 0 : 1;

    await db.execute({
      sql: 'UPDATE listings SET is_sponsored = ?, is_featured = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND owner_id = ?',
      args: [newSponsored, newSponsored, id, user.id],
    });

    return res.json({
      message: newSponsored ? 'Annonce boostée avec succès.' : 'Boost désactivé.',
      isSponsored: newSponsored === 1,
    });
  } catch (err: any) {
    console.error('Boost update error:', err);
    return res.status(500).json({ error: 'Erreur lors de la mise à jour du boost.' });
  }
});

// GET /api/dashboard/stats - Real stats matching PDF page 2
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const db = getDb();

    const listRes = await db.execute({
      sql: 'SELECT * FROM listings WHERE owner_id = ?',
      args: [user.id],
    });

    const myListings = listRes.rows.map(parseListingRow);
    const totalBiens = myListings.length;
    const viewsTotales = myListings.reduce((sum, l) => sum + (l.viewsCount || 0), 0);
    const contactsRecus = myListings.reduce((sum, l) => sum + (l.contactsCount || 0), 0);
    const sponsorisees = myListings.filter((l) => l.isSponsored).length;

    return res.json({
      totalBiens,
      viewsTotales,
      contactsRecus,
      sponsorisees,
      listings: myListings.map((l) => ({
        id: l.id,
        title: l.title,
        city: l.city,
        views: l.viewsCount,
        contacts: l.contactsCount,
        likes: l.likesCount,
        status: l.status,
      })),
    });
  } catch (err: any) {
    console.error('Stats error:', err);
    return res.status(500).json({ error: 'Erreur lors du calcul des statistiques.' });
  }
});

// GET /api/dashboard/promotions - Boost promotions matching PDF page 2
router.get('/promotions', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const db = getDb();

    const listRes = await db.execute({
      sql: 'SELECT * FROM listings WHERE owner_id = ?',
      args: [user.id],
    });

    const myListings = listRes.rows.map(parseListingRow);
    const activePromotions = myListings.filter((l) => l.isSponsored);

    return res.json({
      listings: myListings,
      activePromotions,
      packages: [
        { id: 'boost_7', days: 7, price: 2000, label: '7 jours — 2 000 FCFA' },
        { id: 'boost_14', days: 14, price: 3500, label: '14 jours — 3 500 FCFA' },
        { id: 'boost_30', days: 30, price: 6000, label: '30 jours — 6 000 FCFA' },
      ],
    });
  } catch (err: any) {
    console.error('Promotions error:', err);
    return res.status(500).json({ error: 'Erreur lors de la récupération des promotions.' });
  }
});

// GET /api/dashboard/subscription - Subscription details matching PDF page 3
router.get('/subscription', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const db = getDb();

    const countRes = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM listings WHERE owner_id = ?',
      args: [user.id],
    });
    const usedListings = Number(countRes.rows[0]?.count) || 0;

    const subRes = await db.execute({
      sql: 'SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      args: [user.id],
    });

    const sub = subRes.rows[0];

    return res.json({
      currentPlan: user.plan,
      maxListings: user.max_listings,
      usedListings,
      status: sub ? (sub.status as string) : 'ACTIVE',
      startedAt: sub ? (sub.started_at as string) : user.created_at,
      expiresAt: sub ? (sub.expires_at as string) : null,
      plans: [
        {
          id: 'FREE',
          name: 'Découverte',
          price: 0,
          period: 'FCFA / mois',
          maxListings: 1,
          features: ['1 annonce maximum', '2 photos par annonce', 'Contacts directs WhatsApp', 'Statistiques de base'],
        },
        {
          id: 'PRO',
          name: 'Pro',
          price: 5000,
          period: 'FCFA / mois',
          maxListings: 20,
          popular: true,
          features: ['20 annonces maximum', 'Annonces sponsorisées incluses', '15 photos par annonce', 'Badge vérifié', 'Support prioritaire'],
        },
        {
          id: 'AGENCE',
          name: 'Agence',
          price: 15000,
          period: 'FCFA / mois',
          maxListings: 100,
          features: ['100 annonces maximum', 'Photos illimitées', 'Page d’agence personnalisée', 'Statistiques avancées', 'Boosts inclus', 'Support dédié 7j/7'],
        },
      ],
    });
  } catch (err: any) {
    console.error('Subscription error:', err);
    return res.status(500).json({ error: 'Erreur lors du chargement de l’abonnement.' });
  }
});

// POST /api/dashboard/subscription/upgrade - Real plan change in Turso
router.post('/subscription/upgrade', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { planId } = req.body;
    const db = getDb();

    if (!['FREE', 'PRO', 'AGENCE'].includes(planId)) {
      return res.status(400).json({ error: 'Plan d’abonnement invalide.' });
    }

    const maxListings = planId === 'PRO' ? 20 : planId === 'AGENCE' ? 100 : 1;

    // Update user in Turso
    await db.execute({
      sql: 'UPDATE users SET plan = ?, max_listings = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      args: [planId, maxListings, user.id],
    });

    // Update or insert subscription
    const subId = `sub_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await db.execute({
      sql: `INSERT INTO subscriptions (id, user_id, plan_id, status, billing_cycle, started_at, expires_at)
            VALUES (?, ?, ?, 'ACTIVE', 'MONTHLY', CURRENT_TIMESTAMP, ?)`,
      args: [subId, user.id, planId, expiresAt],
    });

    return res.json({
      message: `Votre abonnement a été mis à niveau vers la formule ${planId}.`,
      plan: planId,
      maxListings,
    });
  } catch (err: any) {
    console.error('Upgrade error:', err);
    return res.status(500).json({ error: 'Erreur lors de la mise à niveau de l’abonnement.' });
  }
});

// GET /api/user/profile
router.get('/profile', async (req: AuthRequest, res: Response) => {
  return res.json({ user: req.user });
});

// PUT /api/user/profile - Update user profile in Turso
router.put('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { name, phone, whatsapp, city, bio } = req.body;
    const db = getDb();

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Le nom ne peut pas être vide.' });
    }

    await db.execute({
      sql: `UPDATE users SET
        name = ?,
        phone = ?,
        whatsapp = ?,
        city = ?,
        bio = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      args: [
        name.trim(),
        phone?.trim() || '',
        whatsapp?.trim() || phone?.trim() || '',
        city?.trim() || 'Cotonou',
        bio?.trim() || '',
        user.id,
      ],
    });

    return res.json({
      message: 'Profil enregistré avec succès dans Turso.',
      user: {
        ...user,
        name: name.trim(),
        phone: phone?.trim() || '',
        whatsapp: whatsapp?.trim() || phone?.trim() || '',
        city: city?.trim() || 'Cotonou',
        bio: bio?.trim() || '',
      },
    });
  } catch (err: any) {
    console.error('Profile update error:', err);
    return res.status(500).json({ error: 'Erreur lors de la mise à jour du profil.' });
  }
});

// PUT /api/user/password - Change password in Turso
router.put('/password', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { currentPassword, newPassword } = req.body;
    const db = getDb();

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Veuillez saisir votre mot de passe actuel et le nouveau mot de passe.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit comporter au moins 6 caractères.' });
    }

    const userRes = await db.execute({
      sql: 'SELECT password_hash, salt FROM users WHERE id = ?',
      args: [user.id],
    });

    const u = userRes.rows[0];
    if (u.password_hash && u.salt) {
      const isValid = verifyPassword(currentPassword, u.password_hash as string, u.salt as string);
      if (!isValid) {
        return res.status(400).json({ error: 'Le mot de passe actuel est incorrect.' });
      }
    }

    const { hash, salt } = hashPassword(newPassword);
    await db.execute({
      sql: 'UPDATE users SET password_hash = ?, salt = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      args: [hash, salt, user.id],
    });

    return res.json({ message: 'Mot de passe modifié avec succès.' });
  } catch (err: any) {
    console.error('Password change error:', err);
    return res.status(500).json({ error: 'Erreur lors de la modification du mot de passe.' });
  }
});

export default router;
