import React, { useState, useEffect } from 'react';
import { getSavedFavoriteIds } from '../../lib/favorites';

interface MobileBottomNavProps {
  activeView: string;
  onNavigate: (view: string) => void;
  onOpenPublish: () => void;
  onOpenAuth: () => void;
  isLoggedIn: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeView,
  onNavigate,
  onOpenPublish,
  onOpenAuth,
  isLoggedIn,
}) => {
  const [favoritesCount, setFavoritesCount] = useState(0);

  useEffect(() => {
    const updateFavs = () => {
      setFavoritesCount(getSavedFavoriteIds().length);
    };
    updateFavs();
    window.addEventListener('asukaimmo_favorite_changed', updateFavs);
    return () => window.removeEventListener('asukaimmo_favorite_changed', updateFavs);
  }, []);

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'var(--bottom-nav-height)',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 90,
        boxShadow: '0 -4px 16px rgba(5, 46, 29, 0.08)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
      className="mobile-bottom-nav"
    >
      {/* 1. Accueil */}
      <button
        onClick={() => onNavigate('home')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          color: activeView === 'home' ? 'var(--color-primary)' : 'var(--color-text-muted)',
          fontSize: '0.72rem',
          fontWeight: activeView === 'home' ? 700 : 500,
          flex: 1,
        }}
      >
        <i
          className="fa-solid fa-house"
          style={{
            fontSize: '1.2rem',
            color: activeView === 'home' ? 'var(--color-primary)' : 'var(--color-text-muted)',
          }}
        />
        <span>Accueil</span>
      </button>

      {/* 2. Explorer */}
      <button
        onClick={() => onNavigate('explorer')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          color: activeView === 'explorer' ? 'var(--color-primary)' : 'var(--color-text-muted)',
          fontSize: '0.72rem',
          fontWeight: activeView === 'explorer' ? 700 : 500,
          flex: 1,
        }}
      >
        <i
          className="fa-solid fa-magnifying-glass"
          style={{
            fontSize: '1.2rem',
            color: activeView === 'explorer' ? 'var(--color-primary)' : 'var(--color-text-muted)',
          }}
        />
        <span>Explorer</span>
      </button>

      {/* 3. Center Elevated "+ Publier" */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <button
          onClick={onOpenPublish}
          aria-label="Publier un bien"
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-primary)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: '-16px',
            boxShadow: '0 6px 16px rgba(5, 46, 29, 0.35)',
            border: '3px solid #ffffff',
            transition: 'transform 0.15s ease',
            cursor: 'pointer',
          }}
        >
          <i className="fa-solid fa-plus" style={{ fontSize: '1.15rem' }} />
        </button>
        <span
          style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            color: 'var(--color-primary)',
            marginTop: '2px',
          }}
        >
          Publier
        </span>
      </div>

      {/* 4. Favoris */}
      <button
        onClick={() => onNavigate('favoris')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          color: activeView === 'favoris' ? '#ef4444' : 'var(--color-text-muted)',
          fontSize: '0.72rem',
          fontWeight: activeView === 'favoris' ? 700 : 500,
          flex: 1,
          position: 'relative',
        }}
      >
        <div style={{ position: 'relative' }}>
          <i
            className="fa-solid fa-heart"
            style={{
              fontSize: '1.2rem',
              color: activeView === 'favoris' ? '#ef4444' : 'var(--color-text-muted)',
            }}
          />
          {favoritesCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-8px',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                fontSize: '0.65rem',
                fontWeight: 700,
                width: '15px',
                height: '15px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {favoritesCount}
            </span>
          )}
        </div>
        <span>Favoris</span>
      </button>

      {/* 5. Compte */}
      <button
        onClick={() => {
          if (isLoggedIn) {
            onNavigate('dashboard');
          } else {
            onOpenAuth();
          }
        }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          color: activeView === 'dashboard' ? 'var(--color-primary)' : 'var(--color-text-muted)',
          fontSize: '0.72rem',
          fontWeight: activeView === 'dashboard' ? 700 : 500,
          flex: 1,
        }}
      >
        <i
          className="fa-solid fa-user"
          style={{
            fontSize: '1.2rem',
            color: activeView === 'dashboard' ? 'var(--color-primary)' : 'var(--color-text-muted)',
          }}
        />
        <span>{isLoggedIn ? 'Profil' : 'Connexion'}</span>
      </button>

      <style>{`
        @media (min-width: 1024px) {
          .mobile-bottom-nav { display: none !important; }
        }
      `}</style>
    </nav>
  );
};
