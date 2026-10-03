import { Listing } from '../types';

/**
 * Calculates distance in kilometers between two GPS coordinates using Haversine formula
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

/**
 * Attaches distance in km to each listing based on user's current coordinates
 */
export function attachDistances(
  listings: Listing[],
  userCoords: { latitude: number; longitude: number }
): Listing[] {
  return listings.map((listing) => {
    const distanceKm = calculateDistanceKm(
      userCoords.latitude,
      userCoords.longitude,
      listing.latitude,
      listing.longitude
    );
    return {
      ...listing,
      distanceKm,
    };
  });
}

/**
 * Sorts listings by distance from user coordinates
 */
export function sortByDistance(
  listings: Listing[],
  userCoords: { latitude: number; longitude: number }
): Listing[] {
  const withDistance = attachDistances(listings, userCoords);
  return withDistance.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
}
