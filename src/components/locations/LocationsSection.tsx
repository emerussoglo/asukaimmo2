import React from 'react';
import { CITIES_DATA } from '../../data/mockData';

interface LocationsSectionProps {
  onSelectCity: (city: string) => void;
}

export const LocationsSection: React.FC<LocationsSectionProps> = ({ onSelectCity }) => {
  return (
    <section className="section-padding" style={{ backgroundColor: '#ffffff' }}>
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
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
            <i className="fa-solid fa-map-location-dot" />
            <span>Territoires & Départements</span>
          </div>
          <h2
            style={{
              fontSize: 'clamp(1.25rem, 2.2vw, 1.55rem)',
              fontWeight: 800,
              color: 'var(--color-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            Explorez le Bénin par ville
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '2px', fontSize: '0.86rem' }}>
            Trouvez rapidement votre futur logement dans les zones stratégiques du Bénin.
          </p>
        </div>

        {/* Cities Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '14px',
          }}
        >
          {CITIES_DATA.map((city) => (
            <div
              key={city.slug}
              onClick={() => onSelectCity(city.name)}
              style={{
                position: 'relative',
                height: '190px',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
                transition: 'transform var(--transition-normal), box-shadow var(--transition-normal)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                const img = e.currentTarget.querySelector('img');
                if (img) img.style.transform = 'scale(1.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                const img = e.currentTarget.querySelector('img');
                if (img) img.style.transform = 'scale(1)';
              }}
            >
              {/* Image */}
              <img
                src={city.image}
                alt={city.name}
                loading="lazy"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.5s ease',
                }}
              />

              {/* Dark Gradient Overlay */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, rgba(5, 46, 29, 0.1) 0%, rgba(5, 46, 29, 0.85) 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  padding: '16px',
                  color: '#ffffff',
                }}
              >
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: '#a7f3d0',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {city.department}
                </span>
                <h3
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: '#ffffff',
                    lineHeight: 1.2,
                    marginBottom: '4px',
                  }}
                >
                  {city.name}
                </h3>
                <span
                  style={{
                    fontSize: '0.8rem',
                    color: 'rgba(255, 255, 255, 0.85)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <i className="fa-solid fa-house" style={{ fontSize: '0.7rem' }} />
                  <span>{city.count} biens disponibles</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
