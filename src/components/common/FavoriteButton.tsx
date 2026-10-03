import React, { useState, useEffect } from 'react';
import { isListingFavorite, toggleFavorite } from '../../lib/favorites';

interface FavoriteButtonProps {
  listingId: string;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  baseLikes?: number;
  className?: string;
  onToggle?: (isFav: boolean) => void;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  listingId,
  size = 'md',
  showCount = false,
  baseLikes = 0,
  className = '',
  onToggle,
}) => {
  const [isFav, setIsFav] = useState(false);
  const [likes, setLikes] = useState(baseLikes);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    setIsFav(isListingFavorite(listingId));

    const handleCustomChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.listingId === listingId) {
        setIsFav(detail.isFavorite);
        setLikes((prev) => Math.max(0, prev + detail.delta));
      }
    };

    window.addEventListener('asukaimmo_favorite_changed', handleCustomChange);
    return () => {
      window.removeEventListener('asukaimmo_favorite_changed', handleCustomChange);
    };
  }, [listingId]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    setAnimating(true);
    const { isFavorite, delta } = toggleFavorite(listingId);
    setIsFav(isFavorite);
    setLikes((prev) => Math.max(0, prev + delta));
    if (onToggle) onToggle(isFavorite);

    setTimeout(() => setAnimating(false), 300);
  };

  const dimensions = {
    sm: { btn: '32px', icon: '0.85rem' },
    md: { btn: '40px', icon: '1.05rem' },
    lg: { btn: '48px', icon: '1.3rem' },
  }[size];

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      title={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      style={{
        width: showCount ? 'auto' : dimensions.btn,
        height: dimensions.btn,
        padding: showCount ? '0 12px' : 0,
        borderRadius: 'var(--radius-full)',
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(6px)',
        border: '1px solid rgba(5, 46, 29, 0.1)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        boxShadow: 'var(--shadow-sm)',
        color: isFav ? '#ef4444' : '#4b5e54',
        transform: animating ? 'scale(1.2)' : 'scale(1)',
        transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), color 0.15s ease, background 0.15s ease',
      }}
      className={className}
    >
      <i
        className={isFav ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}
        style={{
          fontSize: dimensions.icon,
          color: isFav ? '#ef4444' : '#4b5e54',
          transition: 'color 0.15s ease',
        }}
      />
      {showCount && (
        <span
          style={{
            fontSize: '0.85rem',
            fontWeight: 700,
            color: '#101c16',
          }}
        >
          {likes}
        </span>
      )}
    </button>
  );
};
