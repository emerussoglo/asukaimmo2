import React, { useState, useEffect, useRef } from 'react';
import { Logo } from '../common/Logo';
import { getSavedFavoriteIds } from '../../lib/favorites';
import { User } from '../../types';

interface NavbarProps {
  currentUser: User | null;
  activeView: string;
  onNavigate: (view: string, filterParams?: any) => void;
  onOpenAuth: (initialMode?: 'login' | 'register') => void;
  onOpenPublish: () => void;
  onLogout?: () => void;
}

export function getUserInitials(name?: string): string {
  if (!name || !name.trim()) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeView,
  onNavigate,
  onOpenAuth,
  onOpenPublish,
  onLogout,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };

    const updateFavs = () => {
      setFavoritesCount(getSavedFavoriteIds().length);
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };

    updateFavs();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('asukaimmo_favorite_changed', updateFavs);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('asukaimmo_favorite_changed', updateFavs);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Desktop navigation links
  const navLinks = [
    { id: 'home', label: 'Accueil', icon: 'fa-house' },
    { id: 'explorer', label: 'Explorer', icon: 'fa-magnifying-glass' },
    { id: 'locations', label: 'Location', icon: 'fa-key', filter: { transactionType: 'RENT' } },
    { id: 'filtre', label: 'Filtre', icon: 'fa-sliders', action: 'open_filter' },
  ];

  const handleLinkClick = (link: (typeof navLinks)[0]) => {
    setMobileMenuOpen(false);
    if (link.action === 'open_filter') {
      onNavigate('explorer', { openFilter: true });
    } else if (link.filter) {
      onNavigate('explorer', link.filter);
    } else {
      onNavigate(link.id);
    }
  };

  return (
    <>
      <header className={`navbar-header ${isScrolled ? 'navbar-scrolled' : ''}`}>
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '100%',
          }}
        >
          {/* Brand Logo (Left) */}
          <Logo size="sm" onClick={() => onNavigate('home')} />

          {/* Desktop Navigation Links (Center) - Strictly horizontal flex row */}
          <nav
            className="desktop-only-flex"
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '28px',
              flexWrap: 'nowrap',
              height: '100%',
            }}
          >
            {navLinks.map((link) => {
              const isActive = activeView === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleLinkClick(link)}
                  style={{
                    fontSize: '0.94rem',
                    fontWeight: isActive ? 800 : 500,
                    color: isActive ? '#052e1d' : '#475569',
                    padding: '8px 4px',
                    position: 'relative',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '7px',
                    whiteSpace: 'nowrap',
                    height: '100%',
                    transition: 'color var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#052e1d')}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.color = '#475569';
                  }}
                >
                  {link.id === 'filtre' && <i className="fa-solid fa-sliders" style={{ fontSize: '0.82rem', color: isActive ? '#052e1d' : '#64748b' }} />}
                  <span>{link.label}</span>
                  {isActive && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '2.5px',
                        backgroundColor: '#052e1d',
                        borderRadius: '2px',
                      }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Cluster (Desktop Only) - Strictly horizontal flex row */}
          <div
            className="desktop-only-flex"
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: '14px',
              flexWrap: 'nowrap',
            }}
          >
            {/* Favorites Heart Icon */}
            <button
              onClick={() => onNavigate('favoris')}
              aria-label="Voir mes favoris"
              style={{
                position: 'relative',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: activeView === 'favoris' ? '#ef4444' : '#334155',
                backgroundColor: activeView === 'favoris' ? '#fee2e2' : 'transparent',
                transition: 'all var(--transition-fast)',
                border: 'none',
                cursor: 'pointer',
              }}
              title="Favoris"
            >
              <i className="fa-solid fa-heart" style={{ fontSize: '1.05rem' }} />
              {favoritesCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-1px',
                    right: '-1px',
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #ffffff',
                  }}
                >
                  {favoritesCount}
                </span>
              )}
            </button>

            {/* "+ Publier une annonce" Pill Button */}
            <button
              onClick={onOpenPublish}
              style={{
                backgroundColor: '#052e1d',
                color: '#ffffff',
                border: 'none',
                borderRadius: '9999px',
                padding: '9px 18px',
                fontSize: '0.88rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                boxShadow: '0 2px 6px rgba(5, 46, 29, 0.15)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#073c26';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#052e1d';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <i className="fa-solid fa-plus" style={{ fontSize: '0.82rem' }} />
              <span>Publier une annonce</span>
            </button>

            {/* User Icon Button with Dropdown */}
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              {currentUser ? (
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '4px 10px 4px 5px',
                    borderRadius: '9999px',
                    border: '1.5px solid #e2e8f0',
                    backgroundColor: '#ffffff',
                    boxShadow: 'var(--shadow-xs)',
                    cursor: 'pointer',
                  }}
                  title={currentUser.name}
                >
                  <div
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      backgroundColor: '#052e1d',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                    }}
                  >
                    {getUserInitials(currentUser.name)}
                  </div>
                  <span
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#052e1d',
                      maxWidth: '100px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {currentUser.name.split(' ')[0]}
                  </span>
                  <i className="fa-solid fa-chevron-down" style={{ fontSize: '0.65rem', color: '#64748b' }} />
                </button>
              ) : (
                /* Circular [ 👤 ] User Icon */
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  aria-label="Menu utilisateur"
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    border: '1.5px solid #e2e8f0',
                    backgroundColor: userDropdownOpen ? '#f1f5f9' : '#ffffff',
                    color: '#052e1d',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  title="Compte / Connexion"
                >
                  <i className="fa-solid fa-user" />
                </button>
              )}

              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: currentUser ? '220px' : '180px',
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(5, 46, 29, 0.15), 0 0 1px 1px rgba(0, 0, 0, 0.05)',
                    border: '1px solid var(--color-border)',
                    padding: '6px',
                    zIndex: 110,
                    animation: 'fadeIn 0.15s ease',
                  }}
                >
                  {currentUser ? (
                    <>
                      <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--color-border-subtle)', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block' }}>
                          {currentUser.name}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', display: 'block' }}>
                          {currentUser.email}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onNavigate('dashboard');
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          color: 'var(--color-primary)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <i className="fa-solid fa-gauge-high" style={{ width: '16px', color: 'var(--color-primary)' }} />
                        <span>Tableau de bord</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onNavigate('dashboard', { path: '/dashboard/annonces' });
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          fontSize: '0.82rem',
                          fontWeight: 500,
                          color: 'var(--color-text)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <i className="fa-solid fa-list-check" style={{ width: '16px', color: 'var(--color-text-muted)' }} />
                        <span>Mes annonces</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onNavigate('dashboard', { path: '/dashboard/profil' });
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          fontSize: '0.82rem',
                          fontWeight: 500,
                          color: 'var(--color-text)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <i className="fa-solid fa-user" style={{ width: '16px', color: 'var(--color-text-muted)' }} />
                        <span>Mon profil</span>
                      </button>

                      {onLogout && (
                        <div style={{ borderTop: '1px solid var(--color-border-subtle)', marginTop: '4px', paddingTop: '4px' }}>
                          <button
                            onClick={() => {
                              setUserDropdownOpen(false);
                              onLogout();
                            }}
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '8px 10px',
                              borderRadius: '6px',
                              fontSize: '0.82rem',
                              fontWeight: 600,
                              color: '#ef4444',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              textAlign: 'left',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fee2e2')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <i className="fa-solid fa-arrow-right-from-bracket" style={{ width: '16px' }} />
                            <span>Déconnexion</span>
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    /* Guest Choices: Connexion & Inscription */
                    <>
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenAuth('login');
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '9px 12px',
                          borderRadius: '6px',
                          fontSize: '0.86rem',
                          fontWeight: 700,
                          color: 'var(--color-primary)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <i className="fa-solid fa-arrow-right-to-bracket" style={{ color: 'var(--color-primary)' }} />
                        <span>Connexion</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenAuth('register');
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '9px 12px',
                          borderRadius: '6px',
                          fontSize: '0.86rem',
                          fontWeight: 600,
                          color: 'var(--color-text)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <i className="fa-solid fa-user-plus" style={{ color: 'var(--color-text-secondary)' }} />
                        <span>Inscription</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Right: HAMBURGER ONLY (Strictly [ LOGO ] ... [ ☰ ]) */}
          <div className="mobile-only">
            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Ouvrir le menu"
              style={{
                width: '42px',
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                color: 'var(--color-primary)',
                fontSize: '1.35rem',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
              }}
            >
              <i className="fa-solid fa-bars" />
            </button>
          </div>
        </div>
      </header>

      {/* Slide-out Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 190,
            backgroundColor: 'rgba(5, 46, 29, 0.5)',
            backdropFilter: 'blur(5px)',
            animation: 'fadeIn 0.2s ease',
          }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: '82%',
              maxWidth: '320px',
              backgroundColor: '#ffffff',
              boxShadow: '-8px 0 25px rgba(0,0,0,0.15)',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 200,
              animation: 'slideInRight 0.22s ease',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Logo size="sm" onClick={() => { setMobileMenuOpen(false); onNavigate('home'); }} />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Fermer le menu"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-text)',
                  border: 'none',
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                }}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            {/* Drawer Body - Navigation Links */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('home');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: activeView === 'home' ? 'var(--color-primary-light)' : 'transparent',
                  color: activeView === 'home' ? 'var(--color-primary)' : 'var(--color-text)',
                  fontWeight: activeView === 'home' ? 700 : 500,
                  fontSize: '0.92rem',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <i className="fa-solid fa-house" style={{ width: '20px', color: 'var(--color-primary)' }} />
                <span>Accueil</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('explorer');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: activeView === 'explorer' ? 'var(--color-primary-light)' : 'transparent',
                  color: activeView === 'explorer' ? 'var(--color-primary)' : 'var(--color-text)',
                  fontWeight: activeView === 'explorer' ? 700 : 500,
                  fontSize: '0.92rem',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <i className="fa-solid fa-magnifying-glass" style={{ width: '20px', color: 'var(--color-primary)' }} />
                <span>Explorer</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('explorer', { transactionType: 'RENT' });
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  color: 'var(--color-text)',
                  fontWeight: 500,
                  fontSize: '0.92rem',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <i className="fa-solid fa-key" style={{ width: '20px', color: 'var(--color-primary)' }} />
                <span>Location</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('explorer', { country: 'France' });
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  color: 'var(--color-text)',
                  fontWeight: 500,
                  fontSize: '0.92rem',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <i className="fa-solid fa-earth-europe" style={{ width: '20px', color: 'var(--color-primary)' }} />
                <span>France</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('explorer', { openFilter: true });
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  color: 'var(--color-text)',
                  fontWeight: 500,
                  fontSize: '0.92rem',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <i className="fa-solid fa-sliders" style={{ width: '20px', color: 'var(--color-primary)' }} />
                <span>Filtrer</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('favoris');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: activeView === 'favoris' ? 'var(--color-danger-light)' : 'transparent',
                  color: activeView === 'favoris' ? '#ef4444' : 'var(--color-text)',
                  fontWeight: activeView === 'favoris' ? 700 : 500,
                  fontSize: '0.92rem',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <i className="fa-solid fa-heart" style={{ width: '20px', color: '#ef4444' }} />
                <span>Favoris {favoritesCount > 0 && `(${favoritesCount})`}</span>
              </button>

              <div style={{ height: '1px', backgroundColor: 'var(--color-border)', margin: '8px 0' }} />

              {/* Publier une annonce CTA */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenPublish();
                }}
                className="btn btn-primary"
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  margin: '4px 0 10px 0',
                }}
              >
                <i className="fa-solid fa-plus" />
                <span>Publier une annonce</span>
              </button>

              {/* Account Section in Mobile Menu */}
              {currentUser ? (
                <>
                  <div style={{ padding: '8px 4px', marginTop: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--color-primary)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                        }}
                      >
                        {getUserInitials(currentUser.name)}
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                          {currentUser.name}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {currentUser.email}
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onNavigate('dashboard');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '11px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--color-primary-light)',
                      color: 'var(--color-primary)',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <i className="fa-solid fa-gauge-high" style={{ width: '20px' }} />
                    <span>Tableau de bord</span>
                  </button>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onNavigate('dashboard', { path: '/dashboard/annonces' });
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '11px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'transparent',
                      color: 'var(--color-text)',
                      fontWeight: 500,
                      fontSize: '0.88rem',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <i className="fa-solid fa-list-check" style={{ width: '20px', color: 'var(--color-text-muted)' }} />
                    <span>Mes annonces</span>
                  </button>

                  {onLogout && (
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onLogout();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '11px 14px',
                        borderRadius: '8px',
                        backgroundColor: 'transparent',
                        color: '#ef4444',
                        fontWeight: 600,
                        fontSize: '0.88rem',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        marginTop: '8px',
                      }}
                    >
                      <i className="fa-solid fa-arrow-right-from-bracket" style={{ width: '20px' }} />
                      <span>Déconnexion</span>
                    </button>
                  )}
                </>
              ) : (
                /* Guest Mobile Links */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAuth('login');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '11px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--color-primary-light)',
                      color: 'var(--color-primary)',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <i className="fa-solid fa-arrow-right-to-bracket" style={{ width: '20px' }} />
                    <span>Connexion</span>
                  </button>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAuth('register');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '11px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'transparent',
                      color: 'var(--color-text)',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      border: '1px solid var(--color-border)',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <i className="fa-solid fa-user-plus" style={{ width: '20px', color: 'var(--color-text-secondary)' }} />
                    <span>Inscription</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
