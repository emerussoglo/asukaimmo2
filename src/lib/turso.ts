import { createClient, Client } from '@libsql/client';
import { INITIAL_LISTINGS } from '../data/mockData';
import { Listing, User } from '../types';

let tursoClient: Client | null = null;

export function getTursoClient(): Client | null {
  if (typeof window !== 'undefined') {
    return null; // Turso auth token should not be exposed in browser
  }

  if (tursoClient) return tursoClient;

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (url && authToken) {
    try {
      tursoClient = createClient({
        url,
        authToken,
      });
      return tursoClient;
    } catch (err) {
      console.warn('Failed to initialize Turso client, using local store', err);
    }
  }
  return null;
}

/**
 * SQL Schema definition for Turso DB migrations
 */
export const TURSO_SQL_SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  whatsapp TEXT,
  role TEXT DEFAULT 'PARTICULIER',
  avatar TEXT,
  is_verified INTEGER DEFAULT 0,
  plan TEXT DEFAULT 'FREE',
  listings_count INTEGER DEFAULT 0,
  max_listings INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS listings (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  transaction_type TEXT NOT NULL,
  property_type TEXT NOT NULL,
  price REAL NOT NULL,
  price_unit TEXT DEFAULT '/ mois',
  city TEXT NOT NULL,
  neighborhood TEXT NOT NULL,
  address TEXT,
  latitude REAL,
  longitude REAL,
  bedrooms INTEGER DEFAULT 0,
  bathrooms INTEGER DEFAULT 0,
  surface REAL DEFAULT 0,
  images TEXT, -- JSON array of image URLs
  features TEXT, -- JSON array of features
  status TEXT DEFAULT 'PUBLISHED',
  is_featured INTEGER DEFAULT 0,
  is_sponsored INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  contacts_count INTEGER DEFAULT 0,
  owner_id TEXT REFERENCES users(id),
  owner_name TEXT,
  owner_phone TEXT,
  owner_whatsapp TEXT,
  owner_role TEXT,
  owner_avatar TEXT,
  is_owner_verified INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS listing_favorites (
  id TEXT PRIMARY KEY,
  listing_id TEXT REFERENCES listings(id),
  user_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`;

/**
 * Universal repository that works seamlessly whether Turso is connected
 * or in client-side / offline mode with localStorage persistence.
 */
class ListingRepository {
  private storageKey = 'asukaimmo_custom_listings_v2';

  public getListings(): Listing[] {
    if (typeof window === 'undefined') {
      return INITIAL_LISTINGS;
    }

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed: Listing[] = JSON.parse(stored);
        // Combine initial and user-created listings, deduping by id
        const userCreated = parsed.filter(
          (p) => !INITIAL_LISTINGS.some((init) => init.id === p.id)
        );
        return [...userCreated, ...INITIAL_LISTINGS];
      }
    } catch (e) {
      console.error('Error reading listings from localStorage', e);
    }
    return INITIAL_LISTINGS;
  }

  public getListingById(id: string): Listing | null {
    const all = this.getListings();
    return all.find((l) => l.id === id || l.slug === id) || null;
  }

  public saveListing(newListing: Listing): Listing {
    if (typeof window === 'undefined') return newListing;

    try {
      const current = this.getListings();
      const updated = [newListing, ...current.filter((l) => l.id !== newListing.id)];
      localStorage.setItem(this.storageKey, JSON.stringify(updated));

      // Async persist to Turso backend database
      fetch('/api/public/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newListing),
      }).catch((err) => console.warn('Could not persist listing to Turso:', err));

      // Dispatch event for UI updates
      window.dispatchEvent(new CustomEvent('asukaimmo_listing_created', { detail: newListing }));
    } catch (e) {
      console.error('Error saving listing to localStorage', e);
    }
    return newListing;
  }

  public updateListing(updatedListing: Listing): Listing {
    if (typeof window === 'undefined') return updatedListing;

    try {
      const current = this.getListings();
      const updated = current.map((l) => (l.id === updatedListing.id ? updatedListing : l));
      localStorage.setItem(this.storageKey, JSON.stringify(updated));

      // Async update in backend
      fetch('/api/public/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedListing),
      }).catch((err) => console.warn('Could not persist update to Turso:', err));

      window.dispatchEvent(new CustomEvent('asukaimmo_listing_updated', { detail: updatedListing }));
    } catch (e) {
      console.error('Error updating listing in localStorage', e);
    }
    return updatedListing;
  }

  public deleteListing(listingId: string): boolean {
    if (typeof window === 'undefined') return true;

    try {
      const current = this.getListings();
      const filtered = current.filter((l) => l.id !== listingId);
      localStorage.setItem(this.storageKey, JSON.stringify(filtered));
      window.dispatchEvent(new CustomEvent('asukaimmo_listing_deleted', { detail: { id: listingId } }));
      return true;
    } catch (e) {
      console.error('Error deleting listing', e);
      return false;
    }
  }

  public updateListingStatus(listingId: string, status: Listing['status']): boolean {
    if (typeof window === 'undefined') return true;

    try {
      const current = this.getListings();
      const target = current.find((l) => l.id === listingId);
      if (target) {
        target.status = status;
        localStorage.setItem(this.storageKey, JSON.stringify(current));
        window.dispatchEvent(new CustomEvent('asukaimmo_listing_updated', { detail: target }));
        return true;
      }
    } catch (e) {
      console.error('Error updating listing status', e);
    }
    return false;
  }
}

/**
 * User & Authentication Repository linked to Turso data models
 */
class UserRepository {
  private userStorageKey = 'asukaimmo_active_user_v2';
  private allUsersKey = 'asukaimmo_registered_users_v2';

  public getRegisteredUsers(): User[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(this.allUsersKey);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Error loading users', e);
    }
    return [];
  }

  public getActiveUser(): User | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(this.userStorageKey);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Error getting active user', e);
    }
    return null;
  }

  public setActiveUser(user: User | null): void {
    if (typeof window === 'undefined') return;
    try {
      if (user) {
        localStorage.setItem(this.userStorageKey, JSON.stringify(user));
        // Also ensure user exists in all registered users
        const all = this.getRegisteredUsers();
        if (!all.some((u) => u.id === user.id)) {
          localStorage.setItem(this.allUsersKey, JSON.stringify([...all, user]));
        }
      } else {
        localStorage.removeItem(this.userStorageKey);
      }
      window.dispatchEvent(new CustomEvent('asukaimmo_user_changed', { detail: user }));
    } catch (e) {
      console.error('Error setting active user', e);
    }
  }

  public updateUserProfile(userId: string, updates: Partial<User>): User | null {
    const current = this.getActiveUser();
    if (!current || current.id !== userId) return null;

    const updated: User = { ...current, ...updates };
    this.setActiveUser(updated);

    // Update in all users
    const all = this.getRegisteredUsers().map((u) => (u.id === userId ? updated : u));
    localStorage.setItem(this.allUsersKey, JSON.stringify(all));

    return updated;
  }

  public register(userData: Omit<User, 'id' | 'listingsCount' | 'maxListings' | 'createdAt'>): User {
    const newUser: User = {
      ...userData,
      id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      listingsCount: 0,
      maxListings: userData.plan === 'PRO' ? 20 : userData.plan === 'AGENCE' ? 100 : 1,
      createdAt: new Date().toISOString(),
    };

    const all = this.getRegisteredUsers();
    localStorage.setItem(this.allUsersKey, JSON.stringify([...all, newUser]));
    this.setActiveUser(newUser);
    return newUser;
  }

  public login(email: string): User | null {
    const all = this.getRegisteredUsers();
    const found = all.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      this.setActiveUser(found);
      return found;
    }
    return null;
  }

  public logout(): void {
    this.setActiveUser(null);
  }
}

export const listingRepo = new ListingRepository();
export const userRepo = new UserRepository();
