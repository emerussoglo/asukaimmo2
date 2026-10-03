import { FilterState, Listing, PlanType, User } from '../types';

const TOKEN_KEY = 'asukaimmo_auth_token';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Erreur serveur (${res.status})`);
  }

  return data as T;
}

export const api = {
  auth: {
    async register(payload: { name: string; email: string; password: string; phone?: string; role?: string }) {
      const res = await request<{ message: string; user: User; token: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setStoredToken(res.token);
      return res;
    },

    async login(payload: { email: string; password: string }) {
      const res = await request<{ message: string; user: User; token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setStoredToken(res.token);
      return res;
    },

    async me() {
      const token = getStoredToken();
      if (!token) return null;
      try {
        const res = await request<{ user: User }>('/api/auth/me');
        return res.user;
      } catch {
        setStoredToken(null);
        return null;
      }
    },

    async logout() {
      try {
        await request('/api/auth/logout', { method: 'POST' });
      } catch (e) {
        console.warn('Logout error', e);
      } finally {
        setStoredToken(null);
      }
    },
  },

  public: {
    async getListings(params: Partial<FilterState> = {}) {
      const query = new URLSearchParams();
      if (params.city) query.set('city', params.city);
      if (params.country) query.set('country', params.country);
      if (params.transactionType && params.transactionType !== 'ALL') query.set('transactionType', params.transactionType);
      if (params.propertyType && params.propertyType !== 'ALL') query.set('propertyType', params.propertyType);
      if (params.minPrice) query.set('minPrice', String(params.minPrice));
      if (params.maxPrice) query.set('maxPrice', String(params.maxPrice));
      if (params.bedrooms && params.bedrooms !== 'ALL') query.set('bedrooms', String(params.bedrooms));
      if (params.keyword) query.set('keyword', params.keyword);

      const res = await request<{ listings: Listing[] }>(`/api/public/listings?${query.toString()}`);
      return res.listings;
    },

    async getListingBySlug(slug: string) {
      const res = await request<{ listing: Listing }>(`/api/public/listings/${slug}`);
      return res.listing;
    },

    async contact(listingId: string) {
      return request<{ success: boolean }>(`/api/public/listings/${listingId}/contact`, {
        method: 'POST',
      });
    },

    async favorite(listingId: string, delta: 1 | -1) {
      return request<{ success: boolean }>(`/api/public/listings/${listingId}/favorite`, {
        method: 'POST',
        body: JSON.stringify({ delta }),
      });
    },

    async createListing(payload: any) {
      return request<{ message: string; listing: Listing }>('/api/public/listings', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
  },

  dashboard: {
    async getOverview() {
      return request<{
        user: { id: string; name: string; email: string; phone: string; plan: PlanType; maxListings: number };
        stats: {
          totalBiens: number;
          publishedCount: number;
          sponsoredCount: number;
          viewsCount: number;
          contactsCount: number;
          favoritesCount: number;
        };
        recentListings: Listing[];
      }>('/api/dashboard/overview');
    },

    async getListings() {
      const res = await request<{ listings: Listing[] }>('/api/dashboard/listings');
      return res.listings;
    },

    async getListing(id: string) {
      const res = await request<{ listing: Listing }>(`/api/dashboard/listings/${id}`);
      return res.listing;
    },

    async createListing(payload: any) {
      return request<{ message: string; listing: Listing }>('/api/dashboard/listings', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    async updateListing(id: string, payload: any) {
      return request<{ message: string; listing: Listing }>(`/api/dashboard/listings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    },

    async deleteListing(id: string) {
      return request<{ message: string }>(`/api/dashboard/listings/${id}`, {
        method: 'DELETE',
      });
    },

    async updateStatus(id: string, status: string) {
      return request<{ message: string; status: string }>(`/api/dashboard/listings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },

    async toggleBoost(id: string) {
      return request<{ message: string; isSponsored: boolean }>(`/api/dashboard/listings/${id}/boost`, {
        method: 'PATCH',
      });
    },

    async getStats() {
      return request<{
        totalBiens: number;
        viewsTotales: number;
        contactsRecus: number;
        sponsorisees: number;
        listings: any[];
      }>('/api/dashboard/stats');
    },

    async getPromotions() {
      return request<{
        listings: Listing[];
        activePromotions: Listing[];
        packages: { id: string; days: number; price: number; label: string }[];
      }>('/api/dashboard/promotions');
    },

    async getSubscription() {
      return request<{
        currentPlan: PlanType;
        maxListings: number;
        usedListings: number;
        status: string;
        startedAt: string;
        expiresAt: string | null;
        plans: any[];
      }>('/api/dashboard/subscription');
    },

    async upgradeSubscription(planId: PlanType) {
      return request<{ message: string; plan: PlanType; maxListings: number }>(
        '/api/dashboard/subscription/upgrade',
        {
          method: 'POST',
          body: JSON.stringify({ planId }),
        }
      );
    },

    async getProfile() {
      const res = await request<{ user: User }>('/api/user/profile');
      return res.user;
    },

    async updateProfile(payload: { name: string; phone?: string; whatsapp?: string; city?: string; bio?: string }) {
      return request<{ message: string; user: User }>('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    },

    async updatePassword(payload: { currentPassword: string; newPassword: string }) {
      return request<{ message: string }>('/api/user/password', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    },
  },

  upload: {
    async uploadImage(base64Data: string, filename?: string): Promise<string> {
      const res = await request<{ message: string; url: string }>('/api/upload', {
        method: 'POST',
        body: JSON.stringify({ file: { data: base64Data, filename } }),
      });
      return res.url;
    },
    async uploadImages(files: Array<{ data: string; filename?: string }>): Promise<string[]> {
      const res = await request<{ message: string; urls: string[] }>('/api/upload', {
        method: 'POST',
        body: JSON.stringify({ files }),
      });
      return res.urls;
    },
    async deleteImage(url: string): Promise<void> {
      try {
        await request<{ message: string }>('/api/upload/delete', {
          method: 'POST',
          body: JSON.stringify({ url }),
        });
      } catch (e) {
        console.warn('Delete image warning:', e);
      }
    },
  },
};
