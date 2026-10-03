import { createClient, Client } from '@libsql/client';
import { INITIAL_LISTINGS } from '../src/data/mockData.js';

let client: Client | null = null;

export function getDb(): Client {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL || 'file:asukaimmo_turso.db';
    const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

    client = createClient({
      url,
      authToken,
    });
  }
  return client;
}

export async function initDb() {
  const db = getDb();

  // Create tables if not exist
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      salt TEXT,
      phone TEXT,
      whatsapp TEXT,
      role TEXT DEFAULT 'PROPRIETAIRE',
      avatar TEXT,
      is_verified INTEGER DEFAULT 0,
      plan TEXT DEFAULT 'FREE',
      listings_count INTEGER DEFAULT 0,
      max_listings INTEGER DEFAULT 5,
      bio TEXT,
      city TEXT DEFAULT 'Cotonou',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      token TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS listings (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      transaction_type TEXT NOT NULL,
      property_type TEXT NOT NULL,
      price REAL NOT NULL,
      price_unit TEXT DEFAULT '/ mois',
      country TEXT DEFAULT 'Bénin',
      city TEXT NOT NULL,
      neighborhood TEXT NOT NULL,
      address TEXT,
      latitude REAL,
      longitude REAL,
      bedrooms INTEGER DEFAULT 0,
      bathrooms INTEGER DEFAULT 0,
      surface REAL DEFAULT 0,
      images TEXT, -- JSON array
      features TEXT, -- JSON array
      status TEXT DEFAULT 'PUBLISHED',
      is_featured INTEGER DEFAULT 0,
      is_sponsored INTEGER DEFAULT 0,
      likes_count INTEGER DEFAULT 0,
      views_count INTEGER DEFAULT 0,
      contacts_count INTEGER DEFAULT 0,
      owner_id TEXT,
      owner_name TEXT,
      owner_phone TEXT,
      owner_whatsapp TEXT,
      owner_role TEXT,
      owner_avatar TEXT,
      is_owner_verified INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS listing_favorites (
      id TEXT PRIMARY KEY,
      listing_id TEXT,
      user_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      plan_id TEXT NOT NULL,
      status TEXT DEFAULT 'ACTIVE',
      billing_cycle TEXT DEFAULT 'MONTHLY',
      started_at TEXT DEFAULT CURRENT_TIMESTAMP,
      expires_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed default users for relationships
  await db.execute(`
    INSERT OR IGNORE INTO users (id, name, email, role, plan, is_verified, max_listings)
    VALUES ('usr_seed', 'ASUKAIMMO Partenaire', 'contact@asukaimmo.bj', 'PROPRIETAIRE', 'PRO', 1, 50)
  `);
  await db.execute(`
    INSERT OR IGNORE INTO users (id, name, email, role, plan, is_verified, max_listings)
    VALUES ('usr_guest', 'Annonceur vérifié', 'guest@asukaimmo.bj', 'PARTICULIER', 'FREE', 1, 10)
  `);

  // Check if listings table is empty. If so, seed initial listings into Turso/SQLite
  try {
    const countRes = await db.execute('SELECT COUNT(*) as count FROM listings');
    const count = Number(countRes.rows[0]?.count || 0);

    if (count === 0 && Array.isArray(INITIAL_LISTINGS) && INITIAL_LISTINGS.length > 0) {
      console.log(`🌱 Seeding ${INITIAL_LISTINGS.length} initial listings into Turso database...`);
      for (const item of INITIAL_LISTINGS) {
        await db.execute({
          sql: `INSERT OR IGNORE INTO listings (
            id, slug, title, description, transaction_type, property_type,
            price, price_unit, country, city, neighborhood, address,
            latitude, longitude, bedrooms, bathrooms, surface,
            images, features, status, is_featured, is_sponsored,
            likes_count, views_count, contacts_count,
            owner_id, owner_name, owner_phone, owner_whatsapp,
            owner_role, is_owner_verified, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PUBLISHED', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          args: [
            item.id,
            item.slug,
            item.title,
            item.description || '',
            item.transactionType,
            item.propertyType,
            item.price,
            item.priceUnit || '/ mois',
            item.country || 'Bénin',
            item.city,
            item.neighborhood,
            item.address || '',
            item.latitude || 6.36,
            item.longitude || 2.4,
            item.bedrooms || 0,
            item.bathrooms || 0,
            item.surface || 0,
            JSON.stringify(item.images || []),
            JSON.stringify(item.features || []),
            item.isFeatured ? 1 : 0,
            item.isSponsored ? 1 : 0,
            item.likesCount || 0,
            item.viewsCount || 0,
            item.contactsCount || 0,
            item.ownerId || 'usr_seed',
            item.ownerName || 'ASUKAIMMO Partenaire',
            item.ownerPhone || '+229 97 00 12 34',
            item.ownerWhatsapp || '+229 97 00 12 34',
            item.ownerRole || 'Propriétaire certifié',
            item.isOwnerVerified ? 1 : 0,
          ],
        });
      }
      console.log('✅ Seed completed successfully.');
    }
  } catch (seedErr) {
    console.warn('⚠️ Seeding note:', seedErr);
  }
}

