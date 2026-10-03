import { Router, Request, Response } from 'express';
import { getDb } from '../db.js';

const router = Router();

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

// GET /api/public/listings
router.get('/listings', async (req: Request, res: Response) => {
  try {
    const { city, country, transactionType, propertyType, minPrice, maxPrice, bedrooms, keyword } = req.query;
    const db = getDb();

    let sql = "SELECT * FROM listings WHERE status = 'PUBLISHED'";
    const args: any[] = [];

    if (city) {
      sql += ' AND LOWER(city) = ?';
      args.push(String(city).toLowerCase());
    }

    if (country) {
      sql += ' AND LOWER(country) = ?';
      args.push(String(country).toLowerCase());
    }

    if (transactionType && transactionType !== 'ALL') {
      sql += ' AND transaction_type = ?';
      args.push(transactionType);
    }

    if (propertyType && propertyType !== 'ALL') {
      sql += ' AND property_type = ?';
      args.push(propertyType);
    }

    if (minPrice && Number(minPrice) > 0) {
      sql += ' AND price >= ?';
      args.push(Number(minPrice));
    }

    if (maxPrice && Number(maxPrice) > 0) {
      sql += ' AND price <= ?';
      args.push(Number(maxPrice));
    }

    if (bedrooms && bedrooms !== 'ALL') {
      sql += ' AND bedrooms >= ?';
      args.push(Number(bedrooms));
    }

    sql += ' ORDER BY is_sponsored DESC, is_featured DESC, created_at DESC';

    const result = await db.execute({ sql, args });
    let listings = result.rows.map(parseListingRow);

    if (keyword) {
      const q = String(keyword).toLowerCase();
      listings = listings.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.neighborhood.toLowerCase().includes(q) ||
          l.city.toLowerCase().includes(q)
      );
    }

    return res.json({ listings });
  } catch (err: any) {
    console.error('Public listings error:', err);
    return res.status(500).json({ error: 'Erreur lors de la récupération des annonces.' });
  }
});

// GET /api/public/listings/:slug
router.get('/listings/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const db = getDb();

    const result = await db.execute({
      sql: 'SELECT * FROM listings WHERE slug = ? OR id = ?',
      args: [slug, slug],
    });

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Annonce introuvable.' });
    }

    // Increment views_count in Turso
    const item = result.rows[0];
    await db.execute({
      sql: 'UPDATE listings SET views_count = views_count + 1 WHERE id = ?',
      args: [item.id],
    });

    const listing = parseListingRow(item);
    listing.viewsCount += 1;

    return res.json({ listing });
  } catch (err: any) {
    console.error('Public listing by slug error:', err);
    return res.status(500).json({ error: 'Erreur lors de la récupération du bien.' });
  }
});

// POST /api/public/listings/:id/contact
router.post('/listings/:id/contact', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDb();

    await db.execute({
      sql: 'UPDATE listings SET contacts_count = contacts_count + 1 WHERE id = ?',
      args: [id],
    });

    return res.json({ success: true });
  } catch (err: any) {
    console.error('Contact counter error:', err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /api/public/listings/:id/favorite
router.post('/listings/:id/favorite', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { delta } = req.body; // 1 or -1
    const db = getDb();

    const change = Number(delta) === -1 ? -1 : 1;
    await db.execute({
      sql: 'UPDATE listings SET likes_count = MAX(0, likes_count + ?) WHERE id = ?',
      args: [change, id],
    });

    return res.json({ success: true });
  } catch (err: any) {
    console.error('Favorite counter error:', err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /api/public/listings - Create listing from Wizard/Public
router.post('/listings', async (req: Request, res: Response) => {
  try {
    const db = getDb();
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
      ownerId,
      ownerName,
      ownerPhone,
      ownerWhatsapp,
      ownerRole,
    } = req.body;

    if (!title || !price || !city) {
      return res.status(400).json({ error: 'Le titre, le prix et la ville sont obligatoires.' });
    }

    const listingId = req.body.id || `lst_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const slugBase = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const slug = req.body.slug || `${slugBase || 'bien'}-${Date.now().toString().slice(-4)}`;

    await db.execute({
      sql: `INSERT INTO listings (
        id, slug, title, description, transaction_type, property_type,
        price, price_unit, country, city, neighborhood, address,
        latitude, longitude, bedrooms, bathrooms, surface,
        images, features, status, is_featured, is_sponsored,
        likes_count, views_count, contacts_count,
        owner_id, owner_name, owner_phone, owner_whatsapp,
        owner_role, is_owner_verified, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PUBLISHED', 0, 0, 0, 0, 0, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
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
        ownerId || 'usr_guest',
        ownerName || 'Annonceur vérifié',
        ownerPhone || '',
        ownerWhatsapp || ownerPhone || '',
        ownerRole || 'Propriétaire',
      ],
    });

    const newRes = await db.execute({
      sql: 'SELECT * FROM listings WHERE id = ?',
      args: [listingId],
    });

    return res.status(201).json({
      message: 'Annonce enregistrée avec succès dans Turso.',
      listing: parseListingRow(newRes.rows[0]),
    });
  } catch (err: any) {
    console.error('Create public listing error:', err);
    return res.status(500).json({ error: 'Erreur lors de l’enregistrement de l’annonce.' });
  }
});

export default router;
