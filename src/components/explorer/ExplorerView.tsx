import React, { useState, useMemo, useEffect } from 'react';
import { FilterState, Listing, PropertyType, TransactionType } from '../../types';
import { ListingCard } from '../listings/ListingCard';
import { sortByDistance } from '../../lib/geo';

interface ExplorerViewProps {
  initialFilter?: Partial<FilterState>;
  listings: Listing[];
  onSelectListing: (listing: Listing) => void;
  onOpenPublish: () => void;
}

export const ExplorerView: React.FC<ExplorerViewProps> = ({
  initialFilter = {},
  listings,
  onSelectListing,
  onOpenPublish,
}) => {
  const [filterState, setFilterState] = useState<FilterState>({
    keyword: initialFilter.keyword || '',
    city: initialFilter.city || '',
    country: initialFilter.country,
    transactionType: initialFilter.transactionType || 'ALL',
    propertyType: initialFilter.propertyType || 'ALL',
    minPrice: initialFilter.minPrice || 0,
    maxPrice: initialFilter.maxPrice || 0,
    bedrooms: initialFilter.bedrooms || 'ALL',
    bathrooms: initialFilter.bathrooms || 'ALL',
    features: initialFilter.features || [],
    sortBy: initialFilter.sortBy || 'recent',
    userCoords: initialFilter.userCoords,
  });

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    setFilterState((prev) => ({
      ...prev,
      ...initialFilter,
    }));
  }, [initialFilter]);

  // Filter listings
  const filteredListings = useMemo(() => {
    let result = listings.filter((item) => {
      // Keyword
      if (filterState.keyword) {
        const kw = filterState.keyword.toLowerCase().trim();
        const matchesTitle = item.title?.toLowerCase().includes(kw);
        const matchesDesc = item.description?.toLowerCase().includes(kw);
        const matchesNeigh = item.neighborhood?.toLowerCase().includes(kw);
        const matchesCity = item.city?.toLowerCase().includes(kw);
        const matchesProp = item.propertyType?.toLowerCase().includes(kw);
        if (!matchesTitle && !matchesDesc && !matchesNeigh && !matchesCity && !matchesProp) return false;
      }

      // Country
      if (filterState.country && item.country?.toLowerCase() !== filterState.country.toLowerCase()) {
        return false;
      }

      // City
      if (filterState.city && item.city?.toLowerCase() !== filterState.city.toLowerCase()) {
        return false;
      }

      // Transaction type
      if (filterState.transactionType !== 'ALL' && item.transactionType !== filterState.transactionType) {
        return false;
      }

      // Property type
      if (filterState.propertyType !== 'ALL' && item.propertyType !== filterState.propertyType) {
        return false;
      }

      // Price
      if (filterState.minPrice > 0 && item.price < filterState.minPrice) return false;
      if (filterState.maxPrice > 0 && item.price > filterState.maxPrice) return false;

      // Bedrooms
      if (filterState.bedrooms !== 'ALL' && (item.bedrooms || 0) < Number(filterState.bedrooms)) return false;

      // Bathrooms
      if (filterState.bathrooms !== 'ALL' && (item.bathrooms || 0) < Number(filterState.bathrooms)) return false;

      return true;
    });

    // Sorting
    if (filterState.sortBy === 'price_asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (filterState.sortBy === 'price_desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (filterState.sortBy === 'popular') {
      result.sort((a, b) => (b.likesCount || 0) + (b.viewsCount || 0) - ((a.likesCount || 0) + (a.viewsCount || 0)));
    } else if (filterState.sortBy === 'distance' && filterState.userCoords) {
      result = sortByDistance(result, filterState.userCoords);
    } else {
      // Recent default
      result.sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
    }

    return result;
  }, [listings, filterState]);

  const handleResetFilters = () => {
    setFilterState({
      keyword: '',
      city: '',
      transactionType: 'ALL',
      propertyType: 'ALL',
      minPrice: 0,
      maxPrice: 0,
      bedrooms: 'ALL',
      bathrooms: 'ALL',
      features: [],
      sortBy: 'recent',
      userCoords: undefined,
    });
  };

  const propertyTypes: PropertyType[] = [
    'Appartement',
    'Studio',
    'Maison',
    'Villa',
    'Chambre',
    'Chambre-salon',
    'Meublé',
    'Résidence',
    'Terrain',
    'Bureau',
    'Boutique',
    'Immeuble',
    'Place de fête',
    'Hôtel',
    'Salle de conférence',
  ];

  const hasActiveFilters = Boolean(
    filterState.keyword ||
    filterState.city ||
    filterState.transactionType !== 'ALL' ||
    filterState.propertyType !== 'ALL' ||
    filterState.maxPrice > 0 ||
    filterState.minPrice > 0 ||
    filterState.bedrooms !== 'ALL'
  );

  return (
    <div style={{ backgroundColor: 'var(--color-bg)', minHeight: '85vh', padding: '28px 0 60px' }}>
      <div className="container">
        {/* Breadcrumb & Header */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
            <span>ASUKAIMMO</span> <span style={{ margin: '0 4px' }}>/</span> <span>Explorer les annonces</span>
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: 'clamp(1.2rem, 2.2vw, 1.55rem)',
                  fontWeight: 800,
                  color: 'var(--color-primary)',
                  letterSpacing: '-0.02em',
                }}
              >
                {filterState.city ? `Biens immobiliers à ${filterState.city}` : 'Toutes les annonces au Bénin'}
              </h1>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.82rem', marginTop: '2px' }}>
                {filteredListings.length} bien{filteredListings.length > 1 ? 's' : ''} disponible{filteredListings.length > 1 ? 's' : ''}
              </p>
            </div>

            {/* Mobile Filter Button */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setMobileFilterOpen(true)}
                className="btn btn-secondary btn-sm"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#ffffff',
                }}
              >
                <i className="fa-solid fa-sliders" style={{ color: 'var(--color-primary)' }} />
                <span>Filtres {hasActiveFilters && '•'}</span>
              </button>

              <button
                onClick={onOpenPublish}
                className="btn btn-primary btn-sm"
                style={{ gap: '6px' }}
              >
                <i className="fa-solid fa-plus" />
                <span>Publier</span>
              </button>
            </div>
          </div>
        </div>

        {/* Layout: Sidebar + Grid */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '24px',
            width: '100%',
          }}
        >
          {/* Desktop Filter Sidebar */}
          <aside
            style={{
              width: '280px',
              flexShrink: 0,
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              padding: '20px',
              boxShadow: 'var(--shadow-xs)',
              position: 'sticky',
              top: '80px',
            }}
            className="desktop-only-block"
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '14px',
                borderBottom: '1px solid var(--color-border-subtle)',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-filter" style={{ color: 'var(--color-primary)', fontSize: '0.9rem' }} />
                <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
                  Filtres
                </h3>
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  style={{
                    fontSize: '0.76rem',
                    color: 'var(--color-secondary-blue)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                  }}
                >
                  Réinitialiser
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Keyword Input */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '5px' }}>
                  Mot-clé ou Quartier
                </label>
                <div style={{ position: 'relative' }}>
                  <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.76rem', color: 'var(--color-text-muted)' }} />
                  <input
                    type="text"
                    value={filterState.keyword}
                    onChange={(e) => setFilterState({ ...filterState, keyword: e.target.value })}
                    placeholder="Ex : Haie Vive, piscine..."
                    style={{
                      width: '100%',
                      padding: '8px 10px 8px 30px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border)',
                      fontSize: '0.84rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Transaction Type */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '5px' }}>
                  Transaction
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', backgroundColor: 'var(--color-bg)', padding: '3px', borderRadius: 'var(--radius-sm)' }}>
                  {[
                    { id: 'ALL', label: 'Tout' },
                    { id: 'RENT', label: 'À louer' },
                    { id: 'SALE', label: 'À vendre' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setFilterState({ ...filterState, transactionType: t.id as any })}
                      style={{
                        padding: '6px 2px',
                        borderRadius: 'var(--radius-xs)',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        textAlign: 'center',
                        backgroundColor: filterState.transactionType === t.id ? '#ffffff' : 'transparent',
                        color: filterState.transactionType === t.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                        boxShadow: filterState.transactionType === t.id ? 'var(--shadow-xs)' : 'none',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ville */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '5px' }}>
                  Ville / Commune
                </label>
                <select
                  value={filterState.city}
                  onChange={(e) => setFilterState({ ...filterState, city: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.84rem',
                    backgroundColor: '#ffffff',
                    outline: 'none',
                  }}
                >
                  <option value="">Toutes les villes</option>
                  <option value="Cotonou">Cotonou</option>
                  <option value="Abomey-Calavi">Abomey-Calavi</option>
                  <option value="Porto-Novo">Porto-Novo</option>
                  <option value="Ouidah">Ouidah</option>
                  <option value="Parakou">Parakou</option>
                  <option value="Bohicon">Bohicon</option>
                </select>
              </div>

              {/* Type de bien */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '5px' }}>
                  Catégorie de bien
                </label>
                <select
                  value={filterState.propertyType}
                  onChange={(e) => setFilterState({ ...filterState, propertyType: e.target.value as any })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.84rem',
                    backgroundColor: '#ffffff',
                    outline: 'none',
                  }}
                >
                  <option value="ALL">Tous les types</option>
                  {propertyTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Budget Max */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '5px' }}>
                  Budget max (FCFA)
                </label>
                <input
                  type="number"
                  value={filterState.maxPrice || ''}
                  onChange={(e) =>
                    setFilterState({
                      ...filterState,
                      maxPrice: e.target.value ? Number(e.target.value) : 0,
                    })
                  }
                  placeholder="Ex : 250000"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.84rem',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Chambres */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '5px' }}>
                  Chambres minimum
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' }}>
                  {['ALL', 1, 2, 3, 4].map((num) => (
                    <button
                      key={String(num)}
                      type="button"
                      onClick={() => setFilterState({ ...filterState, bedrooms: num as any })}
                      style={{
                        padding: '6px 2px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        backgroundColor: filterState.bedrooms === num ? 'var(--color-primary)' : 'var(--color-bg)',
                        color: filterState.bedrooms === num ? '#ffffff' : 'var(--color-text)',
                        border: '1px solid var(--color-border)',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      {num === 'ALL' ? 'Tous' : `${num}+`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Listings Results Grid */}
          <main style={{ flex: 1, minWidth: 0, width: '100%' }}>
            {/* Sort & Quick Controls Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
                marginBottom: '16px',
                padding: '10px 14px',
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-text)' }}>
                <span>{filteredListings.length} bien{filteredListings.length > 1 ? 's' : ''} trouvé{filteredListings.length > 1 ? 's' : ''}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Trier par :</span>
                <select
                  value={filterState.sortBy}
                  onChange={(e) => setFilterState({ ...filterState, sortBy: e.target.value as any })}
                  style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '4px 8px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: 'var(--color-primary)',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <option value="recent">Plus récentes</option>
                  <option value="price_asc">Prix croissant</option>
                  <option value="price_desc">Prix décroissant</option>
                  <option value="popular">Plus populaires</option>
                  {filterState.userCoords && <option value="distance">Plus proches</option>}
                </select>
              </div>
            </div>

            {/* Results Grid */}
            {filteredListings.length === 0 ? (
              <div
                style={{
                  padding: '60px 20px',
                  backgroundColor: '#ffffff',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px dashed var(--color-border)',
                  textAlign: 'center',
                }}
              >
                <i className="fa-solid fa-filter-circle-xmark" style={{ fontSize: '2.5rem', color: 'var(--color-text-muted)', marginBottom: '14px' }} />
                <h3 style={{ fontSize: '1.15rem', color: 'var(--color-primary)', marginBottom: '6px' }}>
                  Aucun bien ne correspond à vos critères
                </h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', maxWidth: '380px', marginInline: 'auto', marginBottom: '18px' }}>
                  Essayez de modifier votre ville, d'augmenter le budget max ou de réinitialiser vos filtres.
                </p>
                <button type="button" onClick={handleResetFilters} className="btn btn-primary btn-sm">
                  Réinitialiser tous les filtres
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: '14px',
                }}
                className="explorer-grid"
              >
                {filteredListings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    onSelect={onSelectListing}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filters Modal */}
      {mobileFilterOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 140,
            backgroundColor: 'rgba(5, 46, 29, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
          onClick={() => setMobileFilterOpen(false)}
        >
          <div
            style={{
              width: '88%',
              maxWidth: '360px',
              height: '100%',
              backgroundColor: '#ffffff',
              padding: '20px',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-xl)',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                Filtres de recherche
              </h3>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'var(--color-bg)',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  border: 'none',
                }}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
              {/* Keyword */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '5px' }}>
                  Mot-clé ou Quartier
                </label>
                <input
                  type="text"
                  value={filterState.keyword}
                  onChange={(e) => setFilterState({ ...filterState, keyword: e.target.value })}
                  placeholder="Ex : Haie Vive, meublé..."
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.85rem' }}
                />
              </div>

              {/* Transaction */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '5px' }}>
                  Transaction
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                  {['ALL', 'RENT', 'SALE'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFilterState({ ...filterState, transactionType: t as any })}
                      style={{
                        padding: '8px 4px',
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        backgroundColor: filterState.transactionType === t ? 'var(--color-primary)' : 'var(--color-bg)',
                        color: filterState.transactionType === t ? '#ffffff' : 'var(--color-text)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      {t === 'ALL' ? 'Tout' : t === 'RENT' ? 'À louer' : 'À vendre'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ville */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '5px' }}>
                  Ville
                </label>
                <select
                  value={filterState.city}
                  onChange={(e) => setFilterState({ ...filterState, city: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.85rem' }}
                >
                  <option value="">Toutes les villes</option>
                  <option value="Cotonou">Cotonou</option>
                  <option value="Abomey-Calavi">Abomey-Calavi</option>
                  <option value="Porto-Novo">Porto-Novo</option>
                  <option value="Ouidah">Ouidah</option>
                  <option value="Parakou">Parakou</option>
                  <option value="Bohicon">Bohicon</option>
                </select>
              </div>

              {/* Catégorie */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '5px' }}>
                  Catégorie de bien
                </label>
                <select
                  value={filterState.propertyType}
                  onChange={(e) => setFilterState({ ...filterState, propertyType: e.target.value as any })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.85rem' }}
                >
                  <option value="ALL">Tous les types</option>
                  {propertyTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Budget */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '5px' }}>
                  Budget maximum (FCFA)
                </label>
                <input
                  type="number"
                  value={filterState.maxPrice || ''}
                  onChange={(e) =>
                    setFilterState({
                      ...filterState,
                      maxPrice: e.target.value ? Number(e.target.value) : 0,
                    })
                  }
                  placeholder="Ex : 200000"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.85rem' }}
                />
              </div>

              {/* Chambres */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '5px' }}>
                  Chambres minimum
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' }}>
                  {['ALL', 1, 2, 3, 4].map((num) => (
                    <button
                      key={String(num)}
                      type="button"
                      onClick={() => setFilterState({ ...filterState, bedrooms: num as any })}
                      style={{
                        padding: '6px 2px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        backgroundColor: filterState.bedrooms === num ? 'var(--color-primary)' : 'var(--color-bg)',
                        color: filterState.bedrooms === num ? '#ffffff' : 'var(--color-text)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      {num === 'ALL' ? 'Tous' : `${num}+`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-md)' }}
              >
                Voir les {filteredListings.length} résultats
              </button>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%' }}
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .explorer-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 10px !important;
          }
        }
      `}</style>
    </div>
  );
};
