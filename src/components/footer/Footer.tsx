import React from 'react';
import { Logo } from '../common/Logo';

interface FooterProps {
  onNavigate: (view: string, filterParams?: any) => void;
  onOpenPublish: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenPublish }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer
      style={{
        backgroundColor: '#052e1d',
        color: '#ffffff',
        paddingTop: '40px',
        paddingBottom: '24px',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <div className="container">
        {/* Main Columns Grid - Compact */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '28px',
            marginBottom: '32px',
          }}
        >
          {/* Col 1: Brand & About */}
          <div style={{ maxWidth: '300px' }}>
            <Logo variant="light" size="sm" onClick={() => onNavigate('home')} />
            <p
              style={{
                marginTop: '12px',
                fontSize: '0.82rem',
                color: 'rgba(255, 255, 255, 0.75)',
                lineHeight: 1.45,
              }}
            >
              Plateforme immobilière au Bénin reliant acquéreurs, locataires et propriétaires certifiés dans un cadre sécurisé.
            </p>

            {/* Social Icons */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
              {[
                { icon: 'fa-facebook-f', label: 'Facebook' },
                { icon: 'fa-instagram', label: 'Instagram' },
                { icon: 'fa-linkedin-in', label: 'LinkedIn' },
                { icon: 'fa-whatsapp', label: 'WhatsApp' },
              ].map((s, i) => (
                <div
                  key={i}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: '0.78rem',
                    transition: 'background var(--transition-fast)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#10b981')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)')}
                >
                  <i className={`fa-brands ${s.icon}`} />
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: '14px',
                fontSize: '0.76rem',
                color: 'rgba(255, 255, 255, 0.6)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <i className="fa-solid fa-location-dot" style={{ color: '#10b981' }} />
              <span>Cotonou, République du Bénin</span>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4
              style={{
                fontSize: '0.84rem',
                fontWeight: 800,
                color: '#ffffff',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '12px',
              }}
            >
              Plateforme
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: 'Accueil', action: () => onNavigate('home') },
                { label: 'Rechercher un bien', action: () => onNavigate('explorer') },
                { label: 'Locations', action: () => onNavigate('explorer', { transactionType: 'RENT' }) },
                { label: 'Ventes', action: () => onNavigate('explorer', { transactionType: 'SALE' }) },
                { label: 'Mes favoris', action: () => onNavigate('favoris') },
              ].map((item, i) => (
                <li key={i}>
                  <button
                    onClick={item.action}
                    style={{
                      color: 'rgba(255, 255, 255, 0.75)',
                      fontSize: '0.82rem',
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#93c5fd')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.75)')}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Villes */}
          <div>
            <h4
              style={{
                fontSize: '0.84rem',
                fontWeight: 800,
                color: '#ffffff',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '12px',
              }}
            >
              Localités
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {['Cotonou', 'Abomey-Calavi', 'Porto-Novo', 'Ouidah', 'Parakou'].map((city, i) => (
                <li key={i}>
                  <button
                    onClick={() => onNavigate('explorer', { city })}
                    style={{
                      color: 'rgba(255, 255, 255, 0.75)',
                      fontSize: '0.82rem',
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#93c5fd')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.75)')}
                  >
                    Biens à {city}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Espace Pro */}
          <div>
            <h4
              style={{
                fontSize: '0.84rem',
                fontWeight: 800,
                color: '#ffffff',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '12px',
              }}
            >
              Espace Pro
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>
                <button
                  onClick={onOpenPublish}
                  style={{
                    color: '#93c5fd',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <i className="fa-solid fa-plus" />
                  <span>Publier une annonce</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('dashboard')}
                  style={{
                    color: 'rgba(255, 255, 255, 0.75)',
                    fontSize: '0.82rem',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                  }}
                >
                  Dashboard bailleur
                </button>
              </li>
              <li>
                <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.78rem' }}>
                  Conditions d’Utilisation
                </span>
              </li>
              <li>
                <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.78rem' }}>
                  Politique de Confidentialité
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: '16px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            fontSize: '0.78rem',
            color: 'rgba(255, 255, 255, 0.6)',
          }}
        >
          <div>
            © 2026 ASUKAIMMO — Tous droits réservés.
          </div>

          <button
            onClick={scrollToTop}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              color: 'rgba(255, 255, 255, 0.85)',
              fontWeight: 600,
              fontSize: '0.78rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <span>Haut de page</span>
            <i className="fa-solid fa-arrow-up" />
          </button>
        </div>
      </div>
    </footer>
  );
};
