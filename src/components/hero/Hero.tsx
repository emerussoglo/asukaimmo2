import React, { useState } from 'react';
import { PropertyType, TransactionType } from '../../types';
import { parseNaturalLanguageQuery } from '../../lib/aiSearch';

interface HeroProps {
  onSearch: (params: {
    city?: string;
    keyword?: string;
    transactionType?: TransactionType;
    propertyType?: PropertyType | 'ALL';
    maxPrice?: number;
    userCoords?: { latitude: number; longitude: number };
    aiExplanation?: string;
  }) => void;
}

export const Hero: React.FC<HeroProps> = ({ onSearch }) => {
  const [activeTab, setActiveTab] = useState<'RENT' | 'SALE' | 'AI'>('RENT');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedType, setSelectedType] = useState<PropertyType | 'ALL'>('ALL');
  const [selectedBudget, setSelectedBudget] = useState<number | ''>('');
  const [isLocating, setIsLocating] = useState(false);
  const [geoCoords, setGeoCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [geoNotice, setGeoNotice] = useState<string | null>(null);

  // AI Search prompt
  const [aiPrompt, setAiPrompt] = useState('Appartement 2 chambres à Cotonou moins de 150 000 FCFA');

  const budgetOptionsRent = [
    { label: 'Tous les budgets', value: '' },
    { label: 'Jusqu’à 60 000 FCFA', value: 60000 },
    { label: 'Jusqu’à 100 000 FCFA', value: 100000 },
    { label: 'Jusqu’à 200 000 FCFA', value: 200000 },
    { label: 'Jusqu’à 350 000 FCFA', value: 350000 },
    { label: 'Jusqu’à 600 000 FCFA', value: 600000 },
    { label: 'Plus de 1 000 000 FCFA', value: 1500000 },
  ];

  const budgetOptionsSale = [
    { label: 'Tous les budgets', value: '' },
    { label: 'Jusqu’à 15 000 000 FCFA', value: 15000000 },
    { label: 'Jusqu’à 30 000 000 FCFA', value: 30000000 },
    { label: 'Jusqu’à 50 000 000 FCFA', value: 50000000 },
    { label: 'Jusqu’à 100 000 000 FCFA', value: 100000000 },
    { label: 'Plus de 100 000 000 FCFA', value: 250000000 },
  ];

  const handleUseCurrentPosition = () => {
    if (!navigator.geolocation) {
      setGeoNotice('La géolocalisation n’est pas supportée par votre navigateur.');
      return;
    }

    setIsLocating(true);
    setGeoNotice(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setGeoCoords(coords);
        setGeoNotice('Position GPS activée. Recherche des biens proches...');
        onSearch({
          userCoords: coords,
          transactionType: activeTab === 'SALE' ? 'SALE' : 'RENT',
          propertyType: selectedType,
        });
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation denied or failed', err);
        setGeoNotice('Position non détectée. Choisissez une ville manuellement.');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleStandardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      city: selectedCity || undefined,
      propertyType: selectedType,
      transactionType: activeTab === 'SALE' ? 'SALE' : 'RENT',
      maxPrice: selectedBudget !== '' ? Number(selectedBudget) : undefined,
      userCoords: geoCoords || undefined,
    });
  };

  const handleAiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    const parsed = parseNaturalLanguageQuery(aiPrompt);
    onSearch({
      city: parsed.detectedCity,
      propertyType: parsed.detectedType || 'ALL',
      transactionType: parsed.detectedTransaction || 'RENT',
      maxPrice: parsed.detectedMaxPrice,
      keyword: aiPrompt,
      aiExplanation: parsed.explanation,
    });
  };

  const aiExamples = [
    'Appartement 2 chambres à Cotonou moins de 150 000 FCFA',
    'Villa avec piscine à Calavi',
    'Parcelle à vendre à Fidjrossè',
    'Studio meublé avec Wifi à Cotonou',
  ];

  return (
    /* Outer container with generous white space around the floating Hero card */
    <div
      style={{
        backgroundColor: '#ffffff',
        paddingTop: 'clamp(14px, 2.5vw, 24px)',
        paddingBottom: 'clamp(14px, 2.5vw, 28px)',
      }}
    >
      <div className="container">
        {/* Floating Island Hero Card */}
        <section
          style={{
            position: 'relative',
            borderRadius: 'clamp(16px, 3vw, 28px)',
            overflow: 'hidden',
            backgroundColor: '#052e1d',
            boxShadow: '0 12px 32px rgba(5, 46, 29, 0.18)',
            padding: 'clamp(28px, 4vw, 44px) clamp(16px, 3vw, 32px)',
            color: '#ffffff',
            textAlign: 'center',
          }}
        >
          {/* Muted Looping Video Background from /uploads/hero-back.mp4 */}
          <video
            autoPlay
            loop
            muted
            playsInline
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 0,
              pointerEvents: 'none',
            }}
          >
            <source src="/uploads/hero-back.mp4" type="video/mp4" />
          </video>

          {/* Elegant Dark Overlay ensuring maximum text legibility & contrast */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(5, 46, 29, 0.72)',
              backgroundImage: 'radial-gradient(circle at center, rgba(5, 46, 29, 0.65) 0%, rgba(3, 26, 16, 0.88) 100%)',
              zIndex: 1,
              pointerEvents: 'none',
            }}
          />

          <div style={{ position: 'relative', zIndex: 2, maxWidth: '820px', marginInline: 'auto' }}>
            {/* Hero Title - Compact & Clean */}
            <h1
              style={{
                fontSize: 'clamp(1.5rem, 3.2vw, 2.2rem)',
                fontWeight: 800,
                lineHeight: 1.2,
                letterSpacing: '-0.025em',
                marginBottom: '10px',
                color: '#ffffff',
              }}
            >
              Le bon bien, au bon endroit.
            </h1>

            <p
              style={{
                fontSize: 'clamp(0.88rem, 1.4vw, 0.98rem)',
                color: 'rgba(255, 255, 255, 0.85)',
                maxWidth: '580px',
                marginInline: 'auto',
                marginBottom: '24px',
                lineHeight: 1.4,
              }}
            >
              Explorez des logements, terrains et bureaux certifiés à louer ou à acheter à Cotonou, Calavi et partout au Bénin.
            </p>

            {/* Tab Switcher: Louer / Acheter / Démo IA */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                padding: '4px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                marginBottom: '16px',
                backdropFilter: 'blur(8px)',
              }}
            >
              <button
                onClick={() => setActiveTab('RENT')}
                style={{
                  padding: '6px 16px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  color: activeTab === 'RENT' ? '#052e1d' : '#ffffff',
                  backgroundColor: activeTab === 'RENT' ? '#ffffff' : 'transparent',
                  transition: 'all var(--transition-fast)',
                }}
              >
                À louer
              </button>
              <button
                onClick={() => setActiveTab('SALE')}
                style={{
                  padding: '6px 16px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  color: activeTab === 'SALE' ? '#052e1d' : '#ffffff',
                  backgroundColor: activeTab === 'SALE' ? '#ffffff' : 'transparent',
                  transition: 'all var(--transition-fast)',
                }}
              >
                À vendre
              </button>
              <button
                onClick={() => setActiveTab('AI')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  color: activeTab === 'AI' ? '#1d4ed8' : '#ffffff',
                  backgroundColor: activeTab === 'AI' ? '#ffffff' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <i className="fa-solid fa-wand-magic-sparkles" style={{ color: activeTab === 'AI' ? '#1d4ed8' : '#93c5fd' }} />
                <span>Recherche IA (Démo)</span>
              </button>
            </div>

            {/* Search Component Container */}
            {activeTab === 'AI' ? (
              /* Compact AI Search Form */
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 'var(--radius-lg)',
                  padding: '16px 20px',
                  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
                  textAlign: 'left',
                  color: 'var(--color-text)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-secondary-blue)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <i className="fa-solid fa-circle-info" />
                    <span>Assistant IA Démo (Analyse en langage naturel)</span>
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', backgroundColor: 'var(--color-bg)', padding: '2px 6px', borderRadius: '4px' }}>
                    Version Démo
                  </span>
                </div>

                <form onSubmit={handleAiSubmit} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <input
                      type="text"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Ex : Je cherche une villa à Calavi avec 4 chambres..."
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--color-border)',
                        outline: 'none',
                        fontSize: '0.88rem',
                        color: 'var(--color-text)',
                        backgroundColor: '#ffffff',
                      }}
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-blue"
                    style={{
                      padding: '10px 18px',
                      fontSize: '0.86rem',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 700,
                    }}
                  >
                    <i className="fa-solid fa-magnifying-glass" />
                    <span>Rechercher</span>
                  </button>
                </form>

                {/* Quick Prompts */}
                <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                    Exemples :
                  </span>
                  {aiExamples.map((ex, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAiPrompt(ex)}
                      style={{
                        fontSize: '0.72rem',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Compact Standard Search Bar */
              <form
                onSubmit={handleStandardSubmit}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 'var(--radius-lg)',
                  padding: '10px 14px',
                  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
                  textAlign: 'left',
                  color: 'var(--color-text)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  alignItems: 'center',
                }}
              >
                {/* Ville */}
                <div style={{ flex: '1.2', minWidth: '150px', padding: '4px 8px', borderRight: '1px solid var(--color-border)' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: 'var(--color-primary)',
                      textTransform: 'uppercase',
                      marginBottom: '2px',
                    }}
                  >
                    <i className="fa-solid fa-location-dot" style={{ color: 'var(--color-secondary-blue)' }} />
                    <span>Localisation</span>
                  </label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    style={{
                      width: '100%',
                      border: 'none',
                      outline: 'none',
                      fontSize: '0.86rem',
                      fontWeight: 600,
                      color: 'var(--color-text)',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
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
                <div style={{ flex: '1', minWidth: '130px', padding: '4px 8px', borderRight: '1px solid var(--color-border)' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: 'var(--color-primary)',
                      textTransform: 'uppercase',
                      marginBottom: '2px',
                    }}
                  >
                    <i className="fa-solid fa-house" style={{ color: 'var(--color-secondary-blue)' }} />
                    <span>Type</span>
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as PropertyType | 'ALL')}
                    style={{
                      width: '100%',
                      border: 'none',
                      outline: 'none',
                      fontSize: '0.86rem',
                      fontWeight: 600,
                      color: 'var(--color-text)',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="ALL">Tous les types</option>
                    <option value="Appartement">Appartement</option>
                    <option value="Villa">Villa</option>
                    <option value="Maison">Maison</option>
                    <option value="Studio">Studio</option>
                    <option value="Chambre-salon">Chambre-salon</option>
                    <option value="Chambre">Chambre</option>
                    <option value="Meublé">Meublé</option>
                    <option value="Terrain">Terrain</option>
                    <option value="Bureau">Bureau</option>
                    <option value="Boutique">Boutique</option>
                    <option value="Immeuble">Immeuble</option>
                  </select>
                </div>

                {/* Budget Max */}
                <div style={{ flex: '1', minWidth: '130px', padding: '4px 8px' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: 'var(--color-primary)',
                      textTransform: 'uppercase',
                      marginBottom: '2px',
                    }}
                  >
                    <i className="fa-solid fa-money-bill-wave" style={{ color: 'var(--color-secondary-blue)' }} />
                    <span>Budget Max</span>
                  </label>
                  <select
                    value={selectedBudget}
                    onChange={(e) => setSelectedBudget(e.target.value === '' ? '' : Number(e.target.value))}
                    style={{
                      width: '100%',
                      border: 'none',
                      outline: 'none',
                      fontSize: '0.86rem',
                      fontWeight: 600,
                      color: 'var(--color-text)',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    {(activeTab === 'RENT' ? budgetOptionsRent : budgetOptionsSale).map((opt, i) => (
                      <option key={i} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* GPS Pin Button */}
                <button
                  type="button"
                  onClick={handleUseCurrentPosition}
                  disabled={isLocating}
                  title="Rechercher autour de moi"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: geoCoords ? 'var(--color-secondary-blue-subtle)' : 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    color: geoCoords ? 'var(--color-secondary-blue)' : 'var(--color-text-secondary)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <i
                    className={`fa-solid ${isLocating ? 'fa-spinner fa-spin' : 'fa-crosshairs'}`}
                    style={{ color: geoCoords ? 'var(--color-secondary-blue)' : 'inherit' }}
                  />
                  <span className="desktop-only">{geoCoords ? 'GPS actif' : 'Autour de moi'}</span>
                </button>

                {/* Submit Search Button */}
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    padding: '10px 20px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    gap: '6px',
                    marginLeft: 'auto',
                  }}
                >
                  <i className="fa-solid fa-magnifying-glass" />
                  <span>Rechercher</span>
                </button>
              </form>
            )}

            {/* GPS Feedback Notice */}
            {geoNotice && (
              <div
                style={{
                  marginTop: '10px',
                  fontSize: '0.78rem',
                  color: '#d1fae5',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'rgba(5, 46, 29, 0.75)',
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                <i className="fa-solid fa-location-arrow" style={{ color: '#10b981' }} />
                <span>{geoNotice}</span>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
