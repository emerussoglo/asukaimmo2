import React, { useState, useEffect } from 'react';
import { Listing } from '../../types';
import { FavoriteButton } from '../common/FavoriteButton';

interface PropertyDetailPageProps {
  listing: Listing;
  onBack: () => void;
}

export const PropertyDetailPage: React.FC<PropertyDetailPageProps> = ({
  listing,
  onBack,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [revealedPhone, setRevealedPhone] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  // Keyboard navigation support for gallery
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (fullscreenOpen) setFullscreenOpen(false);
      } else if (e.key === 'ArrowRight') {
        setActiveImageIndex((prev) => (prev + 1) % listing.images.length);
      } else if (e.key === 'ArrowLeft') {
        setActiveImageIndex((prev) => (prev === 0 ? listing.images.length - 1 : prev - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [listing, fullscreenOpen]);

  const handleShare = () => {
    const fullUrl = `${window.location.origin}/annonces/${listing.slug || listing.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullUrl);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2400);
    }
  };

  const handleWhatsApp = () => {
    const rawNumber = listing.ownerWhatsapp || listing.ownerPhone;
    const cleanNumber = rawNumber.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Bonjour, je vous contacte depuis ASUKAIMMO au sujet de votre bien : "${listing.title}" (${listing.price.toLocaleString('fr-FR')} FCFA). Est-il toujours disponible ?`
    );
    window.open(`https://wa.me/${cleanNumber}?text=${message}`, '_blank');
  };

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '85vh', padding: '24px 0 60px' }}>
      <div className="container">
        {/* Navigation Bar / Breadcrumb */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <button
            onClick={onBack}
            className="btn btn-secondary btn-sm"
            style={{ gap: '6px', fontWeight: 700, color: 'var(--color-primary)' }}
          >
            <i className="fa-solid fa-arrow-left" />
            <span>Retour aux annonces</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleShare}
              className="btn btn-secondary btn-sm"
              style={{ gap: '6px' }}
            >
              <i className="fa-solid fa-share-nodes" style={{ color: 'var(--color-secondary-blue)' }} />
              <span>{copiedShare ? 'Lien copié !' : 'Partager'}</span>
            </button>

            <FavoriteButton
              listingId={listing.id}
              baseLikes={listing.likesCount}
              showCount={true}
              size="sm"
            />
          </div>
        </div>

        {/* Gallery Section - Refined & Compact Proportions */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: listing.images.length > 1 ? '1.8fr 1fr' : '1fr',
            gap: '10px',
            height: 'clamp(260px, 40vh, 420px)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            marginBottom: '28px',
            position: 'relative',
          }}
        >
          {/* Main Large Image */}
          <div
            style={{
              position: 'relative',
              height: '100%',
              cursor: 'pointer',
              overflow: 'hidden',
            }}
            onClick={() => setFullscreenOpen(true)}
          >
            <img
              src={listing.images[activeImageIndex] || listing.images[0]}
              alt={listing.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.3s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            />

            {/* Left / Right arrows directly on main image */}
            {listing.images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIndex((prev) => (prev === 0 ? listing.images.length - 1 : prev - 1));
                  }}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    color: 'var(--color-primary)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <i className="fa-solid fa-chevron-left" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIndex((prev) => (prev + 1) % listing.images.length);
                  }}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    color: 'var(--color-primary)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <i className="fa-solid fa-chevron-right" />
                </button>
              </>
            )}
          </div>

          {/* Secondary Thumbnail Tiles */}
          {listing.images.length > 1 && (
            <div
              style={{
                display: 'grid',
                gridTemplateRows: listing.images.length > 2 ? '1fr 1fr' : '1fr',
                gap: '10px',
                height: '100%',
              }}
            >
              {listing.images.slice(1, 3).map((img, idx) => (
                <div
                  key={idx}
                  style={{
                    height: '100%',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                  onClick={() => {
                    setActiveImageIndex(idx + 1);
                    setFullscreenOpen(true);
                  }}
                >
                  <img
                    src={img}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.3s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Fullscreen Button */}
          <button
            onClick={() => setFullscreenOpen(true)}
            style={{
              position: 'absolute',
              bottom: '12px',
              right: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              color: 'var(--color-primary)',
              fontWeight: 700,
              fontSize: '0.78rem',
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid var(--color-border)',
            }}
          >
            <i className="fa-solid fa-images" />
            <span>Toutes les photos ({listing.images.length})</span>
          </button>
        </div>

        {/* Two-Column Information Layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) clamp(280px, 32%, 360px)',
            gap: '32px',
          }}
          className="detail-page-grid"
        >
          {/* Left Column: Property Details */}
          <div>
            {/* Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
              <span className={`badge ${listing.transactionType === 'RENT' ? 'badge-rent' : 'badge-sale'}`}>
                {listing.transactionType === 'RENT' ? 'À louer' : 'À vendre'}
              </span>
              <span className="badge badge-secondary">
                {listing.propertyType}
              </span>
              {listing.isSponsored && (
                <span className="badge badge-sponsored">
                  <i className="fa-solid fa-bolt" />
                  <span>Sponsorisé</span>
                </span>
              )}
            </div>

            {/* Title - Reasonable proportion */}
            <h1
              style={{
                fontSize: 'clamp(1.3rem, 2.2vw, 1.7rem)',
                fontWeight: 800,
                color: 'var(--color-primary)',
                lineHeight: 1.25,
                marginBottom: '6px',
              }}
            >
              {listing.title}
            </h1>

            {/* Location */}
            <p
              style={{
                fontSize: '0.88rem',
                color: 'var(--color-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '18px',
              }}
            >
              <i className="fa-solid fa-location-dot" style={{ color: 'var(--color-secondary-blue)' }} />
              <span>{listing.address || `${listing.neighborhood}, ${listing.city}`}</span>
            </p>

            {/* Price Box - Compact & Clear */}
            <div
              style={{
                padding: '12px 18px',
                backgroundColor: 'var(--color-bg)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'baseline',
                gap: '6px',
                marginBottom: '24px',
              }}
            >
              <span
                style={{
                  fontSize: '1.6rem',
                  fontWeight: 800,
                  color: 'var(--color-primary)',
                  letterSpacing: '-0.02em',
                }}
              >
                {listing.price.toLocaleString('fr-FR')} FCFA
              </span>
              <span style={{ fontSize: '0.86rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                {listing.transactionType === 'RENT' ? listing.priceUnit : 'Prix total'}
              </span>
            </div>

            {/* Key Specs Row */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
                Caractéristiques principales
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                  gap: '10px',
                }}
              >
                {[
                  ...(listing.propertyType !== 'Terrain' && listing.propertyType !== 'Place de fête' && listing.propertyType !== 'Salle de conférence' ? [
                    { icon: 'fa-bed', label: 'Chambres', value: listing.bedrooms || '1' },
                  ] : []),
                  ...(listing.propertyType !== 'Terrain' ? [
                    { icon: 'fa-bath', label: 'Salles d’eau', value: listing.bathrooms || '1' },
                  ] : []),
                  { icon: 'fa-expand', label: listing.propertyType === 'Terrain' ? 'Superficie' : 'Surface', value: `${listing.surface} m²` },
                  { icon: 'fa-circle-check', label: 'Disponibilité', value: 'Immédiate' },
                ].map((spec, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '10px 8px',
                      backgroundColor: '#ffffff',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border)',
                      textAlign: 'center',
                    }}
                  >
                    <i className={`fa-solid ${spec.icon}`} style={{ color: 'var(--color-secondary-blue)', fontSize: '1rem', marginBottom: '4px', display: 'block' }} />
                    <span style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--color-primary)', display: 'block' }}>
                      {spec.value}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                      {spec.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                Description du logement
              </h3>
              <p style={{ color: 'var(--color-text)', lineHeight: 1.6, fontSize: '0.9rem' }}>
                {listing.description}
              </p>
            </div>

            {/* Equipements */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
                Ce que propose ce logement
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: '10px',
                }}
              >
                {listing.features.map((feat, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      backgroundColor: 'var(--color-bg)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      color: 'var(--color-text)',
                      border: '1px solid var(--color-border-subtle)',
                    }}
                  >
                    <i className="fa-solid fa-check" style={{ color: 'var(--color-accent)', fontSize: '0.8rem' }} />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Advertiser Sidebar */}
          <div>
            <div
              style={{
                position: 'sticky',
                top: '80px',
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                padding: '20px',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {/* Advertiser Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-primary)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1rem',
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}
                >
                  {listing.ownerAvatar ? (
                    <img src={listing.ownerAvatar} alt={listing.ownerName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    listing.ownerName.slice(0, 2).toUpperCase()
                  )}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                      {listing.ownerName}
                    </h4>
                    {listing.isOwnerVerified && (
                      <i className="fa-solid fa-circle-check" style={{ color: 'var(--color-accent)', fontSize: '0.8rem' }} />
                    )}
                  </div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', display: 'block' }}>
                    {listing.ownerRole || 'Annonceur vérifié'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-accent-hover)', fontWeight: 600 }}>
                      Annonceur en ligne
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {/* WhatsApp */}
                <button
                  type="button"
                  onClick={handleWhatsApp}
                  className="btn"
                  style={{
                    backgroundColor: '#25D366',
                    color: '#ffffff',
                    width: '100%',
                    padding: '10px',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                  }}
                >
                  <i className="fa-brands fa-whatsapp" style={{ fontSize: '1.1rem' }} />
                  <span>Contacter sur WhatsApp</span>
                </button>

                {/* Telephone */}
                <button
                  type="button"
                  onClick={() => setRevealedPhone(!revealedPhone)}
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', padding: '9px', fontWeight: 600 }}
                >
                  <i className="fa-solid fa-phone" style={{ color: 'var(--color-secondary-blue)' }} />
                  <span>{revealedPhone ? listing.ownerPhone : 'Afficher le téléphone'}</span>
                </button>

                {revealedPhone && (
                  <a
                    href={`tel:${listing.ownerPhone}`}
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%', padding: '8px' }}
                  >
                    <i className="fa-solid fa-phone-volume" />
                    <span>Appeler l'annonceur</span>
                  </a>
                )}
              </div>

              {/* Safety notice */}
              <div
                style={{
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fef3c7',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 12px',
                  fontSize: '0.74rem',
                  lineHeight: 1.4,
                  color: '#92400e',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 800, marginBottom: '3px' }}>
                  <i className="fa-solid fa-shield-halved" />
                  <span>Conseil de sécurité</span>
                </div>
                Ne versez aucun acompte avant visite physique et vérification des titres de propriété.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {fullscreenOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 150,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '16px',
            animation: 'fadeIn 0.2s ease',
          }}
          onClick={() => setFullscreenOpen(false)}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#ffffff' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              Photo {activeImageIndex + 1} sur {listing.images.length}
            </span>
            <button
              onClick={() => setFullscreenOpen(false)}
              style={{ color: '#ffffff', fontSize: '1.25rem', padding: '6px', cursor: 'pointer' }}
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>

          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              padding: '16px 0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={listing.images[activeImageIndex]}
              alt=""
              style={{
                maxWidth: '92vw',
                maxHeight: '78vh',
                objectFit: 'contain',
                borderRadius: '6px',
              }}
            />

            <button
              onClick={() =>
                setActiveImageIndex((prev) => (prev === 0 ? listing.images.length - 1 : prev - 1))
              }
              style={{
                position: 'absolute',
                left: '16px',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                cursor: 'pointer',
              }}
            >
              <i className="fa-solid fa-chevron-left" />
            </button>

            <button
              onClick={() =>
                setActiveImageIndex((prev) => (prev + 1) % listing.images.length)
              }
              style={{
                position: 'absolute',
                right: '16px',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                cursor: 'pointer',
              }}
            >
              <i className="fa-solid fa-chevron-right" />
            </button>
          </div>

          {/* Thumbnails row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '6px',
              overflowX: 'auto',
              paddingTop: '8px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {listing.images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt=""
                onClick={() => setActiveImageIndex(idx)}
                style={{
                  width: '54px',
                  height: '38px',
                  objectFit: 'cover',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  border: activeImageIndex === idx ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.3)',
                  opacity: activeImageIndex === idx ? 1 : 0.6,
                }}
              />
            ))}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 820px) {
          .detail-page-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
