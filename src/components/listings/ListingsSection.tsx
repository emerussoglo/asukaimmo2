import React, { useState } from 'react';
import { Listing } from '../../types';
import { ListingCard } from './ListingCard';

interface ListingsSectionProps {
  listings: Listing[];
  onSelectListing: (listing: Listing) => void;
  onViewAll: () => void;
}

export const ListingsSection: React.FC<ListingsSectionProps> = ({
  listings,
  onSelectListing,
  onViewAll,
}) => {
  const [filterTab, setFilterTab] = useState<'ALL' | 'RENT' | 'SALE' | 'FEATURED'>('ALL');

  const filteredListings = listings.filter((item) => {
    if (filterTab === 'RENT') return item.transactionType === 'RENT';
    if (filterTab === 'SALE') return item.transactionType === 'SALE';
    if (filterTab === 'FEATURED') return item.isFeatured || item.isSponsored;
    return true;
  });

  return (
    <section className="section-padding" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="container">
        {/* Section Header */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.74rem',
                fontWeight: 700,
                color: 'var(--color-secondary-blue)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '4px',
              }}
            >
              <i className="fa-solid fa-sparkles" />
              <span>Sélection exclusive</span>
            </div>
            <h2
              style={{
                fontSize: 'clamp(1.25rem, 2.2vw, 1.55rem)',
                fontWeight: 800,
                color: 'var(--color-primary)',
                letterSpacing: '-0.02em',
              }}
            >
              Découvrez nos biens récents
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '2px', fontSize: '0.86rem' }}>
              Opportunités résidentielles et commerciales certifiées à Cotonou, Calavi et partout au Bénin.
            </p>
          </div>

          {/* Quick Filter Pill Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#ffffff',
              padding: '3px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--color-border)',
            }}
          >
            {[
              { id: 'ALL', label: 'Tous' },
              { id: 'RENT', label: 'À louer' },
              { id: 'SALE', label: 'À vendre' },
              { id: 'FEATURED', label: 'Coups de cœur' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id as any)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  backgroundColor: filterTab === tab.id ? 'var(--color-primary)' : 'transparent',
                  color: filterTab === tab.id ? '#ffffff' : 'var(--color-text-secondary)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Listings Grid */}
        {filteredListings.length === 0 ? (
          <div
            style={{
              padding: '60px 20px',
              textAlign: 'center',
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px dashed var(--color-border)',
            }}
          >
            <i className="fa-solid fa-house-chimney" style={{ fontSize: '2.5rem', color: 'var(--color-text-muted)', marginBottom: '12px' }} />
            <h3 style={{ fontSize: '1.2rem', marginBottom: '6px' }}>Aucun bien dans cette sélection</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
              Essayez de changer d’onglet ou explorez l'ensemble des annonces.
            </p>
            <button onClick={() => setFilterTab('ALL')} className="btn btn-secondary">
              Voir tous les biens
            </button>
          </div>
        ) : (
          <>
            <div className="listings-responsive-grid">
              {filteredListings.slice(0, 10).map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onSelect={onSelectListing}
                />
              ))}
            </div>

            <style>{`
              .listings-responsive-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 10px;
              }
              @media (min-width: 640px) {
                .listings-responsive-grid {
                  grid-template-columns: repeat(2, minmax(0, 1fr));
                  gap: 14px;
                }
              }
              @media (min-width: 768px) {
                .listings-responsive-grid {
                  grid-template-columns: repeat(3, minmax(0, 1fr));
                  gap: 14px;
                }
              }
              @media (min-width: 1024px) {
                .listings-responsive-grid {
                  grid-template-columns: repeat(4, minmax(0, 1fr));
                  gap: 16px;
                }
              }
              @media (min-width: 1280px) {
                .listings-responsive-grid {
                  grid-template-columns: repeat(5, minmax(0, 1fr));
                  gap: 16px;
                }
              }
            `}</style>
          </>
        )}

        {/* View All CTA */}
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <button
            onClick={onViewAll}
            className="btn btn-primary"
            style={{
              padding: '14px 32px',
              borderRadius: 'var(--radius-full)',
              fontSize: '1rem',
              gap: '10px',
            }}
          >
            <span>Explorer toutes les annonces ({listings.length})</span>
            <i className="fa-solid fa-arrow-right" />
          </button>
        </div>
      </div>
    </section>
  );
};
