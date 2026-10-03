import React from 'react';
import { PARTNERS_DATA } from '../../data/mockData';

export const PartnersSection: React.FC = () => {
  // Duplicate array to enable seamless infinite marquee loop
  const duplicatedPartners = [...PARTNERS_DATA, ...PARTNERS_DATA];

  return (
    <section
      style={{
        padding: '50px 0',
        backgroundColor: '#ffffff',
        borderTop: '1px solid var(--color-border)',
        borderBottom: '1px solid var(--color-border)',
        overflow: 'hidden',
      }}
    >
      <div className="container" style={{ textAlign: 'center', marginBottom: '24px' }}>
        <span
          style={{
            fontSize: '0.78rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--color-text-muted)',
            display: 'block',
            marginBottom: '4px',
          }}
        >
          Écosystème & Partenaires
        </span>
        <h2
          style={{
            fontSize: '1.4rem',
            fontWeight: 700,
            color: 'var(--color-primary)',
          }}
        >
          Ils accompagnent vos projets immobiliers
        </h2>
      </div>

      {/* Infinite Scrolling Marquee Track */}
      <div style={{ width: '100%', overflow: 'hidden' }}>
        <div className="partner-marquee-track">
          {duplicatedPartners.map((partner, index) => (
            <div
              key={`${partner.id}-${index}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 28px',
                margin: '0 12px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                filter: 'grayscale(100%)',
                opacity: 0.75,
                transition: 'all var(--transition-fast)',
                cursor: 'default',
                userSelect: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = 'grayscale(0%)';
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.borderColor = 'var(--color-primary)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'grayscale(100%)';
                e.currentTarget.style.opacity = '0.75';
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-primary)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                }}
              >
                {partner.logoText.slice(0, 3)}
              </div>
              <div style={{ textAlign: 'left' }}>
                <span
                  style={{
                    display: 'block',
                    fontSize: '0.92rem',
                    fontWeight: 800,
                    color: 'var(--color-primary)',
                    lineHeight: 1.1,
                  }}
                >
                  {partner.name}
                </span>
                <span
                  style={{
                    display: 'block',
                    fontSize: '0.72rem',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {partner.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
