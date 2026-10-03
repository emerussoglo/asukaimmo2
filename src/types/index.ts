export type TransactionType = 'RENT' | 'SALE';

export type PropertyType =
  | 'Appartement'
  | 'Studio'
  | 'Maison'
  | 'Villa'
  | 'Chambre'
  | 'Chambre-salon'
  | 'Meublé'
  | 'Résidence'
  | 'Terrain'
  | 'Bureau'
  | 'Boutique'
  | 'Immeuble'
  | 'Place de fête'
  | 'Hôtel'
  | 'Salle de conférence';

export type PriceUnit = '/ heure' | '/ jour' | '/ semaine' | '/ mois' | '/ an' | 'total' | string;

export type ListingStatus = 'DRAFT' | 'PUBLISHED' | 'PAUSED' | 'SOLD' | 'RENTED' | 'ARCHIVED';

export type UserRole = 'PARTICULIER' | 'PROPRIETAIRE' | 'AGENT' | 'ADMIN';

export type PlanType = 'FREE' | 'PRO' | 'AGENCE';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp?: string;
  city?: string;
  bio?: string;
  companyName?: string;
  role: UserRole;
  avatar?: string;
  isVerified?: boolean;
  plan: PlanType;
  listingsCount: number;
  maxListings: number;
  planExpiresAt?: string;
  createdAt: string;
}

export interface Listing {
  id: string;
  slug: string;
  title: string;
  description: string;
  transactionType: TransactionType;
  propertyType: PropertyType;
  price: number;
  priceUnit: PriceUnit;
  city: string;
  neighborhood: string;
  address?: string;
  latitude: number;
  longitude: number;
  bedrooms: number;
  bathrooms: number;
  surface: number; // in m²
  images: string[];
  features: string[];
  status: ListingStatus;
  isFeatured?: boolean;
  isSponsored?: boolean;
  isFavorite?: boolean;
  country?: string;
  likesCount: number;
  viewsCount: number;
  contactsCount: number;
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
  ownerWhatsapp?: string;
  ownerRole?: string;
  ownerAvatar?: string;
  isOwnerVerified?: boolean;
  publishedAt: string;
  updatedAt: string;
  distanceKm?: number;
}

export interface FilterState {
  keyword: string;
  city: string;
  country?: string;
  transactionType: TransactionType | 'ALL';
  propertyType: PropertyType | 'ALL';
  minPrice: number;
  maxPrice: number;
  bedrooms: number | 'ALL';
  bathrooms: number | 'ALL';
  isFurnished?: boolean;
  features: string[];
  sortBy: 'recent' | 'price_asc' | 'price_desc' | 'popular' | 'distance';
  userCoords?: { latitude: number; longitude: number };
}

export interface CityData {
  name: string;
  slug: string;
  image: string;
  count: number;
  department: string;
}

export interface CategoryData {
  name: PropertyType;
  icon: string;
  image?: string;
  count: number;
}

export interface Partner {
  id: string;
  name: string;
  category: string;
  logoText: string;
  logoSub: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'recherche' | 'publication' | 'tarifs' | 'securite';
}

export interface PlanConfig {
  id: PlanType;
  name: string;
  price: number;
  period: string;
  maxListings: number;
  maxImagesPerListing: number;
  isPopular?: boolean;
  badge?: string;
  features: string[];
  limitations?: string[];
  ctaText: string;
}
