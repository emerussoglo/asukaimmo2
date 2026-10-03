import React, { useState, useEffect } from 'react';
import { Listing } from '../../types';
import { getSavedFavoriteIds } from '../../lib/favorites';
import { ListingCard } from '../listings/ListingCard';

interface FavoritesViewProps {
  allListings: Listing[];
  onSelectListing: (listing: Listing) => void;
  onExplore: () => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  allListings,
  onSelectListing,
  onExplore,
}) => {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    const update = () => {
      setFavoriteIds(getSavedFavoriteIds());
    };
    update();
    window.addEventListener('asukaimmo_favorite_changed', update);
    return () => window.removeEventListener('asukaimmo_favorite_changed', update);
  }, []);

  const favoriteListings = allListings.filter((l) => favoriteIds.includes(l.id));

  return (
    <div style={{ backgroundColor: 'var(--color-bg)', minHeight: '80vh', padding: '40px 0 80px' }}>
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '6px' }}>
            ASUKAIMMO / Mes coups de cœur
          </span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <h1
              style={{
                fontSize: 'clamp(1.7rem, 3vw, 2.2rem)',
                fontWeight: 800,
                color: 'var(--color-primary)',
                letterSpacing: '-0.02em',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <i className="fa-solid fa-heart" style={{ color: '#ef4444', fontSize: '1.6rem' }} />
              <span>Mes biens favoris</span>
            </h1>
            <span style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
              {favoriteListings.length} bien{favoriteListings.length > 1 ? 's' : ''} enregistré{favoriteListings.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Content */}
        {favoriteListings.length === 0 ? (
          <div
            style={{
              padding: '80px 24px',
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-xl)',
              border: '1px dashed var(--color-border)',
              textAlign: 'center',
              maxWidth: '600px',
              marginInline: 'auto',
            }}
          >
            <div
              style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary-subtle)',
                color: 'var(--color-text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                margin: '0 auto 20px',
              }}
            >
              <i className="fa-regular fa-heart" />
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '8px' }}>
              Vous n'avez encore ajouté aucun bien à vos favoris
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px', lineHeight: 1.5 }}>
              Cliquez sur le petit cœur présent sur les annonces pour les retrouver facilement ici lors de votre prochaine visite.
            </p>
            <button
              onClick={onExplore}
              className="btn btn-primary"
              style={{ padding: '14px 28px', borderRadius: 'var(--radius-full)' }}
            >
              <i className="fa-solid fa-compass" />
              <span>Explorer les biens disponibles</span>
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '24px',
            }}
          >
            {favoriteListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onSelect={onSelectListing}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
