import React from 'react';
import { CATEGORIES_DATA } from '../../data/mockData';
import { PropertyType } from '../../types';

interface CategoriesSectionProps {
  onSelectCategory: (type: PropertyType) => void;
  onViewAllCriteria: () => void;
}

export const CategoriesSection: React.FC<CategoriesSectionProps> = ({
  onSelectCategory,
  onViewAllCriteria,
}) => {
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
            gap: '12px',
            marginBottom: '24px',
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
              <i className="fa-solid fa-shapes" />
              <span>Typologies de biens</span>
            </div>
            <h2
              style={{
                fontSize: 'clamp(1.25rem, 2.2vw, 1.55rem)',
                fontWeight: 800,
                color: 'var(--color-primary)',
                letterSpacing: '-0.02em',
              }}
            >
              Que recherchez-vous ?
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '2px', fontSize: '0.86rem' }}>
              Explorez par typologie de logement ou d’espace professionnel.
            </p>
          </div>

          <button
            onClick={onViewAllCriteria}
            className="btn btn-ghost btn-sm"
            style={{
              fontWeight: 700,
              gap: '5px',
              color: 'var(--color-secondary-blue)',
            }}
          >
            <span>Tous les critères</span>
            <i className="fa-solid fa-arrow-right" />
          </button>
        </div>

        {/* Category Grid - Exactly 2 columns on mobile, multi-column on desktop */}
        <div className="categories-responsive-grid">
          {CATEGORIES_DATA.map((cat) => (
            <div
              key={cat.name}
              onClick={() => onSelectCategory(cat.name)}
              className="card category-item-card"
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#ffffff',
                border: '1px solid var(--color-border)',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-secondary-blue)';
                e.currentTarget.style.backgroundColor = 'var(--color-secondary-blue-subtle)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.backgroundColor = '#ffffff';
              }}
            >
              <div
                className="category-icon-box"
                style={{
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-secondary-blue-subtle)',
                  color: 'var(--color-secondary-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <i className={`fa-solid ${cat.icon}`} />
              </div>

              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <h3
                  className="category-title"
                  style={{
                    fontWeight: 700,
                    color: 'var(--color-primary)',
                    marginBottom: '1px',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                  }}
                >
                  {cat.name}
                </h3>
                <span className="category-count" style={{ color: 'var(--color-text-muted)', display: 'block' }}>
                  {cat.count} bien{cat.count > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .categories-responsive-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }
        .category-item-card {
          padding: 10px 12px;
          gap: 10px;
        }
        .category-icon-box {
          width: 34px;
          height: 34px;
          font-size: 0.95rem;
        }
        .category-title {
          font-size: 0.84rem;
        }
        .category-count {
          font-size: 0.72rem;
        }

        @media (min-width: 640px) {
          .categories-responsive-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 12px;
          }
          .category-item-card {
            padding: 12px 14px;
          }
        }

        @media (min-width: 860px) {
          .categories-responsive-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 14px;
          }
          .category-item-card {
            padding: 14px 16px;
            gap: 12px;
          }
          .category-icon-box {
            width: 38px;
            height: 38px;
            font-size: 1.05rem;
          }
          .category-title {
            font-size: 0.9rem;
          }
          .category-count {
            font-size: 0.74rem;
          }
        }

        @media (min-width: 1100px) {
          .categories-responsive-grid {
            grid-template-columns: repeat(6, minmax(0, 1fr));
          }
        }
      `}</style>
    </section>
  );
};
