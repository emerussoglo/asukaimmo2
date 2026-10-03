import React, { useState, useEffect, useRef } from 'react';
import { Listing } from '../../types';
import { FavoriteButton } from '../common/FavoriteButton';

interface ListingCardProps {
  listing: Listing;
  onSelect: (listing: Listing) => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing, onSelect }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const mouseStartX = useRef<number | null>(null);
  const isDragging = useRef(false);
  const dragDistance = useRef(0);

  // Auto-cycle images every 3.8s when multiple images exist
  useEffect(() => {
    if (listing.images.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev === listing.images.length - 1 ? 0 : prev + 1));
    }, 3800);
    return () => clearInterval(timer);
  }, [listing.images.length, isPaused]);

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? listing.images.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === listing.images.length - 1 ? 0 : prev + 1));
  };

  // Touch Swipe (Mobile)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current !== null) {
      const diff = e.changedTouches[0].clientX - touchStartX.current;
      if (Math.abs(diff) > 35) {
        if (diff > 0) {
          setCurrentImageIndex((prev) => (prev === 0 ? listing.images.length - 1 : prev - 1));
        } else {
          setCurrentImageIndex((prev) => (prev === listing.images.length - 1 ? 0 : prev + 1));
        }
      }
    }
    touchStartX.current = null;
    setIsPaused(false);
  };

  // Mouse Drag (Desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
    mouseStartX.current = e.clientX;
    isDragging.current = true;
    dragDistance.current = 0;
    setIsPaused(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current && mouseStartX.current !== null) {
      dragDistance.current = Math.abs(e.clientX - mouseStartX.current);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isDragging.current && mouseStartX.current !== null) {
      const diff = e.clientX - mouseStartX.current;
      if (Math.abs(diff) > 40) {
        e.stopPropagation();
        if (diff > 0) {
          setCurrentImageIndex((prev) => (prev === 0 ? listing.images.length - 1 : prev - 1));
        } else {
          setCurrentImageIndex((prev) => (prev === listing.images.length - 1 ? 0 : prev + 1));
        }
      }
    }
    isDragging.current = false;
    mouseStartX.current = null;
    setIsPaused(false);
  };

  const handleCardClick = () => {
    // Avoid triggering card selection if user was dragging
    if (dragDistance.current > 10) return;
    onSelect(listing);
  };

  return (
    <article
      className="card hover-lift"
      onClick={handleCardClick}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        userSelect: 'none',
      }}
    >
      {/* Image Container with Slider & Badges */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 11',
          overflow: 'hidden',
          backgroundColor: '#e5e7eb',
        }}
      >
        <img
          src={listing.images[currentImageIndex] || listing.images[0]}
          alt={listing.title}
          loading="lazy"
          draggable={false}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.4s ease, opacity 0.25s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        />

        {/* Top Badges */}
        <div
          style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            zIndex: 2,
          }}
        >
          <span
            className={`badge ${listing.transactionType === 'RENT' ? 'badge-rent' : 'badge-sale'}`}
            style={{ fontSize: '0.62rem', padding: '2px 6px' }}
          >
            {listing.transactionType === 'RENT' ? 'Location' : 'Vente'}
          </span>

          {listing.isSponsored && (
            <span className="badge badge-sponsored" style={{ fontSize: '0.62rem', padding: '2px 6px' }}>
              <i className="fa-solid fa-bolt" style={{ fontSize: '0.55rem' }} />
              <span>Sponsorisé</span>
            </span>
          )}

          {listing.propertyType && (
            <span
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.92)',
                color: 'var(--color-primary)',
                fontSize: '0.64rem',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 'var(--radius-full)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
              }}
            >
              {listing.propertyType}
            </span>
          )}
        </div>

        {/* Top Right: Favorite Button */}
        <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 3 }}>
          <FavoriteButton
            listingId={listing.id}
            baseLikes={listing.likesCount}
            showCount={false}
            size="sm"
          />
        </div>

        {/* Image Slider Controls (if multiple images) */}
        {listing.images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrevImage}
              aria-label="Image précédente"
              style={{
                position: 'absolute',
                left: '6px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.68rem',
                color: 'var(--color-primary)',
                boxShadow: 'var(--shadow-sm)',
                zIndex: 2,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <i className="fa-solid fa-chevron-left" />
            </button>
            <button
              type="button"
              onClick={handleNextImage}
              aria-label="Image suivante"
              style={{
                position: 'absolute',
                right: '6px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.68rem',
                color: 'var(--color-primary)',
                boxShadow: 'var(--shadow-sm)',
                zIndex: 2,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <i className="fa-solid fa-chevron-right" />
            </button>

            {/* Dots Indicator */}
            <div
              style={{
                position: 'absolute',
                bottom: '6px',
                left: '0',
                right: '0',
                display: 'flex',
                justifyContent: 'center',
                gap: '3px',
                zIndex: 2,
              }}
            >
              {listing.images.slice(0, 5).map((_, idx) => (
                <span
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(idx);
                  }}
                  style={{
                    width: currentImageIndex === idx ? '10px' : '4px',
                    height: '4px',
                    borderRadius: '2px',
                    backgroundColor: currentImageIndex === idx ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
                    transition: 'all 0.25s ease',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Card Content Details */}
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Price Row */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '3px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '2px' }}>
            <span
              style={{
                fontSize: 'clamp(0.82rem, 1.05vw, 0.94rem)',
                fontWeight: 800,
                color: 'var(--color-primary)',
                letterSpacing: '-0.02em',
                whiteSpace: 'nowrap',
              }}
            >
              {listing.price.toLocaleString('fr-FR')} FCFA
            </span>
            {listing.transactionType === 'RENT' && listing.priceUnit && listing.priceUnit !== 'total' && (
              <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                {listing.priceUnit}
              </span>
            )}
          </div>

          {listing.distanceKm !== undefined && (
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 600,
                color: 'var(--color-secondary-blue)',
                backgroundColor: 'var(--color-secondary-blue-subtle)',
                padding: '1px 5px',
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                whiteSpace: 'nowrap',
              }}
            >
              <i className="fa-solid fa-location-arrow" style={{ fontSize: '0.55rem' }} />
              <span>{listing.distanceKm} km</span>
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: 'clamp(0.74rem, 0.9vw, 0.82rem)',
            fontWeight: 700,
            color: 'var(--color-text)',
            lineHeight: 1.25,
            marginBottom: '3px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
          title={listing.title}
        >
          {listing.title}
        </h3>

        {/* Location line */}
        <p
          style={{
            fontSize: '0.70rem',
            color: 'var(--color-text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginBottom: '8px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          <i className="fa-solid fa-location-dot" style={{ color: 'var(--color-secondary-blue)', fontSize: '0.68rem', flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{listing.neighborhood}, {listing.city}</span>
        </p>

        {/* Key Features Specs */}
        <div
          style={{
            marginTop: 'auto',
            paddingTop: '8px',
            borderTop: '1px solid var(--color-border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.74rem',
            color: 'var(--color-text-secondary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {listing.bedrooms > 0 && (
              <span title={`${listing.bedrooms} chambres`} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <i className="fa-solid fa-bed" style={{ color: 'var(--color-primary)', fontSize: '0.68rem' }} />
                <span>{listing.bedrooms}</span>
              </span>
            )}

            {listing.bathrooms > 0 && (
              <span title={`${listing.bathrooms} salles d’eau`} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <i className="fa-solid fa-bath" style={{ color: 'var(--color-primary)', fontSize: '0.68rem' }} />
                <span>{listing.bathrooms}</span>
              </span>
            )}

            {listing.surface > 0 && (
              <span title={`Superficie ${listing.surface} m²`} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <i className="fa-solid fa-expand" style={{ color: 'var(--color-primary)', fontSize: '0.68rem' }} />
                <span>{listing.surface}m²</span>
              </span>
            )}
          </div>

          {/* Owner verification indicator */}
          {listing.isOwnerVerified && (
            <span
              title="Annonceur vérifié ASUKAIMMO"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                color: 'var(--color-accent-hover)',
                fontWeight: 600,
                fontSize: '0.68rem',
              }}
            >
              <i className="fa-solid fa-circle-check" />
              <span>Vérifié</span>
            </span>
          )}
        </div>
      </div>
    </article>
  );
};
