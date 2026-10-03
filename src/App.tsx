import React, { useState, useEffect } from 'react';
import { FilterState, Listing, PlanType, PropertyType, TransactionType, User } from './types';
import { listingRepo, userRepo } from './lib/turso';
import { api } from './lib/api';

// Public Components
import { Navbar } from './components/navbar/Navbar';
import { Hero } from './components/hero/Hero';
import { ListingsSection } from './components/listings/ListingsSection';
import { LocationsSection } from './components/locations/LocationsSection';
import { CategoriesSection } from './components/categories/CategoriesSection';
import { PartnersSection } from './components/partners/PartnersSection';
import { PricingSection } from './components/pricing/PricingSection';
import { FAQSection } from './components/faq/FAQSection';
import { CTASection } from './components/cta/CTASection';
import { Footer } from './components/footer/Footer';

// Views & Modals
import { ExplorerView } from './components/explorer/ExplorerView';
import { FavoritesView } from './components/favorites/FavoritesView';
import { DashboardView } from './components/dashboard/DashboardView';
import { PropertyDetailPage } from './components/detail/PropertyDetailPage';
import { PublishWizard } from './components/publish/PublishWizard';
import { AuthModal } from './components/auth/AuthModal';
import { MobileBottomNav } from './components/navbar/MobileBottomNav';
import { TestimonialsSection } from './components/testimonials/TestimonialsSection';
import { ScrollReveal } from './components/common/ScrollReveal';

export default function App() {
  // Visitor starts unauthenticated unless already stored in userRepo (Turso/LocalStorage)
  const [currentUser, setCurrentUser] = useState<User | null>(() => userRepo.getActiveUser());
  const [listings, setListings] = useState<Listing[]>([]);
  const [activeView, setActiveView] = useState<'home' | 'explorer' | 'favoris' | 'detail' | 'dashboard'>(() => {
    if (typeof window === 'undefined') return 'home';
    const path = window.location.pathname;
    if (path.startsWith('/dashboard')) return 'dashboard';
    if (path.startsWith('/annonces/')) return 'detail';
    if (path === '/explorer') return 'explorer';
    if (path === '/favoris') return 'favoris';
    return 'home';
  });
  const [previousPublicView, setPreviousPublicView] = useState<'home' | 'explorer' | 'favoris'>('home');
  const [explorerFilters, setExplorerFilters] = useState<Partial<FilterState>>({});

  const [selectedListing, setSelectedListing] = useState<Listing | null>(() => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/annonces/')) {
      const slug = window.location.pathname.replace('/annonces/', '');
      return listingRepo.getListings().find((l) => l.slug === slug || l.id === slug) || null;
    }
    return null;
  });
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [dashboardPath, setDashboardPath] = useState<string>(() => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/dashboard')) {
      return window.location.pathname;
    }
    return '/dashboard';
  });
  const [editingListingId, setEditingListingId] = useState<string | null>(() => {
    if (typeof window !== 'undefined' && window.location.pathname.includes('/modifier')) {
      const parts = window.location.pathname.split('/');
      const modIdx = parts.indexOf('modifier');
      if (modIdx > 0) return parts[modIdx - 1];
    }
    return null;
  });
  const [publishWizardOpen, setPublishWizardOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [pendingActionAfterAuth, setPendingActionAfterAuth] = useState<'dashboard' | 'publish' | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load listings from Turso / Repository
  const loadListings = () => {
    const data = listingRepo.getListings();
    setListings(data);

    // If initial view is detail and selectedListing was not resolved yet:
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/annonces/')) {
      const slug = window.location.pathname.replace('/annonces/', '');
      const found = data.find((l) => l.slug === slug || l.id === slug);
      if (found) {
        setSelectedListing(found);
        setActiveView('detail');
      }
      api.public.getListingBySlug(slug).then((remoteItem) => {
        if (remoteItem) {
          setSelectedListing(remoteItem);
          setActiveView('detail');
        }
      }).catch(() => {});
    }
  };

  useEffect(() => {
    loadListings();

    // Fetch up-to-date public listings from Turso backend
    api.public.getListings().then((serverListings) => {
      if (Array.isArray(serverListings) && serverListings.length > 0) {
        const local = listingRepo.getListings();
        const map = new Map<string, Listing>();
        for (const l of serverListings) map.set(l.id, l);
        for (const l of local) map.set(l.id, l);
        const combined = Array.from(map.values());
        setListings(combined);

        if (typeof window !== 'undefined' && window.location.pathname.startsWith('/annonces/')) {
          const slug = window.location.pathname.replace('/annonces/', '');
          const match = combined.find((l) => l.slug === slug || l.id === slug);
          if (match) {
            setSelectedListing(match);
            setActiveView('detail');
          }
        }
      }
    }).catch((e) => console.warn('Sync notice:', e));

    // Verify real session with Turso on load
    api.auth.me().then((realUser) => {
      if (realUser) {
        setCurrentUser(realUser);
        userRepo.setActiveUser(realUser);
        if (window.location.pathname.startsWith('/dashboard')) {
          setActiveView('dashboard');
          setDashboardPath(window.location.pathname);
        }
      } else {
        setCurrentUser(null);
        userRepo.setActiveUser(null);
        if (window.location.pathname.startsWith('/dashboard')) {
          setActiveView('home');
          window.history.replaceState(null, '', '/');
          setPendingActionAfterAuth('dashboard');
          setAuthMode('login');
          setAuthModalOpen(true);
        }
      }
    });

    const handleCreated = () => {
      loadListings();
      showToast('Votre annonce a été enregistrée avec succès !');
    };

    const handleDeleted = () => {
      loadListings();
      showToast('Annonce supprimée avec succès.');
    };

    const handleUpdated = () => {
      loadListings();
      showToast('Annonce mise à jour avec succès.');
    };

    const handleUserChanged = (e: any) => {
      setCurrentUser(e.detail || null);
    };

    window.addEventListener('asukaimmo_listing_created', handleCreated);
    window.addEventListener('asukaimmo_listing_deleted', handleDeleted);
    window.addEventListener('asukaimmo_listing_updated', handleUpdated);
    window.addEventListener('asukaimmo_user_changed', handleUserChanged);

    // Browser back/forward navigation support
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.startsWith('/annonces/')) {
        const slug = path.replace('/annonces/', '');
        const target = listingRepo.getListings().find((l) => l.slug === slug || l.id === slug);
        if (target) {
          setSelectedListing(target);
          setActiveView('detail');
          return;
        }
        api.public.getListingBySlug(slug).then((remoteItem) => {
          if (remoteItem) {
            setSelectedListing(remoteItem);
            setActiveView('detail');
          }
        }).catch(() => {});
        return;
      } else if (path === '/explorer') {
        setActiveView('explorer');
        return;
      } else if (path === '/favoris') {
        setActiveView('favoris');
        return;
      } else if (path.startsWith('/dashboard')) {
        const active = userRepo.getActiveUser();
        if (active) {
          setCurrentUser(active);
          setActiveView('dashboard');
          setDashboardPath(path);
          if (path.includes('/modifier')) {
            const parts = path.split('/');
            const modIdx = parts.indexOf('modifier');
            if (modIdx > 0) {
              setEditingListingId(parts[modIdx - 1]);
            }
          } else {
            setEditingListingId(null);
          }
        } else {
          setActiveView('home');
          window.history.replaceState(null, '', '/');
          setPendingActionAfterAuth('dashboard');
          setAuthMode('login');
          setAuthModalOpen(true);
        }
        return;
      }
      setActiveView('home');
      setSelectedListing(null);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('asukaimmo_listing_created', handleCreated);
      window.removeEventListener('asukaimmo_listing_deleted', handleDeleted);
      window.removeEventListener('asukaimmo_listing_updated', handleUpdated);
      window.removeEventListener('asukaimmo_user_changed', handleUserChanged);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const handleNavigate = (view: string, filterParams?: any) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (view === 'explorer' || view === 'locations' || view === 'ventes' || view === 'france' || view === 'filtre') {
      if (filterParams) {
        setExplorerFilters(filterParams);
      }
      setActiveView('explorer');
      setPreviousPublicView('explorer');
      if (typeof window !== 'undefined') {
        window.history.pushState(null, '', '/explorer');
      }
    } else if (view === 'villes') {
      setActiveView('home');
      setPreviousPublicView('home');
      setTimeout(() => {
        const el = document.getElementById('section-villes');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else if (view === 'favoris') {
      setActiveView('favoris');
      setPreviousPublicView('favoris');
      if (typeof window !== 'undefined') {
        window.history.pushState(null, '', '/favoris');
      }
    } else if (view === 'dashboard') {
      if (!currentUser) {
        setPendingActionAfterAuth('dashboard');
        setAuthMode('login');
        setAuthModalOpen(true);
      } else {
        const targetPath = filterParams?.path || '/dashboard';
        setActiveView('dashboard');
        setDashboardPath(targetPath);
        if (targetPath.includes('/modifier')) {
          const parts = targetPath.split('/');
          const modIdx = parts.indexOf('modifier');
          if (modIdx > 0) setEditingListingId(parts[modIdx - 1]);
        } else {
          setEditingListingId(null);
        }
        if (typeof window !== 'undefined') {
          window.history.pushState(null, '', targetPath);
        }
      }
    } else {
      setActiveView('home');
      setPreviousPublicView('home');
      if (typeof window !== 'undefined') {
        window.history.pushState(null, '', '/');
      }
    }
  };

  const handleSelectListing = (listing: Listing) => {
    if (activeView !== 'detail') {
      setPreviousPublicView(activeView === 'dashboard' ? 'home' : (activeView as any));
    }
    setSelectedListing(listing);
    setActiveView('detail');
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', `/annonces/${listing.slug}`);
    }
  };

  const handleBackFromDetail = () => {
    setActiveView(previousPublicView || 'home');
    setSelectedListing(null);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', previousPublicView === 'explorer' ? '/explorer' : '/');
    }
  };

  const handleHeroSearch = (params: {
    city?: string;
    keyword?: string;
    country?: string;
    transactionType?: TransactionType;
    propertyType?: PropertyType | 'ALL';
    maxPrice?: number;
    userCoords?: { latitude: number; longitude: number };
    aiExplanation?: string;
  }) => {
    setExplorerFilters({
      city: params.city || '',
      keyword: params.keyword || '',
      country: params.country,
      transactionType: params.transactionType || 'ALL',
      propertyType: params.propertyType || 'ALL',
      maxPrice: params.maxPrice || 0,
      userCoords: params.userCoords,
    });
    setActiveView('explorer');
    setPreviousPublicView('explorer');
    if (params.aiExplanation) {
      showToast(params.aiExplanation);
    }
  };

  const handleSelectCity = (city: string) => {
    setExplorerFilters({ city, country: 'Bénin' });
    setActiveView('explorer');
    setPreviousPublicView('explorer');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCategory = (cat: PropertyType) => {
    setExplorerFilters({ propertyType: cat });
    setActiveView('explorer');
    setPreviousPublicView('explorer');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectPlan = (plan: PlanType) => {
    if (currentUser) {
      const maxListings = plan === 'PRO' ? 20 : plan === 'AGENCE' ? 100 : 1;
      userRepo.updateUserProfile(currentUser.id, { plan, maxListings });
      setCurrentUser((prev) => (prev ? { ...prev, plan, maxListings } : null));
      showToast(`Formule ${plan} activée avec succès.`);
    } else {
      setPendingActionAfterAuth('dashboard');
      setAuthMode('register');
      setAuthModalOpen(true);
    }
  };

  // Requirement 19: Clicking "Publier une annonce" arrives on /dashboard/annonces/nouvelle (Real page, NOT a modal)
  const handleOpenPublish = () => {
    if (!currentUser) {
      setPendingActionAfterAuth('publish');
      setAuthMode('login');
      setAuthModalOpen(true);
    } else {
      setActiveView('dashboard');
      setDashboardPath('/dashboard/annonces/nouvelle');
      setEditingListingId(null);
      if (typeof window !== 'undefined') {
        window.history.pushState(null, '', '/dashboard/annonces/nouvelle');
      }
    }
  };

  const handleEditListing = (listing: Listing) => {
    setActiveView('dashboard');
    setDashboardPath(`/dashboard/annonces/${listing.id}/modifier`);
    setEditingListingId(listing.id);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', `/dashboard/annonces/${listing.id}/modifier`);
    }
  };

  const handleLogout = async () => {
    try {
      await api.auth.logout();
    } catch (e) {
      console.warn('Logout error', e);
    }
    userRepo.logout();
    setCurrentUser(null);
    setActiveView('home');
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', '/');
    }
    showToast('Vous avez été déconnecté.');
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setAuthModalOpen(false);
    showToast(`Bienvenue, ${user.name} !`);

    if (pendingActionAfterAuth === 'publish') {
      setActiveView('dashboard');
      setDashboardPath('/dashboard/annonces/nouvelle');
      setEditingListingId(null);
      if (typeof window !== 'undefined') {
        window.history.pushState(null, '', '/dashboard/annonces/nouvelle');
      }
    } else {
      setActiveView('dashboard');
      setDashboardPath('/dashboard');
      if (typeof window !== 'undefined') {
        window.history.pushState(null, '', '/dashboard');
      }
    }
    setPendingActionAfterAuth(null);
  };

  // If in Dashboard view, render dedicated dashboard interface (NO public navbar, NO public footer)
  if (activeView === 'dashboard' && currentUser) {
    return (
      <>
        {/* Toast Notification */}
        {toastMessage && (
          <div
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              zIndex: 140,
              backgroundColor: 'var(--color-primary)',
              color: '#ffffff',
              padding: '10px 18px',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.86rem',
              fontWeight: 600,
              border: '1px solid #10b981',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <i className="fa-solid fa-circle-check" style={{ color: '#10b981' }} />
            <span>{toastMessage}</span>
          </div>
        )}

        <DashboardView
          currentUser={currentUser}
          currentPath={dashboardPath}
          editingListingId={editingListingId}
          onNavigatePath={(path: string) => {
            setDashboardPath(path);
            if (path.includes('/modifier')) {
              const parts = path.split('/');
              const modIdx = parts.indexOf('modifier');
              if (modIdx > 0) {
                setEditingListingId(parts[modIdx - 1]);
              }
            } else {
              setEditingListingId(null);
            }
            if (typeof window !== 'undefined') {
              window.history.pushState(null, '', path);
            }
          }}
          onSelectListing={handleSelectListing}
          onLogout={handleLogout}
          onExitToPublic={() => {
            setActiveView('home');
            if (typeof window !== 'undefined') {
              window.history.pushState(null, '', '/');
            }
          }}
        />

        {/* Publication / Edit Wizard in Dashboard */}
        {publishWizardOpen && (
          <PublishWizard
            currentUser={currentUser}
            editingListing={editingListing}
            onClose={() => {
              setPublishWizardOpen(false);
              setEditingListing(null);
            }}
            onSuccess={(savedListing) => {
              setPublishWizardOpen(false);
              setEditingListing(null);
              loadListings();
              handleSelectListing(savedListing);
            }}
            onUpgradeRequired={() => {
              setPublishWizardOpen(false);
              setEditingListing(null);
              showToast('Veuillez passer au Plan Pro pour ajouter plus d’annonces.');
            }}
          />
        )}
      </>
    );
  }

  // Public Experience (Home, Explorer, Favorites, Detail Page)
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '76px',
            right: '20px',
            zIndex: 140,
            backgroundColor: 'var(--color-primary)',
            color: '#ffffff',
            padding: '10px 18px',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.86rem',
            fontWeight: 600,
            border: '1px solid #10b981',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <i className="fa-solid fa-circle-check" style={{ color: '#10b981' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Public Top Navbar */}
      <Navbar
        currentUser={currentUser}
        activeView={activeView}
        onNavigate={handleNavigate}
        onOpenAuth={(mode) => {
          setAuthMode(mode || 'login');
          setPendingActionAfterAuth('dashboard');
          setAuthModalOpen(true);
        }}
        onOpenPublish={handleOpenPublish}
        onLogout={handleLogout}
      />

      {/* Main View Area */}
      <main className="public-page-wrapper" style={{ flex: 1 }}>
        {activeView === 'home' && (
          <>
            {/* Hero Section */}
            <ScrollReveal direction="up" delay={0.02}>
              <Hero onSearch={handleHeroSearch} />
            </ScrollReveal>

            {/* Popular / Latest Listings (Biens) */}
            <ScrollReveal direction="up" delay={0.06}>
              <ListingsSection
                listings={listings}
                onSelectListing={handleSelectListing}
                onViewAll={() => handleNavigate('explorer')}
              />
            </ScrollReveal>

            {/* Benin Cities (Localités / Villes) */}
            <ScrollReveal direction="up" delay={0.06}>
              <div id="section-villes">
                <LocationsSection onSelectCity={handleSelectCity} />
              </div>
            </ScrollReveal>

            {/* Categories Section */}
            <ScrollReveal direction="up" delay={0.06}>
              <CategoriesSection
                onSelectCategory={(catName) => handleNavigate('explorer', { propertyType: catName })}
                onViewAllCriteria={() => handleNavigate('explorer')}
              />
            </ScrollReveal>

            {/* Grayscale scrolling Partners (Partenaires) */}
            <ScrollReveal direction="up" delay={0.06}>
              <PartnersSection />
            </ScrollReveal>

            {/* Publication CTA */}
            <ScrollReveal direction="up" delay={0.06}>
              <CTASection
                onPublish={handleOpenPublish}
                onExplore={() => handleNavigate('explorer')}
              />
            </ScrollReveal>

            {/* Testimonials Section - Directly below CTASection as requested */}
            <ScrollReveal direction="up" delay={0.06}>
              <TestimonialsSection />
            </ScrollReveal>

            {/* FAQ Accordion */}
            <ScrollReveal direction="up" delay={0.06}>
              <FAQSection />
            </ScrollReveal>

            {/* Pricing Section */}
            <ScrollReveal direction="up" delay={0.06}>
              <div id="section-pricing">
                <PricingSection
                  currentPlan={currentUser?.plan}
                  onSelectPlan={handleSelectPlan}
                />
              </div>
            </ScrollReveal>
          </>
        )}

        {/* Dedicated Listing Detail Page */}
        {activeView === 'detail' && (
          selectedListing ? (
            <PropertyDetailPage
              listing={selectedListing}
              onBack={handleBackFromDetail}
            />
          ) : (
            <div
              style={{
                minHeight: '65vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                padding: '40px 20px',
              }}
            >
              <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2.4rem', color: 'var(--color-primary)' }} />
              <h3 style={{ fontSize: '1.2rem', color: 'var(--color-primary)', fontWeight: 800 }}>
                Chargement de l'annonce...
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem' }}>
                Récupération des détails et des photos vérifiées depuis le serveur
              </p>
            </div>
          )
        )}

        {activeView === 'explorer' && (
          <ExplorerView
            initialFilter={explorerFilters}
            listings={listings}
            onSelectListing={handleSelectListing}
            onOpenPublish={handleOpenPublish}
          />
        )}

        {activeView === 'favoris' && (
          <FavoritesView
            allListings={listings}
            onSelectListing={handleSelectListing}
            onExplore={() => handleNavigate('explorer')}
          />
        )}
      </main>

      {/* Public Footer */}
      <Footer onNavigate={handleNavigate} onOpenPublish={handleOpenPublish} />

      {/* Mobile Bottom Tab Bar (Visible only on mobile screens < 1024px, hidden on desktop) */}
      <MobileBottomNav
        activeView={activeView}
        onNavigate={handleNavigate}
        onOpenPublish={handleOpenPublish}
        onOpenAuth={() => {
          setAuthMode('login');
          setPendingActionAfterAuth('dashboard');
          setAuthModalOpen(true);
        }}
        isLoggedIn={!!currentUser}
      />

      {/* Auth Modal */}
      {authModalOpen && (
        <AuthModal
          isOpen={authModalOpen}
          initialMode={authMode}
          onClose={() => {
            setAuthModalOpen(false);
            setPendingActionAfterAuth(null);
          }}
          onLoginSuccess={handleAuthSuccess}
        />
      )}

      {/* Publication Wizard (When triggered in public context) */}
      {publishWizardOpen && (
        <PublishWizard
          currentUser={currentUser}
          editingListing={editingListing}
          onClose={() => {
            setPublishWizardOpen(false);
            setEditingListing(null);
          }}
          onSuccess={(savedListing) => {
            setPublishWizardOpen(false);
            setEditingListing(null);
            loadListings();
            handleSelectListing(savedListing);
          }}
          onUpgradeRequired={() => {
            setPublishWizardOpen(false);
            setEditingListing(null);
            showToast('Limite d’annonces atteinte pour votre plan.');
          }}
        />
      )}
    </div>
  );
}
