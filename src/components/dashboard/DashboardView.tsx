import React, { useState, useEffect } from 'react';
import { Listing, ListingStatus, PlanType, User } from '../../types';
import { api } from '../../lib/api';
import { Logo } from '../common/Logo';
import { getUserInitials } from '../navbar/Navbar';
import { getSavedFavoriteIds, toggleFavoriteId } from '../../lib/favorites';
import { ListingFormPage } from './ListingFormPage';

interface DashboardViewProps {
  currentUser: User;
  onLogout: () => void;
  onExitToPublic: () => void;
  onSelectListing: (listing: Listing) => void;
  currentPath: string;
  onNavigatePath: (path: string) => void;
  editingListingId?: string | null;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  onLogout,
  onExitToPublic,
  onSelectListing,
  currentPath,
  onNavigatePath,
  editingListingId,
}) => {
  // State for overview, listings, stats, subscriptions, profile
  const [overviewData, setOverviewData] = useState<{
    stats: { totalBiens: number; publishedCount: number; sponsoredCount: number; viewsCount: number; contactsCount: number; favoritesCount: number };
    recentListings: Listing[];
  } | null>(null);

  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [listingFilterTab, setListingFilterTab] = useState<'all' | 'PUBLISHED' | 'DRAFT' | 'PAUSED' | 'CLOSED' | 'sponsored'>('all');
  const [listingSearch, setListingSearch] = useState('');
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [dashboardMobileMenuOpen, setDashboardMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [favoriteListings, setFavoriteListings] = useState<Listing[]>([]);

  // Stats tab
  const [statsPeriod, setStatsPeriod] = useState<'7j' | '30j' | '3m'>('30j');
  const [statsData, setStatsData] = useState<{ totalBiens: number; viewsTotales: number; contactsRecus: number; sponsorisees: number; listings: any[] } | null>(null);

  // Promotions tab
  const [promotionsData, setPromotionsData] = useState<{ activePromotions: Listing[]; packages: any[] } | null>(null);
  const [selectedBoostListingId, setSelectedBoostListingId] = useState<string>('');
  const [selectedBoostDays, setSelectedBoostDays] = useState<number>(7);

  // Subscriptions tab
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'semi' | 'annual'>('monthly');

  // Profile tab
  const [profileName, setProfileName] = useState(currentUser.name);
  const [profileEmail] = useState(currentUser.email);
  const [profilePhone, setProfilePhone] = useState(currentUser.phone || '');
  const [profileCity, setProfileCity] = useState(currentUser.city || 'Cotonou');
  const [profileRole, setProfileRole] = useState(currentUser.role || 'PROPRIETAIRE');
  const [profileBio, setProfileBio] = useState(currentUser.bio || '');

  // Password / Settings tab
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [platformNotifications, setPlatformNotifications] = useState(true);
  const [phoneVisible, setPhoneVisible] = useState(true);
  const [profileVisible, setProfileVisible] = useState(true);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Load real data from Turso via API
  const refreshAllData = async () => {
    try {
      const [overview, listingsRes, statsRes, promoRes, subRes] = await Promise.all([
        api.dashboard.getOverview(),
        api.dashboard.getListings(),
        api.dashboard.getStats(),
        api.dashboard.getPromotions(),
        api.dashboard.getSubscription(),
      ]);

      setOverviewData(overview);
      setMyListings(listingsRes);
      setStatsData(statsRes);
      setPromotionsData(promoRes);
      setSubscriptionData(subRes);
      if (listingsRes.length > 0 && !selectedBoostListingId) {
        setSelectedBoostListingId(listingsRes[0].id);
      }

      // Load favorites for /dashboard/favoris
      try {
        const publicListings = await api.public.getListings();
        const favIds = getSavedFavoriteIds();
        setFavoriteListings(publicListings.filter((l) => favIds.includes(l.id)));
      } catch (favErr) {
        console.warn('Error loading favorites in dashboard:', favErr);
      }
    } catch (err: any) {
      console.warn('Error loading dashboard data:', err);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, [currentUser.id]);

  // Load editing listing if URL has /modifier
  useEffect(() => {
    if (editingListingId) {
      api.dashboard.getListing(editingListingId).then((l) => setEditingListing(l)).catch(() => setEditingListing(null));
    } else {
      setEditingListing(null);
    }
  }, [editingListingId]);

  // Close menus on route change
  useEffect(() => {
    setUserDropdownOpen(false);
    setDashboardMobileMenuOpen(false);
  }, [currentPath]);

  // Click outside to close user dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.user-dropdown-container')) {
        setUserDropdownOpen(false);
      }
    };
    if (userDropdownOpen) {
      document.addEventListener('click', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [userDropdownOpen]);

  // Dynamic real-time personalized greeting based on current local hour
  const getGreetingData = () => {
    const hour = new Date().getHours();
    const firstName = currentUser.name ? currentUser.name.split(' ')[0] : 'Cher membre';

    if (hour >= 5 && hour < 12) {
      return {
        greeting: `Bonjour, ${firstName}`,
        subtitle: 'Prêt pour une nouvelle journée productive ? Voici un œil sur vos biens et vos statistiques en temps réel.',
        icon: 'fa-sun',
        iconColor: '#f59e0b',
        badge: 'Excellente matinée ☀️',
        accentBg: 'rgba(245, 158, 11, 0.18)',
      };
    } else if (hour >= 12 && hour < 18) {
      return {
        greeting: `Bon après-midi, ${firstName}`,
        subtitle: 'Quoi de neuf sur vos annonces et prises de contact aujourd’hui ? Consultez vos performances.',
        icon: 'fa-cloud-sun',
        iconColor: '#38bdf8',
        badge: 'Bel après-midi 🌤️',
        accentBg: 'rgba(56, 189, 248, 0.18)',
      };
    } else if (hour >= 18 && hour < 23) {
      return {
        greeting: `Bonsoir, ${firstName}`,
        subtitle: 'Voici le bilan de vos visites et les prises de contact reçues aujourd’hui sur ASUKAIMMO.',
        icon: 'fa-moon',
        iconColor: '#c084fc',
        badge: 'Agréable soirée 🌙',
        accentBg: 'rgba(192, 132, 252, 0.18)',
      };
    } else {
      return {
        greeting: `Bienvenue, ${firstName}`,
        subtitle: 'Vos annonces restent actives et visibles 24h/24 auprès des locataires et acheteurs au Bénin.',
        icon: 'fa-star-and-crescent',
        iconColor: '#34d399',
        badge: 'Toujours en ligne 24/7 ✨',
        accentBg: 'rgba(52, 211, 153, 0.18)',
      };
    }
  };

  const greetingData = getGreetingData();

  // Actions on listings
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await api.dashboard.updateStatus(id, newStatus);
      showToast('Statut mis à jour dans Turso.');
      refreshAllData();
    } catch (err: any) {
      showToast(err.message || 'Erreur lors du changement de statut.');
    }
  };

  const handleToggleBoost = async (id: string) => {
    try {
      const res = await api.dashboard.toggleBoost(id);
      showToast(res.message);
      refreshAllData();
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de la mise à jour du boost.');
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmId) {
      try {
        await api.dashboard.deleteListing(deleteConfirmId);
        showToast('Annonce supprimée de la base de données.');
        setDeleteConfirmId(null);
        refreshAllData();
      } catch (err: any) {
        showToast(err.message || 'Erreur lors de la suppression.');
      }
    }
  };

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/annonces/${slug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      showToast('Lien copié dans le presse-papiers !');
    } else {
      showToast(`Lien : ${url}`);
    }
  };

  const handleShare = async (listing: Listing) => {
    const url = `${window.location.origin}/annonces/${listing.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: listing.title,
          text: `Découvrez cette annonce sur ASUKAIMMO : ${listing.title}`,
          url,
        });
      } catch {
        handleCopyLink(listing.slug);
      }
    } else {
      handleCopyLink(listing.slug);
    }
  };

  const handleRemoveFavorite = (id: string) => {
    toggleFavoriteId(id);
    setFavoriteListings((prev) => prev.filter((l) => l.id !== id));
    showToast('Bien retiré de vos favoris.');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.dashboard.updateProfile({
        name: profileName,
        phone: profilePhone,
        whatsapp: profilePhone,
        city: profileCity,
        bio: profileBio,
      });
      currentUser.name = profileName;
      currentUser.phone = profilePhone;
      currentUser.city = profileCity;
      showToast('Profil enregistré avec succès dans Turso.');
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de l’enregistrement.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('Les deux mots de passe ne correspondent pas.');
      return;
    }
    try {
      await api.dashboard.updatePassword({ currentPassword, newPassword });
      showToast('Mot de passe modifié avec succès.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast(err.message || 'Erreur lors du changement de mot de passe.');
    }
  };

  const handleUpgradePlan = async (planId: PlanType) => {
    try {
      await api.dashboard.upgradeSubscription(planId);
      currentUser.plan = planId;
      currentUser.maxListings = planId === 'PRO' ? 20 : planId === 'AGENCE' ? 100 : 1;
      showToast(`Abonnement mis à niveau vers la formule ${planId}.`);
      refreshAllData();
    } catch (err: any) {
      showToast(err.message || 'Erreur lors du changement de formule.');
    }
  };

  // Filtered listings
  const filteredListings = myListings.filter((l) => {
    if (listingSearch) {
      const q = listingSearch.toLowerCase();
      if (!l.title.toLowerCase().includes(q) && !l.city.toLowerCase().includes(q) && !l.neighborhood.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (listingFilterTab === 'PUBLISHED') return l.status === 'PUBLISHED';
    if (listingFilterTab === 'DRAFT') return l.status === 'DRAFT';
    if (listingFilterTab === 'PAUSED') return l.status === 'PAUSED';
    if (listingFilterTab === 'CLOSED') return l.status === 'SOLD' || l.status === 'RENTED';
    if (listingFilterTab === 'sponsored') return l.isSponsored;
    return true;
  });

  // Sidebar Links matching PDF
  const sidebarLinks = [
    { path: '/dashboard', label: 'Tableau de bord', icon: 'fa-gauge-high' },
    { path: '/dashboard/annonces', label: 'Mes annonces', icon: 'fa-list-check', badge: myListings.length },
    { path: '/dashboard/annonces/nouvelle', label: '+ Ajouter un bien', icon: 'fa-circle-plus', isHighlight: true },
    { path: '/dashboard/favoris', label: 'Favoris', icon: 'fa-heart', badge: favoriteListings.length },
    { path: '/dashboard/statistiques', label: 'Statistiques', icon: 'fa-chart-line' },
    { path: '/dashboard/promotions', label: 'Promotions', icon: 'fa-rocket' },
    { path: '/dashboard/abonnement', label: 'Abonnement', icon: 'fa-crown', badge: `${myListings.length}/${currentUser.maxListings}` },
    { path: '/dashboard/profil', label: 'Profil', icon: 'fa-user' },
    { path: '/dashboard/parametres', label: 'Paramètres', icon: 'fa-gear' },
    { path: '/dashboard/aide', label: 'Aide & FAQ', icon: 'fa-circle-question' },
  ];

  // If on /dashboard/annonces/nouvelle or /dashboard/annonces/[id]/modifier:
  // Render the FULL PAGE stepped wizard (NOT a modal!)
  const isCreateRoute = currentPath === '/dashboard/annonces/nouvelle';
  const isEditRoute = currentPath.includes('/modifier');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', paddingBottom: '24px' }}>
      {/* Toast Notification */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            bottom: '80px',
            right: '20px',
            zIndex: 150,
            backgroundColor: 'var(--color-primary)',
            color: '#ffffff',
            padding: '10px 18px',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.86rem',
            fontWeight: 700,
            border: '1px solid #10b981',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <i className="fa-solid fa-circle-check" style={{ color: '#10b981' }} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. FIXED DESKTOP SIDEBAR (Visible ONLY on Desktop >= 1024px, completely immobile during scroll) */}
      <aside
        className="dashboard-fixed-sidebar"
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '20px 14px',
        }}
      >
        <div>
          {/* Logo & Dashboard Badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', padding: '0 6px' }}>
            <Logo size="sm" onClick={onExitToPublic} />
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                color: 'var(--color-primary)',
                backgroundColor: 'var(--color-primary-light)',
                padding: '3px 8px',
                borderRadius: 'var(--radius-sm)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Pro
            </span>
          </div>

          {/* Sidebar Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {sidebarLinks.map((item) => {
              const isActive = currentPath === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => onNavigatePath(item.path)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isActive ? 'var(--color-primary-light)' : item.isHighlight ? 'var(--color-secondary-blue-subtle)' : 'transparent',
                    color: isActive ? 'var(--color-primary)' : item.isHighlight ? 'var(--color-secondary-blue)' : 'var(--color-text-secondary)',
                    fontWeight: isActive || item.isHighlight ? 700 : 500,
                    fontSize: '0.84rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    border: 'none',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i
                      className={`fa-solid ${item.icon}`}
                      style={{
                        width: '16px',
                        color: isActive ? 'var(--color-primary)' : item.isHighlight ? 'var(--color-secondary-blue)' : 'var(--color-text-muted)',
                      }}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      style={{
                        backgroundColor: isActive ? 'var(--color-primary)' : 'var(--color-bg)',
                        color: isActive ? '#ffffff' : 'var(--color-text-muted)',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-full)',
                        border: '1px solid var(--color-border-subtle)',
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer: Return to public site & Logout */}
        <div style={{ paddingTop: '16px', borderTop: '1px solid var(--color-border-subtle)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <button
            onClick={onExitToPublic}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-secondary)',
              fontSize: '0.82rem',
              fontWeight: 500,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <i className="fa-solid fa-arrow-left" style={{ width: '16px' }} />
            <span>Voir le site public</span>
          </button>

          <button
            onClick={onLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              color: '#ef4444',
              fontSize: '0.82rem',
              fontWeight: 600,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <i className="fa-solid fa-arrow-right-from-bracket" style={{ width: '16px' }} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* MOBILE DASHBOARD SLIDE-OUT DRAWER */}
      {dashboardMobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 195,
            backgroundColor: 'rgba(5, 46, 29, 0.5)',
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.2s ease',
          }}
          onClick={() => setDashboardMobileMenuOpen(false)}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              width: '82%',
              maxWidth: '320px',
              backgroundColor: '#ffffff',
              boxShadow: '8px 0 25px rgba(0,0,0,0.15)',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 200,
              animation: 'slideInLeft 0.22s ease',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                    fontSize: '0.84rem',
                    fontWeight: 800,
                  }}
                >
                  {getUserInitials(currentUser.name)}
                </div>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                    {currentUser.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                    Plan {currentUser.plan}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDashboardMobileMenuOpen(false)}
                aria-label="Fermer le menu"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-text)',
                  border: 'none',
                  fontSize: '1rem',
                  cursor: 'pointer',
                }}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            {/* Drawer Links */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {[
                { path: '/dashboard', label: 'Dashboard', icon: 'fa-gauge-high' },
                { path: '/dashboard/annonces', label: 'Mes annonces', icon: 'fa-list-check', badge: myListings.length },
                { path: '/dashboard/annonces/nouvelle', label: 'Publier une annonce', icon: 'fa-circle-plus', isHighlight: true },
                { path: '/dashboard/favoris', label: 'Favoris', icon: 'fa-heart', badge: favoriteListings.length },
                { path: '/dashboard/abonnement', label: 'Abonnement', icon: 'fa-crown' },
                { path: '/dashboard/profil', label: 'Profil', icon: 'fa-user' },
                { path: '/dashboard/parametres', label: 'Paramètres', icon: 'fa-gear' },
              ].map((link) => {
                const isActive = currentPath === link.path;
                return (
                  <button
                    key={link.path}
                    onClick={() => {
                      setDashboardMobileMenuOpen(false);
                      onNavigatePath(link.path);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '11px 14px',
                      borderRadius: '8px',
                      backgroundColor: isActive
                        ? 'var(--color-primary-light)'
                        : link.isHighlight
                        ? 'var(--color-secondary-blue-subtle)'
                        : 'transparent',
                      color: isActive
                        ? 'var(--color-primary)'
                        : link.isHighlight
                        ? 'var(--color-secondary-blue)'
                        : 'var(--color-text)',
                      fontWeight: isActive || link.isHighlight ? 700 : 500,
                      fontSize: '0.88rem',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <i className={`fa-solid ${link.icon}`} style={{ width: '18px', color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)' }} />
                      <span>{link.label}</span>
                    </div>
                    {link.badge !== undefined && (
                      <span
                        style={{
                          backgroundColor: isActive ? 'var(--color-primary)' : 'var(--color-bg)',
                          color: isActive ? '#ffffff' : 'var(--color-text-muted)',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '1px 7px',
                          borderRadius: '10px',
                        }}
                      >
                        {link.badge}
                      </span>
                    )}
                  </button>
                );
              })}

              <div style={{ height: '1px', backgroundColor: 'var(--color-border)', margin: '10px 0' }} />

              <button
                onClick={() => {
                  setDashboardMobileMenuOpen(false);
                  onExitToPublic();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '11px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  color: 'var(--color-text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.86rem',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <i className="fa-solid fa-arrow-left" style={{ width: '18px' }} />
                <span>Voir le site public</span>
              </button>

              <button
                onClick={() => {
                  setDashboardMobileMenuOpen(false);
                  onLogout();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '11px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  color: '#ef4444',
                  fontWeight: 600,
                  fontSize: '0.86rem',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  marginTop: '4px',
                }}
              >
                <i className="fa-solid fa-arrow-right-from-bracket" style={{ width: '18px' }} />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. MAIN CONTENT AREA (Offset by 250px on Desktop, full width on Mobile) */}
      <div className="dashboard-main-container">
        {/* DESKTOP DASHBOARD TOP BAR (Visible only on Desktop >= 1024px) */}
        <header
          className="desktop-only"
          style={{
            height: '62px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            position: 'sticky',
            top: 0,
            zIndex: 80,
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          {/* Breadcrumb / Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.86rem', color: 'var(--color-text-muted)' }}>Dashboard</span>
            <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }} />
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-primary)' }}>
              {sidebarLinks.find((l) => l.path === currentPath)?.label || 'Espace de gestion'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => onNavigatePath('/dashboard/annonces/nouvelle')}
              className="btn btn-primary btn-sm"
              style={{ gap: '6px', fontSize: '0.82rem', fontWeight: 700, borderRadius: 'var(--radius-full)', padding: '7px 14px' }}
            >
              <i className="fa-solid fa-plus" />
              <span>Ajouter un bien</span>
            </button>

            {/* User profile initials avatar button with dropdown menu */}
            <div className="user-dropdown-container" style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setUserDropdownOpen((prev) => !prev);
                }}
                aria-label="Menu utilisateur"
                aria-expanded={userDropdownOpen}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-primary)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  border: userDropdownOpen ? '2px solid var(--color-primary)' : '2px solid rgba(5, 46, 29, 0.12)',
                  boxShadow: userDropdownOpen ? '0 0 0 3px rgba(5, 46, 29, 0.15)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                title={currentUser.name}
              >
                {getUserInitials(currentUser.name)}
              </button>

              {userDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '230px',
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    boxShadow: '0 12px 32px -4px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.06)',
                    padding: '8px',
                    zIndex: 250,
                    animation: 'fadeIn 0.18s ease',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ padding: '10px 12px 12px 12px', borderBottom: '1px solid var(--color-border)', marginBottom: '6px' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--color-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {currentUser.name}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                      {currentUser.email}
                    </div>
                    <div style={{ marginTop: '6px' }}>
                      <span
                        style={{
                          fontSize: '0.66rem',
                          fontWeight: 700,
                          backgroundColor: 'var(--color-primary-light)',
                          color: 'var(--color-primary)',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        Plan {currentUser.plan || 'Standard'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onNavigatePath('/dashboard/profil');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: currentPath === '/dashboard/profil' ? 'var(--color-primary-light)' : 'transparent',
                        color: currentPath === '/dashboard/profil' ? 'var(--color-primary)' : 'var(--color-text)',
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%',
                      }}
                    >
                      <i className="fa-solid fa-user" style={{ width: '16px', color: 'var(--color-primary)' }} />
                      <span>Profil</span>
                    </button>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onNavigatePath('/dashboard/abonnement');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: currentPath === '/dashboard/abonnement' ? 'var(--color-primary-light)' : 'transparent',
                        color: currentPath === '/dashboard/abonnement' ? 'var(--color-primary)' : 'var(--color-text)',
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%',
                      }}
                    >
                      <i className="fa-solid fa-crown" style={{ width: '16px', color: '#f59e0b' }} />
                      <span>Abonnement</span>
                    </button>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onNavigatePath('/dashboard/parametres');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: currentPath === '/dashboard/parametres' ? 'var(--color-primary-light)' : 'transparent',
                        color: currentPath === '/dashboard/parametres' ? 'var(--color-primary)' : 'var(--color-text)',
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%',
                      }}
                    >
                      <i className="fa-solid fa-gear" style={{ width: '16px', color: 'var(--color-text-secondary)' }} />
                      <span>Paramètres</span>
                    </button>
                  </div>

                  <div style={{ height: '1px', backgroundColor: 'var(--color-border)', margin: '6px 0' }} />

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onLogout();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: '#ef4444',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    <i className="fa-solid fa-arrow-right-from-bracket" style={{ width: '16px' }} />
                    <span>Déconnexion</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* MOBILE DASHBOARD TOP BAR: Strictly [ ☰ ] [ LOGO ] on left, [ Initials ] on right */}
        <header
          className="mobile-only"
          style={{
            height: '58px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            position: 'sticky',
            top: 0,
            zIndex: 85,
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          {/* Hamburger on the Left */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setDashboardMobileMenuOpen(true)}
              aria-label="Menu du dashboard"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary)',
                fontSize: '1.35rem',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <i className="fa-solid fa-bars" />
            </button>
            <Logo size="sm" onClick={onExitToPublic} />
          </div>

          {/* User initials on the Right with dropdown menu (NO name displayed) */}
          <div className="user-dropdown-container" style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setUserDropdownOpen((prev) => !prev);
              }}
              aria-label="Menu utilisateur"
              aria-expanded={userDropdownOpen}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.82rem',
                fontWeight: 800,
                border: userDropdownOpen ? '2px solid var(--color-primary)' : '2px solid rgba(5, 46, 29, 0.12)',
                boxShadow: userDropdownOpen ? '0 0 0 3px rgba(5, 46, 29, 0.15)' : 'none',
                cursor: 'pointer',
              }}
            >
              {getUserInitials(currentUser.name)}
            </button>

            {userDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '220px',
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  boxShadow: '0 12px 32px -4px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.06)',
                  padding: '8px',
                  zIndex: 250,
                  animation: 'fadeIn 0.18s ease',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ padding: '8px 10px 10px 10px', borderBottom: '1px solid var(--color-border)', marginBottom: '4px' }}>
                  <div style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--color-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {currentUser.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                    {currentUser.email}
                  </div>
                  <div style={{ marginTop: '4px' }}>
                    <span
                      style={{
                        fontSize: '0.64rem',
                        fontWeight: 700,
                        backgroundColor: 'var(--color-primary-light)',
                        color: 'var(--color-primary)',
                        padding: '2px 7px',
                        borderRadius: '9999px',
                        textTransform: 'uppercase',
                      }}
                    >
                      Plan {currentUser.plan || 'Standard'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onNavigatePath('/dashboard/profil');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '9px 10px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: currentPath === '/dashboard/profil' ? 'var(--color-primary-light)' : 'transparent',
                      color: currentPath === '/dashboard/profil' ? 'var(--color-primary)' : 'var(--color-text)',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    <i className="fa-solid fa-user" style={{ width: '16px', color: 'var(--color-primary)' }} />
                    <span>Profil</span>
                  </button>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onNavigatePath('/dashboard/abonnement');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '9px 10px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: currentPath === '/dashboard/abonnement' ? 'var(--color-primary-light)' : 'transparent',
                      color: currentPath === '/dashboard/abonnement' ? 'var(--color-primary)' : 'var(--color-text)',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    <i className="fa-solid fa-crown" style={{ width: '16px', color: '#f59e0b' }} />
                    <span>Abonnement</span>
                  </button>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onNavigatePath('/dashboard/parametres');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '9px 10px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: currentPath === '/dashboard/parametres' ? 'var(--color-primary-light)' : 'transparent',
                      color: currentPath === '/dashboard/parametres' ? 'var(--color-primary)' : 'var(--color-text)',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    <i className="fa-solid fa-gear" style={{ width: '16px', color: 'var(--color-text-secondary)' }} />
                    <span>Paramètres</span>
                  </button>
                </div>

                <div style={{ height: '1px', backgroundColor: 'var(--color-border)', margin: '4px 0' }} />

                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    onLogout();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#ef4444',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <i className="fa-solid fa-arrow-right-from-bracket" style={{ width: '16px' }} />
                  <span>Déconnexion</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Dashboard Workspace */}
        <main style={{ flex: 1, padding: '24px 20px', minWidth: 0, overflowX: 'hidden' }}>
          {/* ROUTE 1: /dashboard/annonces/nouvelle (FULL PAGE stepped wizard, NOT A MODAL!) */}
          {isCreateRoute && (
            <ListingFormPage
              userPlan={currentUser.plan}
              userMaxListings={currentUser.maxListings}
              onCancel={() => onNavigatePath('/dashboard/annonces')}
              onSuccess={(saved) => {
                showToast('Annonce enregistrée avec succès dans Turso !');
                refreshAllData();
                onNavigatePath('/dashboard/annonces');
              }}
            />
          )}

          {/* ROUTE 2: /dashboard/annonces/[id]/modifier (FULL PAGE stepped wizard with preloaded data!) */}
          {isEditRoute && (
            <ListingFormPage
              initialListing={editingListing}
              userPlan={currentUser.plan}
              userMaxListings={currentUser.maxListings}
              onCancel={() => onNavigatePath('/dashboard/annonces')}
              onSuccess={(saved) => {
                showToast('Annonce mise à jour avec succès dans Turso !');
                refreshAllData();
                onNavigatePath('/dashboard/annonces');
              }}
            />
          )}

          {/* ROUTE 3: /dashboard (Tableau de bord Overview) */}
          {currentPath === '/dashboard' && !isCreateRoute && !isEditRoute && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Welcome banner with dynamic real-time greeting */}
              <div
                style={{
                  backgroundColor: 'var(--color-primary)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '24px 28px',
                  color: '#ffffff',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '18px',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 10px 25px -5px rgba(5, 46, 29, 0.25)',
                }}
              >
                {/* Subtle decorative glow */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-40px',
                    right: '-40px',
                    width: '180px',
                    height: '180px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(52, 211, 153, 0.25) 0%, transparent 70%)',
                    pointerEvents: 'none',
                  }}
                />

                <div style={{ position: 'relative', zIndex: 1, maxWidth: '650px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        color: '#a7f3d0',
                        fontWeight: 700,
                        backgroundColor: 'rgba(255, 255, 255, 0.12)',
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                      }}
                    >
                      <i className={`fa-solid ${greetingData.icon}`} style={{ color: greetingData.iconColor }} />
                      <span>{greetingData.badge}</span>
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.65)' }}>• Tableau de bord propriétaire</span>
                  </div>

                  <h2
                    style={{
                      fontSize: 'clamp(1.3rem, 2.5vw, 1.65rem)',
                      fontWeight: 800,
                      marginTop: '2px',
                      marginBottom: '6px',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span>{greetingData.greeting}</span>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: greetingData.accentBg,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1rem',
                      }}
                    >
                      <i className={`fa-solid ${greetingData.icon}`} style={{ color: greetingData.iconColor }} />
                    </div>
                  </h2>
                  <p style={{ color: 'rgba(255, 255, 255, 0.88)', fontSize: '0.88rem', margin: 0, lineHeight: 1.5 }}>
                    {greetingData.subtitle}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
                  <button
                    onClick={() => onNavigatePath('/dashboard/annonces/nouvelle')}
                    className="btn hover-lift"
                    style={{
                      backgroundColor: '#ffffff',
                      color: 'var(--color-primary)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      padding: '9px 18px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <i className="fa-solid fa-plus" />
                    <span>Nouvelle annonce</span>
                  </button>
                  <button
                    onClick={() => onNavigatePath('/dashboard/annonces')}
                    className="btn hover-lift"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      padding: '9px 16px',
                      cursor: 'pointer',
                    }}
                  >
                    Gérer mes biens ({overviewData?.stats.totalBiens ?? 0})
                  </button>
                </div>
              </div>

              {/* Real KPI Cards from Turso */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px' }}>
                {[
                  { label: 'Total biens', val: overviewData?.stats.totalBiens ?? 0, icon: 'fa-building', color: 'var(--color-primary)' },
                  { label: 'Vues totales', val: overviewData?.stats.viewsCount ?? 0, icon: 'fa-eye', color: '#3b82f6' },
                  { label: 'Contacts reçus', val: overviewData?.stats.contactsCount ?? 0, icon: 'fa-comments', color: '#10b981' },
                  { label: 'Sponsorisées', val: overviewData?.stats.sponsoredCount ?? 0, icon: 'fa-rocket', color: '#f59e0b' },
                ].map((stat, i) => (
                  <div key={i} className="card" style={{ padding: '16px', backgroundColor: '#ffffff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>{stat.label}</span>
                      <i className={`fa-solid ${stat.icon}`} style={{ color: stat.color, fontSize: '0.95rem' }} />
                    </div>
                    <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary)', display: 'block', lineHeight: 1 }}>
                      {stat.val}
                    </span>
                  </div>
                ))}
              </div>

              {/* Recent Listings or Empty State */}
              <div className="card" style={{ padding: '20px', backgroundColor: '#ffffff' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
                    Mes annonces récentes
                  </h3>
                  <button
                    onClick={() => onNavigatePath('/dashboard/annonces')}
                    style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-secondary-blue)', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Voir tout ({myListings.length}) →
                  </button>
                </div>

                {myListings.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '36px 12px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                    <i className="fa-solid fa-house-chimney-crack" style={{ fontSize: '2.2rem', color: 'var(--color-text-muted)', marginBottom: '8px' }} />
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '14px' }}>
                      Vous n'avez encore publié aucune annonce.
                    </p>
                    <button onClick={() => onNavigatePath('/dashboard/annonces/nouvelle')} className="btn btn-primary btn-sm">
                      <i className="fa-solid fa-plus" />
                      <span>Publier ma première annonce</span>
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {myListings.slice(0, 4).map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--color-border)',
                          backgroundColor: '#ffffff',
                          flexWrap: 'wrap',
                        }}
                      >
                        <img src={item.images[0]} alt="" style={{ width: '56px', height: '44px', objectFit: 'cover', borderRadius: '4px' }} />
                        <div style={{ flex: 1, minWidth: '160px' }}>
                          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block' }}>
                            {item.title}
                          </span>
                          <span style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)' }}>
                            {item.neighborhood}, {item.city} • {item.price.toLocaleString('fr-FR')} FCFA {item.priceUnit}
                          </span>
                        </div>
                        <span className="badge badge-rent" style={{ fontSize: '0.68rem' }}>
                          {item.status === 'PUBLISHED' ? 'En ligne' : item.status === 'PAUSED' ? 'Réservé' : item.status}
                        </span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => onSelectListing(item)}
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '4px 8px', fontSize: '0.76rem' }}
                            title="Voir la fiche"
                          >
                            <i className="fa-solid fa-eye" />
                          </button>
                          <button
                            onClick={() => onNavigatePath(`/dashboard/annonces/${item.id}/modifier`)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px', fontSize: '0.76rem' }}
                            title="Modifier"
                          >
                            <i className="fa-solid fa-pen-to-square" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ROUTE 4: /dashboard/annonces (Mes annonces, matching PDF page 1 bottom) */}
          {currentPath === '/dashboard/annonces' && !isCreateRoute && !isEditRoute && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
                    Mes annonces
                  </h2>
                  <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
                    Gérez et publiez vos mandats, modifiez vos prix et suivez l'intérêt des clients.
                  </p>
                </div>
                <button
                  onClick={() => onNavigatePath('/dashboard/annonces/nouvelle')}
                  className="btn btn-primary btn-sm"
                  style={{ gap: '6px' }}
                >
                  <i className="fa-solid fa-plus" />
                  <span>+ Ajouter</span>
                </button>
              </div>

              {/* Subtabs matching PDF: Toutes, Actives, En attente, Refusées, Sponsorisées */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {[
                    { id: 'all', label: `Toutes (${myListings.length})` },
                    { id: 'PUBLISHED', label: `Actives (${myListings.filter((l) => l.status === 'PUBLISHED').length})` },
                    { id: 'DRAFT', label: `En attente (${myListings.filter((l) => l.status === 'DRAFT').length})` },
                    { id: 'PAUSED', label: `Refusées / Pause (${myListings.filter((l) => l.status === 'PAUSED').length})` },
                    { id: 'sponsored', label: `Sponsorisées (${myListings.filter((l) => l.isSponsored).length})` },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setListingFilterTab(tab.id as any)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        backgroundColor: listingFilterTab === tab.id ? 'var(--color-primary)' : '#ffffff',
                        color: listingFilterTab === tab.id ? '#ffffff' : 'var(--color-text-secondary)',
                        border: '1px solid var(--color-border)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div style={{ position: 'relative', width: '220px' }}>
                  <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '10px', top: '10px', fontSize: '0.78rem', color: 'var(--color-text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Rechercher mes biens..."
                    value={listingSearch}
                    onChange={(e) => setListingSearch(e.target.value)}
                    style={{ width: '100%', padding: '6px 10px 6px 28px', fontSize: '0.8rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)', backgroundColor: '#ffffff' }}
                  />
                </div>
              </div>

              {/* Cards Grid */}
              {filteredListings.length === 0 ? (
                <div className="card" style={{ padding: '40px 20px', textAlign: 'center', backgroundColor: '#ffffff' }}>
                  <i className="fa-solid fa-folder-open" style={{ fontSize: '2.4rem', color: 'var(--color-text-muted)', marginBottom: '8px' }} />
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)', margin: '4px 0' }}>
                    Aucune annonce trouvée
                  </h4>
                  <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', marginBottom: '14px' }}>
                    {myListings.length === 0
                      ? 'Vous n’avez encore publié aucune annonce.'
                      : 'Aucune annonce ne correspond au filtre sélectionné.'}
                  </p>
                  <button onClick={() => onNavigatePath('/dashboard/annonces/nouvelle')} className="btn btn-primary btn-sm">
                    <i className="fa-solid fa-plus" />
                    <span>Ajouter mon premier bien</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {filteredListings.map((item) => (
                    <div
                      key={item.id}
                      className="card"
                      style={{
                        padding: '16px',
                        backgroundColor: '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        border: item.isSponsored ? '2px solid #10b981' : '1px solid var(--color-border)',
                      }}
                    >
                      {/* Thumbnail & Badges */}
                      <div style={{ position: 'relative', height: '140px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: '10px' }}>
                        <img src={item.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <span
                          className="badge"
                          style={{
                            position: 'absolute',
                            top: '8px',
                            left: '8px',
                            fontSize: '0.66rem',
                            backgroundColor: item.status === 'PUBLISHED' ? '#10b981' : '#f59e0b',
                            color: '#ffffff',
                          }}
                        >
                          {item.status === 'PUBLISHED' ? 'Publiée' : item.status === 'PAUSED' ? 'En pause' : item.status}
                        </span>
                        <span
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            backgroundColor: 'rgba(5, 46, 29, 0.85)',
                            color: '#ffffff',
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                          }}
                        >
                          {item.price.toLocaleString('fr-FR')} FCFA {item.priceUnit}
                        </span>
                      </div>

                      {/* Title & Location */}
                      <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--color-primary)', margin: '0 0 4px', lineHeight: 1.3 }}>
                        {item.title}
                      </h4>
                      <p style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', margin: '0 0 10px' }}>
                        <i className="fa-solid fa-location-dot" style={{ marginRight: '4px' }} />
                        {item.neighborhood}, {item.city} • <span style={{ fontWeight: 600 }}>{item.propertyType}</span>
                      </p>

                      {/* Direct Action Buttons (Matching PDF: Voir, Modifier, Copier lien, Partager, Statut, Supprimer) */}
                      <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--color-border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => onSelectListing(item)}
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '5px 8px', fontSize: '0.76rem' }}
                            title="Voir l'annonce publique"
                          >
                            <i className="fa-solid fa-eye" />
                            <span>Voir</span>
                          </button>
                          <button
                            onClick={() => onNavigatePath(`/dashboard/annonces/${item.id}/modifier`)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '5px 8px', fontSize: '0.76rem' }}
                            title="Modifier l'annonce"
                          >
                            <i className="fa-solid fa-pen-to-square" />
                          </button>
                        </div>

                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <button
                            onClick={() => handleCopyLink(item.slug)}
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '5px 8px', fontSize: '0.76rem' }}
                            title="Copier le lien public"
                          >
                            <i className="fa-solid fa-link" />
                          </button>
                          <button
                            onClick={() => handleShare(item)}
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '5px 8px', fontSize: '0.76rem' }}
                            title="Partager"
                          >
                            <i className="fa-solid fa-share-nodes" />
                          </button>
                          <button
                            onClick={() => handleStatusChange(item.id, item.status === 'PUBLISHED' ? 'PAUSED' : 'PUBLISHED')}
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '5px 8px', fontSize: '0.76rem' }}
                            title={item.status === 'PUBLISHED' ? 'Mettre en pause' : 'Remettre en ligne'}
                          >
                            <i className={item.status === 'PUBLISHED' ? 'fa-solid fa-pause' : 'fa-solid fa-play'} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(item.id)}
                            style={{ color: '#ef4444', background: 'none', border: 'none', padding: '5px 8px', cursor: 'pointer' }}
                            title="Supprimer définitivement"
                          >
                            <i className="fa-solid fa-trash-can" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ROUTE: /dashboard/favoris */}
          {currentPath === '/dashboard/favoris' && !isCreateRoute && !isEditRoute && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
                    Mes favoris
                  </h2>
                  <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', margin: '4px 0 0 0' }}>
                    Retrouvez ici les biens que vous avez enregistrés.
                  </p>
                </div>
              </div>

              {favoriteListings.length === 0 ? (
                <div className="card" style={{ padding: '48px 20px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: 'var(--radius-lg)' }}>
                  <i className="fa-regular fa-heart" style={{ fontSize: '2.5rem', color: 'var(--color-text-muted)', marginBottom: '12px', display: 'block' }} />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '6px' }}>
                    Vous n'avez encore aucun favori
                  </h3>
                  <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', maxWidth: '400px', margin: '0 auto 16px auto' }}>
                    Parcourez les annonces disponibles et cliquez sur le cœur pour les retrouver dans votre espace.
                  </p>
                  <button onClick={onExitToPublic} className="btn btn-primary btn-sm" style={{ gap: '6px' }}>
                    <i className="fa-solid fa-magnifying-glass" />
                    <span>Explorer les biens disponibles</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                  {favoriteListings.map((fav) => (
                    <div
                      key={fav.id}
                      className="card"
                      style={{
                        backgroundColor: '#ffffff',
                        overflow: 'hidden',
                        borderRadius: '12px',
                        border: '1px solid var(--color-border)',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <div style={{ height: '140px', position: 'relative' }}>
                        <img
                          src={fav.images[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80'}
                          alt={fav.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveFavorite(fav.id)}
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            color: '#ef4444',
                            border: 'none',
                            borderRadius: '50%',
                            width: '30px',
                            height: '30px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          }}
                          title="Retirer des favoris"
                        >
                          <i className="fa-solid fa-heart" />
                        </button>
                      </div>
                      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '4px' }}>
                          {fav.title}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '10px' }}>
                          <i className="fa-solid fa-location-dot" style={{ marginRight: '4px' }} />
                          {fav.neighborhood}, {fav.city}
                        </span>
                        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--color-secondary-blue)' }}>
                            {fav.price.toLocaleString('fr-FR')} FCFA <span style={{ fontSize: '0.72rem', fontWeight: 500 }}>{fav.priceUnit}</span>
                          </span>
                          <button
                            onClick={() => onSelectListing(fav)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                          >
                            Voir détails
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ROUTE 5: /dashboard/statistiques (Matching PDF page 2 top) */}
          {currentPath === '/dashboard/statistiques' && !isCreateRoute && !isEditRoute && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
                    Statistiques de vos annonces
                  </h2>
                  <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
                    Mesurez l'audience et la visibilité de vos biens en temps réel.
                  </p>
                </div>

                {/* Period tabs: 7 jours, 30 jours, 3 mois */}
                <div style={{ display: 'flex', gap: '4px', backgroundColor: '#ffffff', padding: '4px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)' }}>
                  {(['7j', '30j', '3m'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setStatsPeriod(p)}
                      style={{
                        padding: '4px 12px',
                        borderRadius: 'var(--radius-full)',
                        border: 'none',
                        backgroundColor: statsPeriod === p ? 'var(--color-primary)' : 'transparent',
                        color: statsPeriod === p ? '#ffffff' : 'var(--color-text-secondary)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {p === '7j' ? '7 jours' : p === '30j' ? '30 jours' : '3 mois'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4 Cards matching PDF page 2: Total biens, Vues totales, Contacts reçus, Sponsorisées */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px' }}>
                <div className="card" style={{ padding: '16px', backgroundColor: '#ffffff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', fontWeight: 700 }}>Total biens</span>
                    <i className="fa-solid fa-house" style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                    {statsData?.totalBiens ?? 0}
                  </span>
                </div>

                <div className="card" style={{ padding: '16px', backgroundColor: '#ffffff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', fontWeight: 700 }}>Vues totales</span>
                    <i className="fa-solid fa-eye" style={{ color: '#3b82f6' }} />
                  </div>
                  <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                    {statsData?.viewsTotales ?? 0}
                  </span>
                </div>

                <div className="card" style={{ padding: '16px', backgroundColor: '#ffffff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', fontWeight: 700 }}>Contacts reçus</span>
                    <i className="fa-solid fa-comments" style={{ color: '#10b981' }} />
                  </div>
                  <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                    {statsData?.contactsRecus ?? 0}
                  </span>
                </div>

                <div className="card" style={{ padding: '16px', backgroundColor: '#ffffff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', fontWeight: 700 }}>Sponsorisées</span>
                    <i className="fa-solid fa-rocket" style={{ color: '#f59e0b' }} />
                  </div>
                  <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                    {statsData?.sponsorisees ?? 0}
                  </span>
                </div>
              </div>

              {/* Chart section matching PDF: "Publications sur la période" */}
              <div className="card" style={{ padding: '24px', backgroundColor: '#ffffff' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '14px' }}>
                  Publications sur la période
                </h3>

                {myListings.length === 0 ? (
                  <p style={{ fontSize: '0.86rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '30px 0' }}>
                    Vos statistiques apparaîtront ici dès que vous aurez publié votre premier bien.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {myListings.map((l) => (
                      <div key={l.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                        <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--color-primary)' }}>{l.title}</span>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                          <span><strong>{l.viewsCount}</strong> vues</span>
                          <span><strong>{l.contactsCount}</strong> contacts</span>
                          <span><strong>{l.likesCount}</strong> favoris</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ROUTE 6: /dashboard/promotions (Matching PDF page 2 bottom) */}
          {currentPath === '/dashboard/promotions' && !isCreateRoute && !isEditRoute && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
                  Promotions & Boost
                </h2>
                <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
                  Augmentez la visibilité de votre bien pendant la période choisie.
                </p>
              </div>

              {/* Boost configuration card */}
              <div className="card" style={{ padding: '24px', backgroundColor: '#ffffff' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '14px' }}>
                  Boostez votre annonce
                </h3>

                {myListings.length === 0 ? (
                  <p style={{ fontSize: '0.86rem', color: 'var(--color-text-muted)' }}>
                    Vous n'avez pas encore d'annonce à booster. Publiez d'abord un bien.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '6px' }}>
                        Annonce à booster
                      </label>
                      <select
                        value={selectedBoostListingId}
                        onChange={(e) => setSelectedBoostListingId(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.88rem' }}
                      >
                        {myListings.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.title} ({l.city}) {l.isSponsored ? '• Déjà boosté' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '6px' }}>
                        Durée du boost
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                        {[
                          { days: 7, price: '2 000 F' },
                          { days: 14, price: '3 500 F' },
                          { days: 30, price: '6 000 F' },
                        ].map((b) => (
                          <button
                            key={b.days}
                            type="button"
                            onClick={() => setSelectedBoostDays(b.days)}
                            style={{
                              padding: '14px',
                              borderRadius: 'var(--radius-md)',
                              border: selectedBoostDays === b.days ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                              backgroundColor: selectedBoostDays === b.days ? 'var(--color-primary-light)' : '#ffffff',
                              color: 'var(--color-primary)',
                              textAlign: 'center',
                              cursor: 'pointer',
                            }}
                          >
                            <span style={{ fontSize: '0.88rem', fontWeight: 800, display: 'block' }}>{b.days} jours</span>
                            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>{b.price}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (selectedBoostListingId) {
                          handleToggleBoost(selectedBoostListingId);
                        }
                      }}
                      className="btn btn-primary"
                      style={{ width: 'fit-content', padding: '10px 24px', gap: '8px' }}
                    >
                      <i className="fa-solid fa-rocket" />
                      <span>Activer le boost</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Active promotions list */}
              <div className="card" style={{ padding: '20px', backgroundColor: '#ffffff' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '12px' }}>
                  Mes promotions actives
                </h3>
                {myListings.filter((l) => l.isSponsored).length === 0 ? (
                  <p style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)' }}>
                    Aucune promotion active actuellement.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {myListings.filter((l) => l.isSponsored).map((l) => (
                      <div key={l.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                        <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--color-primary)' }}>{l.title}</span>
                        <span style={{ fontSize: '0.72rem', backgroundColor: '#dcfce7', color: '#15803d', fontWeight: 700, padding: '3px 8px', borderRadius: 'var(--radius-full)' }}>
                          Sponsorisée • En tête
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ROUTE 7: /dashboard/abonnement (Matching PDF page 3 top) */}
          {currentPath === '/dashboard/abonnement' && !isCreateRoute && !isEditRoute && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
                  Abonnement
                </h2>
                <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
                  Gérez votre formule, vos quotas et le renouvellement de votre compte.
                </p>
              </div>

              {/* Current plan banner matching PDF page 3 */}
              <div className="card" style={{ padding: '24px', backgroundColor: '#ffffff' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                  <div>
                    <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                      Abonnement actuel
                    </span>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)', margin: '2px 0 0' }}>
                      Plan {currentUser.plan}
                    </h3>
                    <span style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: 600 }}>
                      Actif • {myListings.length} / {currentUser.maxListings} biens utilisés
                    </span>
                  </div>

                  <span style={{ fontSize: '0.78rem', fontWeight: 700, backgroundColor: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: 'var(--radius-full)' }}>
                    Facturation mensuelle
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.min(100, (myListings.length / currentUser.maxListings) * 100)}%`,
                      height: '100%',
                      backgroundColor: 'var(--color-primary)',
                    }}
                  />
                </div>
              </div>

              {/* Period Switcher: Mensuel / Semestriel / Annuel */}
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                {[
                  { id: 'monthly', label: 'Mensuel' },
                  { id: 'semi', label: 'Semestriel (-10%)' },
                  { id: 'annual', label: 'Annuel (-20%)' },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setBillingCycle(c.id as any)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid var(--color-border)',
                      backgroundColor: billingCycle === c.id ? 'var(--color-primary)' : '#ffffff',
                      color: billingCycle === c.id ? '#ffffff' : 'var(--color-text)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {/* 3 Plans matching PDF page 3: Découverte, Pro, Agence */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                {/* Découverte */}
                <div className="card" style={{ padding: '20px', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column' }}>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>Découverte</h4>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)', margin: '6px 0 2px' }}>
                    0 <small style={{ fontSize: '0.78rem' }}>FCFA / mois</small>
                  </span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', marginBottom: '14px' }}>1 annonce maximum</span>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 18px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem' }}>
                    <li><i className="fa-solid fa-check" style={{ color: '#10b981', marginRight: '6px' }} /> 1 annonce maximum</li>
                    <li><i className="fa-solid fa-check" style={{ color: '#10b981', marginRight: '6px' }} /> 2 photos par annonce</li>
                    <li><i className="fa-solid fa-check" style={{ color: '#10b981', marginRight: '6px' }} /> Contacts directs WhatsApp</li>
                    <li><i className="fa-solid fa-check" style={{ color: '#10b981', marginRight: '6px' }} /> Statistiques de base</li>
                  </ul>
                  <button
                    onClick={() => handleUpgradePlan('FREE')}
                    disabled={currentUser.plan === 'FREE'}
                    className={`btn ${currentUser.plan === 'FREE' ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                    style={{ marginTop: 'auto', width: '100%' }}
                  >
                    {currentUser.plan === 'FREE' ? 'Plan actuel' : 'Choisir Découverte'}
                  </button>
                </div>

                {/* Pro */}
                <div className="card" style={{ padding: '20px', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', border: '2px solid var(--color-primary)', position: 'relative' }}>
                  <span style={{ position: 'absolute', top: '-10px', right: '14px', backgroundColor: 'var(--color-primary)', color: '#ffffff', fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                    Populaire
                  </span>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>Pro</h4>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)', margin: '6px 0 2px' }}>
                    5 000 <small style={{ fontSize: '0.78rem' }}>FCFA / mois</small>
                  </span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', marginBottom: '14px' }}>20 biens maximum</span>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 18px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem' }}>
                    <li><i className="fa-solid fa-check" style={{ color: '#10b981', marginRight: '6px' }} /> 20 annonces maximum</li>
                    <li><i className="fa-solid fa-check" style={{ color: '#10b981', marginRight: '6px' }} /> 15 photos par annonce</li>
                    <li><i className="fa-solid fa-check" style={{ color: '#10b981', marginRight: '6px' }} /> Annonces sponsorisées</li>
                    <li><i className="fa-solid fa-check" style={{ color: '#10b981', marginRight: '6px' }} /> Badge vérifié</li>
                    <li><i className="fa-solid fa-check" style={{ color: '#10b981', marginRight: '6px' }} /> Support prioritaire</li>
                  </ul>
                  <button
                    onClick={() => handleUpgradePlan('PRO')}
                    disabled={currentUser.plan === 'PRO'}
                    className={`btn ${currentUser.plan === 'PRO' ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                    style={{ marginTop: 'auto', width: '100%' }}
                  >
                    {currentUser.plan === 'PRO' ? 'Plan actuel' : 'Activer Plan Pro'}
                  </button>
                </div>

                {/* Agence */}
                <div className="card" style={{ padding: '20px', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column' }}>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>Agence</h4>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)', margin: '6px 0 2px' }}>
                    15 000 <small style={{ fontSize: '0.78rem' }}>FCFA / mois</small>
                  </span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', marginBottom: '14px' }}>100 biens maximum</span>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 18px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem' }}>
                    <li><i className="fa-solid fa-check" style={{ color: '#10b981', marginRight: '6px' }} /> 100 annonces maximum</li>
                    <li><i className="fa-solid fa-check" style={{ color: '#10b981', marginRight: '6px' }} /> Photos illimitées</li>
                    <li><i className="fa-solid fa-check" style={{ color: '#10b981', marginRight: '6px' }} /> Page d'agence personnalisée</li>
                    <li><i className="fa-solid fa-check" style={{ color: '#10b981', marginRight: '6px' }} /> Statistiques avancées</li>
                    <li><i className="fa-solid fa-check" style={{ color: '#10b981', marginRight: '6px' }} /> Boosts inclus</li>
                    <li><i className="fa-solid fa-check" style={{ color: '#10b981', marginRight: '6px' }} /> Support dédié 7j/7</li>
                  </ul>
                  <button
                    onClick={() => handleUpgradePlan('AGENCE')}
                    disabled={currentUser.plan === 'AGENCE'}
                    className={`btn ${currentUser.plan === 'AGENCE' ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                    style={{ marginTop: 'auto', width: '100%' }}
                  >
                    {currentUser.plan === 'AGENCE' ? 'Plan actuel' : 'Activer Plan Agence'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ROUTE 8: /dashboard/profil (Matching PDF page 3 bottom) */}
          {currentPath === '/dashboard/profil' && !isCreateRoute && !isEditRoute && (
            <div className="card" style={{ padding: '28px', backgroundColor: '#ffffff', maxWidth: '640px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--color-border-subtle)' }}>
                <div
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-primary)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.4rem',
                    fontWeight: 800,
                  }}
                >
                  {currentUser.name.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
                    {currentUser.name}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{currentUser.email}</span>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.7rem', backgroundColor: '#dcfce7', color: '#15803d', fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                      Propriétaire
                    </span>
                    <span style={{ fontSize: '0.7rem', backgroundColor: '#e0e7ff', color: '#3730a3', fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                      Compte vérifié
                    </span>
                  </div>
                </div>
              </div>

              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '14px' }}>
                Informations personnelles
              </h4>

              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '4px' }}>
                    Nom complet
                  </label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.88rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '4px' }}>
                    Email (identifiant)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={profileEmail}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', opacity: 0.75, fontSize: '0.88rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '4px' }}>
                      Téléphone / WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.88rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '4px' }}>
                      Ville
                    </label>
                    <select
                      value={profileCity}
                      onChange={(e) => setProfileCity(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.88rem', backgroundColor: '#ffffff' }}
                    >
                      <option value="Cotonou">Cotonou</option>
                      <option value="Abomey-Calavi">Abomey-Calavi</option>
                      <option value="Porto-Novo">Porto-Novo</option>
                      <option value="Ouidah">Ouidah</option>
                      <option value="Parakou">Parakou</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '4px' }}>
                    Description / Bio
                  </label>
                  <textarea
                    rows={3}
                    value={profileBio}
                    onChange={(e) => setProfileBio(e.target.value)}
                    placeholder="Présentez-vous en quelques mots..."
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.86rem' }}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: 'fit-content', padding: '10px 24px', fontWeight: 700 }}>
                  Enregistrer les modifications
                </button>
              </form>
            </div>
          )}

          {/* ROUTE 9: /dashboard/parametres (Matching PDF page 4) */}
          {currentPath === '/dashboard/parametres' && !isCreateRoute && !isEditRoute && (
            <div style={{ maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
                  Paramètres
                </h2>
                <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
                  Gérez la sécurité de votre compte et vos préférences de confidentialité.
                </p>
              </div>

              {/* Compte & Sécurité */}
              <div className="card" style={{ padding: '24px', backgroundColor: '#ffffff' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '14px' }}>
                  <i className="fa-solid fa-lock" style={{ marginRight: '8px' }} />
                  Sécurité & Mot de passe
                </h3>

                <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '4px' }}>
                      Mot de passe actuel
                    </label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.86rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '4px' }}>
                      Nouveau mot de passe
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.86rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '4px' }}>
                      Confirmer le nouveau mot de passe
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.86rem' }}
                    />
                  </div>

                  <button type="submit" className="btn btn-secondary btn-sm" style={{ width: 'fit-content' }}>
                    Changer le mot de passe
                  </button>
                </form>
              </div>

              {/* Notifications matching PDF page 4 */}
              <div className="card" style={{ padding: '24px', backgroundColor: '#ffffff' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '14px' }}>
                  <i className="fa-solid fa-bell" style={{ marginRight: '8px' }} />
                  Notifications
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                    <div>
                      <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block' }}>
                        Notifications par email
                      </span>
                      <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                        Recevoir les alertes par email lors d'un nouveau contact.
                      </span>
                    </div>
                    <input type="checkbox" checked={emailAlerts} onChange={(e) => setEmailAlerts(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                    <div>
                      <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block' }}>
                        Notifications plateforme
                      </span>
                      <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                        Afficher les alertes sur le site.
                      </span>
                    </div>
                    <input type="checkbox" checked={platformNotifications} onChange={(e) => setPlatformNotifications(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                  </label>
                </div>
              </div>

              {/* Confidentialité matching PDF page 4 */}
              <div className="card" style={{ padding: '24px', backgroundColor: '#ffffff' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '14px' }}>
                  <i className="fa-solid fa-shield-halved" style={{ marginRight: '8px' }} />
                  Confidentialité
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                    <div>
                      <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block' }}>
                        Téléphone visible
                      </span>
                      <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                        Afficher mon numéro sur mes annonces.
                      </span>
                    </div>
                    <input type="checkbox" checked={phoneVisible} onChange={(e) => setPhoneVisible(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                    <div>
                      <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block' }}>
                        Profil visible
                      </span>
                      <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                        Permettre aux autres de voir mon profil public.
                      </span>
                    </div>
                    <input type="checkbox" checked={profileVisible} onChange={(e) => setProfileVisible(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                  </label>
                </div>

                <button onClick={() => showToast('Paramètres enregistrés avec succès.')} className="btn btn-primary btn-sm">
                  Enregistrer les paramètres
                </button>
              </div>
            </div>
          )}

          {/* ROUTE 10: /dashboard/aide */}
          {currentPath === '/dashboard/aide' && !isCreateRoute && !isEditRoute && (
            <div className="card" style={{ padding: '28px', backgroundColor: '#ffffff', maxWidth: '640px' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '8px' }}>
                Aide & Assistance Propriétaire
              </h2>
              <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
                Besoin d'aide pour publier ou optimiser vos annonces ?
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ padding: '14px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-primary)', margin: '0 0 4px' }}>
                    Comment fonctionne le quota d'annonces ?
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                    La formule gratuite Découverte permet de publier 1 annonce. Pour publier jusqu'à 20 annonces, passez au Plan Pro dans l'onglet "Abonnement".
                  </p>
                </div>

                <div style={{ padding: '14px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-primary)', margin: '0 0 4px' }}>
                    Comment les locataires me contactent-ils ?
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                    Les locataires cliquent directement sur "Contacter sur WhatsApp" sur votre annonce. Un message pré-rempli s'ouvre dans leur WhatsApp avec le titre et le lien de votre bien.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* DASHBOARD MOBILE BOTTOM TAB BAR (Visible ONLY on Mobile < 1024px, fixed at bottom) */}
        <nav
          className="mobile-only dashboard-mobile-bottom-nav"
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
            zIndex: 150,
            boxShadow: '0 -4px 16px rgba(5, 46, 29, 0.08)',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
        >
          {/* 1. Accueil (Tableau de bord Overview) */}
          <button
            onClick={() => onNavigatePath('/dashboard')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              color: currentPath === '/dashboard' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontSize: '0.72rem',
              fontWeight: currentPath === '/dashboard' ? 700 : 500,
              flex: 1,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <i className="fa-solid fa-house" style={{ fontSize: '1.15rem' }} />
            <span>Accueil</span>
          </button>

          {/* 2. Annonces */}
          <button
            onClick={() => onNavigatePath('/dashboard/annonces')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              color: currentPath === '/dashboard/annonces' || currentPath.startsWith('/dashboard/annonces/') ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontSize: '0.72rem',
              fontWeight: currentPath.startsWith('/dashboard/annonces') ? 700 : 500,
              flex: 1,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <i className="fa-solid fa-list-check" style={{ fontSize: '1.15rem' }} />
            <span>Annonces</span>
          </button>

          {/* 3. Center Elevated "+ Ajouter" with label underneath */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <button
              onClick={() => onNavigatePath('/dashboard/annonces/nouvelle')}
              aria-label="Ajouter une annonce"
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
                cursor: 'pointer',
              }}
            >
              <i className="fa-solid fa-plus" style={{ fontSize: '1.15rem' }} />
            </button>
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: currentPath === '/dashboard/annonces/nouvelle' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                marginTop: '2px',
              }}
            >
              Ajouter
            </span>
          </div>

          {/* 4. Abonnement */}
          <button
            onClick={() => onNavigatePath('/dashboard/abonnement')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              color: currentPath === '/dashboard/abonnement' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontSize: '0.72rem',
              fontWeight: currentPath === '/dashboard/abonnement' ? 700 : 500,
              flex: 1,
            }}
          >
            <i className="fa-solid fa-crown" style={{ fontSize: '1.15rem' }} />
            <span>Abonnement</span>
          </button>

          {/* 5. Profil */}
          <button
            onClick={() => onNavigatePath('/dashboard/profil')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              color: currentPath === '/dashboard/profil' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontSize: '0.72rem',
              fontWeight: currentPath === '/dashboard/profil' ? 700 : 500,
              flex: 1,
            }}
          >
            <i className="fa-solid fa-user" style={{ fontSize: '1.15rem' }} />
            <span>Profil</span>
          </button>
        </nav>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 130,
            backgroundColor: 'rgba(5, 46, 29, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setDeleteConfirmId(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              maxWidth: '420px',
              width: '100%',
              boxShadow: 'var(--shadow-xl)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '8px' }}>
              Confirmer la suppression
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--color-text-secondary)', marginBottom: '18px' }}>
              Êtes-vous sûr de vouloir supprimer définitivement cette annonce ? Cette action est irréversible dans la base de données.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setDeleteConfirmId(null)} className="btn btn-secondary btn-sm">
                Annuler
              </button>
              <button
                onClick={handleConfirmDelete}
                className="btn btn-sm"
                style={{ backgroundColor: '#ef4444', color: '#ffffff', border: 'none' }}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
