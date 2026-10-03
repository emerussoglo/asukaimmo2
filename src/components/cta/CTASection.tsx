import React from 'react';

interface CTASectionProps {
  onPublish: () => void;
  onExplore: () => void;
}

export const CTASection: React.FC<CTASectionProps> = ({ onPublish, onExplore }) => {
  return (
    <section className="section-padding" style={{ backgroundColor: '#f8faf9', overflow: 'hidden', padding: '60px 0' }}>
      <div className="container">
        {/* Modern High-Impact Card Inspired by SaaS Excellence & Real Estate Portals */}
        <div
          style={{ 
            position: 'relative',
            borderRadius: '32px',
            background: 'linear-gradient(135deg, #021a10 0%, #052e1d 40%, #0a3d28 85%, #052618 100%)',
            color: '#ffffff',
            padding: 'clamp(36px, 5.5vw, 64px) clamp(20px, 5vw, 56px)',
            overflow: 'hidden',
            boxShadow: '0 25px 60px -15px rgba(2, 26, 16, 0.45), 0 0 0 1px rgba(52, 211, 153, 0.2)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Glowing Ambient Neon Blurred Spheres */}
          <div
            style={{
              position: 'absolute',
              top: '-70px',
              left: '-70px',
              width: '300px',
              height: '300px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(16, 185, 129, 0.35) 0%, rgba(16, 185, 129, 0) 70%)',
              filter: 'blur(40px)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-90px',
              right: '-70px',
              width: '360px',
              height: '360px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, rgba(59, 130, 246, 0) 70%)',
              filter: 'blur(50px)',
              pointerEvents: 'none',
            }}
          />

          {/* Decorative Modern Mesh Subtle Pattern */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.08) 1.2px, transparent 1.2px)',
              backgroundSize: '28px 28px',
              opacity: 0.7,
              pointerEvents: 'none',
            }}
          />

          

          {/* High-Impact Headline with Gradient Text */}
          <h2
            style={{
              position: 'relative',
              zIndex: 1,
              fontSize: 'clamp(1.6rem, 3.6vw, 2.6rem)',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.22,
              letterSpacing: '-0.025em',
              maxWidth: '780px',
              margin: '0 auto 16px auto',
            }}
          >
            Faites louer ou vendez votre bien{' '}
            <span
              style={{
                background: 'linear-gradient(90deg, #34d399 0%, #a7f3d0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block',
              }}
            >
              plus rapidement
            </span>
          </h2>

          {/* Subtitle */}
          <p
            style={{
              position: 'relative',
              zIndex: 1,
              fontSize: 'clamp(0.92rem, 1.4vw, 1.08rem)',
              color: 'rgba(255, 255, 255, 0.85)',
              lineHeight: 1.6,
              maxWidth: '640px',
              margin: '0 auto 30px auto',
            }}
          >
            Bénéficiez de la visibilité ASUKAIMMO, d'une géolocalisation GPS certifiée au Bénin et d'une mise en relation directe par WhatsApp avec vos futurs locataires.
          </p>

          {/* Action Buttons Row */}
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '14px',
              marginBottom: '32px',
            }}
          >
            <button
              onClick={onPublish}
              className="hover-lift"
              style={{
                backgroundColor: '#ffffff',
                color: 'var(--color-primary)',
                padding: '13px 28px',
                borderRadius: '9999px',
                fontWeight: 800,
                fontSize: '0.94rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2), 0 0 0 2px rgba(255, 255, 255, 0.3)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-primary)',
                  fontSize: '0.8rem',
                }}
              >
                <i className="fa-solid fa-plus" />
              </div>
              <span>Publier une annonce</span>
            </button>

            <button
              onClick={onExplore}
              className="hover-lift"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.09)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.28)',
                backdropFilter: 'blur(10px)',
                padding: '13px 26px',
                borderRadius: '9999px',
                fontWeight: 700,
                fontSize: '0.92rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease, border-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.16)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.45)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.09)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.28)';
              }}
            >
              <span>Consulter les offres</span>
              <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.82rem', color: '#a7f3d0' }} />
            </button>
          </div>

          {/* Modern Trust & Value Badges Grid */}
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'clamp(14px, 3.5vw, 28px)',
              paddingTop: '20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.12)',
              fontSize: '0.82rem',
              color: 'rgba(255, 255, 255, 0.85)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(52, 211, 153, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#34d399',
                  fontSize: '0.72rem',
                }}
              >
                <i className="fa-solid fa-check" />
              </div>
              <span style={{ fontWeight: 600 }}>0% commission cachée</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(34, 197, 94, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#22c55e',
                  fontSize: '0.78rem',
                }}
              >
                <i className="fa-brands fa-whatsapp" />
              </div>
              <span style={{ fontWeight: 600 }}>Contacts WhatsApp directs</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(96, 165, 250, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#60a5fa',
                  fontSize: '0.72rem',
                }}
              >
                <i className="fa-solid fa-location-dot" />
              </div>
              <span style={{ fontWeight: 600 }}>Géolocalisation GPS Bénin</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(245, 158, 11, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fbbf24',
                  fontSize: '0.72rem',
                }}
              >
                <i className="fa-solid fa-bolt" />
              </div>
              <span style={{ fontWeight: 600 }}>Diffusion instantanée</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

