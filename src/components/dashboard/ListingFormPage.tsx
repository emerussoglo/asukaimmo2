import React, { useState, useEffect, useRef } from 'react';
import { Listing, PropertyType, TransactionType } from '../../types';
import { ALL_AMENITIES, CITIES_DATA } from '../../data/mockData';
import { api } from '../../lib/api';

interface ListingFormPageProps {
  initialListing?: Listing | null;
  onSuccess: (savedListing: Listing) => void;
  onCancel: () => void;
  userPlan?: string;
  userMaxListings?: number;
}

export const ListingFormPage: React.FC<ListingFormPageProps> = ({
  initialListing,
  onSuccess,
  onCancel,
  userPlan = 'FREE',
}) => {
  const isEditing = Boolean(initialListing);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [transactionType, setTransactionType] = useState<TransactionType>(
    initialListing?.transactionType || 'RENT'
  );
  const [propertyType, setPropertyType] = useState<PropertyType>(
    initialListing?.propertyType || 'Appartement'
  );
  const [title, setTitle] = useState(initialListing?.title || '');
  const [description, setDescription] = useState(initialListing?.description || '');
  const [price, setPrice] = useState<number | ''>(initialListing ? initialListing.price : '');
  const [priceUnit, setPriceUnit] = useState<string>(
    initialListing ? initialListing.priceUnit : '/ mois'
  );
  const [bedrooms, setBedrooms] = useState<number>(initialListing ? initialListing.bedrooms : 2);
  const [bathrooms, setBathrooms] = useState<number>(initialListing ? initialListing.bathrooms : 1);
  const [surface, setSurface] = useState<number>(initialListing ? initialListing.surface : 65);

  // Category-specific dynamic states
  const [legalTitle, setLegalTitle] = useState<string>('Titre Foncier (TF)');
  const [terrainType, setTerrainType] = useState<string>('Constructible');
  const [isViabilise, setIsViabilise] = useState<boolean>(true);
  const [capacityPersons, setCapacityPersons] = useState<number>(150);
  const [floorsCount, setFloorsCount] = useState<number>(2);
  const [unitsCount, setUnitsCount] = useState<number>(6);
  const [hotelStars, setHotelStars] = useState<string>('3 étoiles');
  const [isFurnished, setIsFurnished] = useState<boolean>(false);
  const [hasShopWindow, setHasShopWindow] = useState<boolean>(true);

  const [country, setCountry] = useState(initialListing?.country || 'Bénin');
  const [city, setCity] = useState(initialListing?.city || 'Cotonou');
  const [neighborhood, setNeighborhood] = useState(initialListing?.neighborhood || '');
  const [address, setAddress] = useState(initialListing?.address || '');
  const [latitude, setLatitude] = useState(initialListing?.latitude || 6.36);
  const [longitude, setLongitude] = useState(initialListing?.longitude || 2.4);

  const [features, setFeatures] = useState<string[]>(
    initialListing?.features || ['Wifi', 'Climatisation', 'Stationnement / Parking']
  );

  const [images, setImages] = useState<string[]>(
    initialListing?.images?.length ? initialListing.images : []
  );
  const [newImageUrl, setNewImageUrl] = useState('');
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setUploadError(null);
    setUploadingPhotos(true);

    try {
      const filesArray = Array.from(fileList);
      const uploadedUrls: string[] = [];

      for (const file of filesArray) {
        if (!file.type.startsWith('image/')) {
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          setUploadError(`L’image ${file.name} dépasse 10 Mo.`);
          continue;
        }

        // Read file as Base64 Data URL
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Real upload to server
        const savedUrl = await api.upload.uploadImage(base64Data, file.name);
        uploadedUrls.push(savedUrl);
      }

      if (uploadedUrls.length > 0) {
        setImages((prev) => [...prev, ...uploadedUrls]);
      }
    } catch (err: any) {
      console.error('File upload error:', err);
      setUploadError(err.message || 'Erreur lors du téléversement des photos.');
    } finally {
      setUploadingPhotos(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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

  const steps = [
    { num: 1, label: 'Offre' },
    { num: 2, label: 'Type' },
    { num: 3, label: 'Informations' },
    { num: 4, label: 'Localisation' },
    { num: 5, label: 'Équipements' },
    { num: 6, label: 'Photos' },
  ];

  const toggleFeature = (name: string) => {
    setFeatures((prev) =>
      prev.includes(name) ? prev.filter((f) => f !== name) : [...prev, name]
    );
  };

  const addImage = () => {
    if (newImageUrl.trim()) {
      setImages([...images, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setLatitude(Math.round(pos.coords.latitude * 10000) / 10000);
        setLongitude(Math.round(pos.coords.longitude * 10000) / 10000);
      });
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setErrorMsg('Veuillez renseigner le titre du bien.');
      setStep(3);
      return;
    }
    if (!price || Number(price) <= 0) {
      setErrorMsg('Veuillez renseigner un prix valide.');
      setStep(3);
      return;
    }
    if (!city.trim()) {
      setErrorMsg('Veuillez renseigner la ville.');
      setStep(4);
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      transactionType,
      propertyType,
      price: Number(price),
      priceUnit: transactionType === 'RENT' ? priceUnit : 'total',
      country,
      city: city.trim(),
      neighborhood: neighborhood.trim() || city.trim(),
      address: address.trim(),
      latitude,
      longitude,
      bedrooms,
      bathrooms,
      surface,
      images: images.length ? images : ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'],
      features,
    };

    try {
      if (isEditing && initialListing) {
        const res = await api.dashboard.updateListing(initialListing.id, payload);
        onSuccess(res.listing);
      } else {
        const res = await api.dashboard.createListing(payload);
        onSuccess(res.listing);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Une erreur est survenue lors de l’enregistrement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '10px 0' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <button
            onClick={onCancel}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              color: 'var(--color-text-secondary)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              marginBottom: '6px',
              fontWeight: 600,
            }}
          >
            <i className="fa-solid fa-arrow-left" />
            <span>Retour à mes annonces</span>
          </button>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
            {isEditing ? 'Modifier l’annonce' : 'Ajouter un bien'}
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={onCancel} className="btn btn-secondary btn-sm">
            Annuler
          </button>
        </div>
      </div>

      {/* Stepper Navigation (Matching PDF page 1 top & page 8 right) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          padding: '12px 16px',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          marginBottom: '20px',
        }}
      >
        {steps.map((s) => {
          const isPassed = step > s.num;
          const isCurrent = step === s.num;
          return (
            <React.Fragment key={s.num}>
              <button
                onClick={() => setStep(s.num)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  backgroundColor: isCurrent ? 'var(--color-primary)' : isPassed ? 'var(--color-accent-light)' : 'transparent',
                  color: isCurrent ? '#ffffff' : isPassed ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  fontSize: '0.78rem',
                  fontWeight: isCurrent || isPassed ? 700 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                <span
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: isCurrent ? '#ffffff' : isPassed ? 'var(--color-primary)' : 'var(--color-border)',
                    color: isCurrent ? 'var(--color-primary)' : '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                  }}
                >
                  {isPassed ? <i className="fa-solid fa-check" style={{ fontSize: '0.65rem' }} /> : s.num}
                </span>
                <span>{s.label}</span>
              </button>
              {s.num < steps.length && (
                <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem', color: 'var(--color-border)' }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {errorMsg && (
        <div
          style={{
            backgroundColor: '#fee2e2',
            color: '#b91c1c',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '16px',
            fontSize: '0.86rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <i className="fa-solid fa-circle-exclamation" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: TYPE D'OFFRE (Matching PDF page 1 top: "Type d'offre") */}
      {step === 1 && (
        <div className="card" style={{ padding: '28px', backgroundColor: '#ffffff' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '6px' }}>
            Type d'offre
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
            Sélectionnez si vous souhaitez proposer votre bien à la location ou à la vente.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '28px' }}>
            <div
              onClick={() => setTransactionType('RENT')}
              style={{
                border: transactionType === 'RENT' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                backgroundColor: transactionType === 'RENT' ? 'var(--color-primary-light)' : '#ffffff',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                transition: 'all var(--transition-fast)',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: transactionType === 'RENT' ? 'var(--color-primary)' : 'var(--color-bg)',
                  color: transactionType === 'RENT' ? '#ffffff' : 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                }}
              >
                <i className="fa-solid fa-key" />
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-primary)', display: 'block' }}>
                  Location
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                  Mettre un bien en location mensuelle ou saisonnière
                </span>
              </div>
              {transactionType === 'RENT' && (
                <i className="fa-solid fa-circle-check" style={{ color: 'var(--color-primary)', fontSize: '1.2rem' }} />
              )}
            </div>

            <div
              onClick={() => setTransactionType('SALE')}
              style={{
                border: transactionType === 'SALE' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                backgroundColor: transactionType === 'SALE' ? 'var(--color-primary-light)' : '#ffffff',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                transition: 'all var(--transition-fast)',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: transactionType === 'SALE' ? 'var(--color-primary)' : 'var(--color-bg)',
                  color: transactionType === 'SALE' ? '#ffffff' : 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                }}
              >
                <i className="fa-solid fa-tag" />
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-primary)', display: 'block' }}>
                  Vente
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                  Vendre un appartement, maison, parcelle ou terrain
                </span>
              </div>
              {transactionType === 'SALE' && (
                <i className="fa-solid fa-circle-check" style={{ color: 'var(--color-primary)', fontSize: '1.2rem' }} />
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => setStep(2)} className="btn btn-primary" style={{ padding: '9px 24px' }}>
              <span>Suivant</span>
              <i className="fa-solid fa-arrow-right" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: TYPE DE BIEN (Grid) */}
      {step === 2 && (
        <div className="card" style={{ padding: '28px', backgroundColor: '#ffffff' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '6px' }}>
            Catégorie de bien
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
            Choisissez la typologie correspondant le mieux à votre annonce.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px', marginBottom: '28px' }}>
            {propertyTypes.map((t) => {
              const selected = propertyType === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setPropertyType(t)}
                  style={{
                    padding: '12px 10px',
                    borderRadius: 'var(--radius-md)',
                    border: selected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    backgroundColor: selected ? 'var(--color-primary-light)' : '#ffffff',
                    color: selected ? 'var(--color-primary)' : 'var(--color-text)',
                    fontWeight: selected ? 800 : 600,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => setStep(1)} className="btn btn-secondary">
              <i className="fa-solid fa-arrow-left" />
              <span>Précédent</span>
            </button>
            <button onClick={() => setStep(3)} className="btn btn-primary">
              <span>Suivant</span>
              <i className="fa-solid fa-arrow-right" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: INFORMATIONS DE BASE */}
      {step === 3 && (
        <div className="card" style={{ padding: '28px', backgroundColor: '#ffffff' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '6px' }}>
            Informations principales
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
            Détaillez le titre, le prix et les caractéristiques dimensionnelles de votre bien.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '6px' }}>
                Titre de l'annonce *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex : Superbe villa 4 pièces avec jardin à Cadjèhoun"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.9rem' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '6px' }}>
                  Prix en FCFA *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={price}
                  onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Ex : 250000"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.9rem' }}
                />
              </div>

              {transactionType === 'RENT' && (
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '6px' }}>
                    Périodicité
                  </label>
                  <select
                    value={priceUnit}
                    onChange={(e) => setPriceUnit(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.9rem', backgroundColor: '#ffffff' }}
                  >
                    <option value="/ heure">Par heure (/ heure)</option>
                    <option value="/ jour">Par jour (/ jour)</option>
                    <option value="/ semaine">Par semaine (/ semaine)</option>
                    <option value="/ mois">Par mois (/ mois)</option>
                    <option value="/ an">Par an (/ an)</option>
                  </select>
                </div>
              )}

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '6px' }}>
                  {propertyType === 'Terrain' ? 'Superficie (en m²)' : 'Surface habitable / utile (m²)'}
                </label>
                <input
                  type="number"
                  min={0}
                  value={surface}
                  onChange={(e) => setSurface(Number(e.target.value))}
                  placeholder="Ex : 85"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.9rem' }}
                />
              </div>
            </div>

            {/* DYNAMIC FIELDS ACCORDING TO PROPERTY TYPE */}
            {propertyType === 'Terrain' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', padding: '14px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '4px' }}>
                    Type de terrain
                  </label>
                  <select
                    value={terrainType}
                    onChange={(e) => setTerrainType(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.85rem', backgroundColor: '#ffffff' }}
                  >
                    <option value="Constructible">Terrain à bâtir (Constructible)</option>
                    <option value="Agricole">Terrain agricole / Ferme</option>
                    <option value="Commercial">Zone commerciale / Bordure de voie</option>
                    <option value="Industriel">Zone industrielle</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '4px' }}>
                    Document juridique
                  </label>
                  <select
                    value={legalTitle}
                    onChange={(e) => setLegalTitle(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.85rem', backgroundColor: '#ffffff' }}
                  >
                    <option value="Titre Foncier (TF)">Titre Foncier (TF disponible)</option>
                    <option value="Convention de vente">Convention de vente avec tampon mairie</option>
                    <option value="Attestation de recasement">Attestation de recasement</option>
                    <option value="Certificat d'Appartenance">Certificat d'Appartenance (ANDF)</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '18px' }}>
                  <input
                    type="checkbox"
                    id="viabilise"
                    checked={isViabilise}
                    onChange={(e) => setIsViabilise(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="viabilise" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text)', cursor: 'pointer' }}>
                    Terrain viabilisé (Eau & électricité à proximité)
                  </label>
                </div>
              </div>
            ) : propertyType === 'Place de fête' || propertyType === 'Salle de conférence' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', padding: '14px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '4px' }}>
                    Capacité d'accueil (personnes assises) *
                  </label>
                  <input
                    type="number"
                    min={10}
                    value={capacityPersons}
                    onChange={(e) => setCapacityPersons(Number(e.target.value))}
                    placeholder="Ex : 250"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.85rem' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '18px' }}>
                  <input
                    type="checkbox"
                    id="shopWindow"
                    checked={hasShopWindow}
                    onChange={(e) => setHasShopWindow(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="shopWindow" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text)', cursor: 'pointer' }}>
                    Climatisation et sonorisation incluses
                  </label>
                </div>
              </div>
            ) : propertyType === 'Bureau' || propertyType === 'Boutique' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', padding: '14px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '4px' }}>
                    Nombre de bureaux / pièces
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={bedrooms || 1}
                    onChange={(e) => setBedrooms(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '4px' }}>
                    Sanitaires dédiés
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={bathrooms || 1}
                    onChange={(e) => setBathrooms(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.85rem' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '18px' }}>
                  <input
                    type="checkbox"
                    id="shopWindow2"
                    checked={hasShopWindow}
                    onChange={(e) => setHasShopWindow(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="shopWindow2" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text)', cursor: 'pointer' }}>
                    Vitrine sur rue / Accès direct clients
                  </label>
                </div>
              </div>
            ) : propertyType === 'Immeuble' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', padding: '14px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '4px' }}>
                    Nombre de niveaux (ex : R+2)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={floorsCount}
                    onChange={(e) => setFloorsCount(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '4px' }}>
                    Nombre total d'appartements / unités
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={unitsCount}
                    onChange={(e) => setUnitsCount(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.85rem' }}
                  />
                </div>
              </div>
            ) : propertyType === 'Hôtel' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', padding: '14px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '4px' }}>
                    Nombre total de chambres disponibles
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={bedrooms || 12}
                    onChange={(e) => setBedrooms(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '4px' }}>
                    Catégorie d'établissement
                  </label>
                  <select
                    value={hotelStars}
                    onChange={(e) => setHotelStars(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.85rem', backgroundColor: '#ffffff' }}
                  >
                    <option value="Résidence hôtelière">Résidence hôtelière</option>
                    <option value="2 étoiles">Hôtel 2 étoiles</option>
                    <option value="3 étoiles">Hôtel 3 étoiles</option>
                    <option value="4 étoiles">Hôtel 4 étoiles</option>
                    <option value="Hôtel de charme">Hôtel de charme / Auberge</option>
                  </select>
                </div>
              </div>
            ) : propertyType === 'Studio' || propertyType === 'Chambre' || propertyType === 'Chambre-salon' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '14px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '4px' }}>
                    Salle d'eau
                  </label>
                  <select
                    value={bathrooms}
                    onChange={(e) => setBathrooms(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.85rem', backgroundColor: '#ffffff' }}
                  >
                    <option value={1}>Salle d'eau privative (1)</option>
                    <option value={0}>Partagée / externe</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '18px' }}>
                  <input
                    type="checkbox"
                    id="furnished"
                    checked={isFurnished}
                    onChange={(e) => setIsFurnished(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="furnished" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text)', cursor: 'pointer' }}>
                    Logement meublé (lit, armoire, cuisine...)
                  </label>
                </div>
              </div>
            ) : (
              /* Residential: Appartement, Maison, Villa, Meublé, Résidence */
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '6px' }}>
                    Nombre de chambres
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={bedrooms}
                    onChange={(e) => setBedrooms(Number(e.target.value))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.9rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '6px' }}>
                    Salles d'eau / Salles de bain
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={bathrooms}
                    onChange={(e) => setBathrooms(Number(e.target.value))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.9rem' }}
                  />
                </div>
              </div>
            )}

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '6px' }}>
                Description détaillée
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez les atouts de votre bien, les charges incluses, la proximité avec les commodités..."
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.88rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => setStep(2)} className="btn btn-secondary">
              <i className="fa-solid fa-arrow-left" />
              <span>Précédent</span>
            </button>
            <button onClick={() => setStep(4)} className="btn btn-primary">
              <span>Suivant</span>
              <i className="fa-solid fa-arrow-right" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: LOCALISATION */}
      {step === 4 && (
        <div className="card" style={{ padding: '28px', backgroundColor: '#ffffff' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '6px' }}>
            Localisation géographique
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
            Indiquez la ville, le quartier et éventuellement les coordonnées GPS.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '6px' }}>
                  Pays
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.9rem', backgroundColor: '#ffffff' }}
                >
                  <option value="Bénin">Bénin</option>
                  <option value="France">France</option>
                  <option value="Côte d’Ivoire">Côte d’Ivoire</option>
                  <option value="Togo">Togo</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '6px' }}>
                  Ville *
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ex : Cotonou"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.9rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '6px' }}>
                Quartier / Secteur
              </label>
              <input
                type="text"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="Ex : Haie Vive, Cadjèhoun, Fidjrossè..."
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.9rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '6px' }}>
                Adresse précise ou repère
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ex : Rue 340, face Pharmacie Saint-Luc"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.9rem' }}
              />
            </div>

            <div style={{ backgroundColor: 'var(--color-bg)', padding: '14px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block' }}>
                  Position GPS ({latitude}, {longitude})
                </span>
                <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                  Permet d'afficher la distance exacte pour les visiteurs
                </span>
              </div>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="btn btn-secondary btn-sm"
                style={{ gap: '6px' }}
              >
                <i className="fa-solid fa-location-crosshairs" />
                <span>Utiliser ma position actuelle</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => setStep(3)} className="btn btn-secondary">
              <i className="fa-solid fa-arrow-left" />
              <span>Précédent</span>
            </button>
            <button onClick={() => setStep(5)} className="btn btn-primary">
              <span>Suivant</span>
              <i className="fa-solid fa-arrow-right" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: ÉQUIPEMENTS */}
      {step === 5 && (
        <div className="card" style={{ padding: '28px', backgroundColor: '#ffffff' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '6px' }}>
            Équipements & Commodités
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
            Cochez les commodités disponibles pour valoriser votre annonce.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', marginBottom: '28px' }}>
            {ALL_AMENITIES.map((am) => {
              const active = features.includes(am.label);
              return (
                <div
                  key={am.id}
                  onClick={() => toggleFeature(am.label)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: active ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    backgroundColor: active ? 'var(--color-primary-light)' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <i
                    className={`fa-solid ${am.icon}`}
                    style={{ color: active ? 'var(--color-primary)' : 'var(--color-text-muted)', width: '18px' }}
                  />
                  <span style={{ fontSize: '0.82rem', fontWeight: active ? 700 : 500, color: active ? 'var(--color-primary)' : 'var(--color-text)' }}>
                    {am.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => setStep(4)} className="btn btn-secondary">
              <i className="fa-solid fa-arrow-left" />
              <span>Précédent</span>
            </button>
            <button onClick={() => setStep(6)} className="btn btn-primary">
              <span>Suivant</span>
              <i className="fa-solid fa-arrow-right" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: PHOTOS & VALIDATION */}
      {step === 6 && (
        <div className="card" style={{ padding: '28px', backgroundColor: '#ffffff' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '6px' }}>
            Photos du bien
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
            Sélectionnez des photos depuis votre téléphone ou ordinateur pour valoriser votre annonce.
          </p>

          {/* Hidden File Input for Device Files */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFilesChosen}
          />

          {/* Device Selection Dropzone / Button */}
          <div
            onClick={() => {
              if (!uploadingPhotos) fileInputRef.current?.click();
            }}
            style={{
              border: '2px dashed var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '28px 18px',
              textAlign: 'center',
              backgroundColor: 'var(--color-bg)',
              cursor: uploadingPhotos ? 'not-allowed' : 'pointer',
              marginBottom: '16px',
              transition: 'border-color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
          >
            {uploadingPhotos ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.8rem', color: 'var(--color-primary)' }} />
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                  Téléversement des photos en cours...
                </span>
                <span style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)' }}>
                  Enregistrement sur le serveur
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-primary-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-primary)',
                    fontSize: '1.3rem',
                  }}
                >
                  <i className="fa-solid fa-camera" />
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                  Ajouter des photos depuis votre appareil
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                  Cliquez ou appuyez pour choisir des photos (JPG, PNG, WEBP — plusieurs photos)
                </div>
              </div>
            )}
          </div>

          {/* Upload Error Alert */}
          {uploadError && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                fontSize: '0.82rem',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <i className="fa-solid fa-triangle-exclamation" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Alternative URL Input */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
            <input
              type="url"
              placeholder="Ou coller une URL d'image externe..."
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              style={{ flex: 1, padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.84rem' }}
            />
            <button type="button" onClick={addImage} className="btn btn-secondary btn-sm" style={{ padding: '0 16px' }}>
              Ajouter URL
            </button>
          </div>

          {/* Selected Photos Gallery Thumbnails */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                Photos sélectionnées ({images.length})
              </span>
              {images.length > 0 && (
                <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                  La 1ère photo sera l'image principale
                </span>
              )}
            </div>

            {images.length === 0 ? (
              <div
                style={{
                  padding: '24px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-bg)',
                  textAlign: 'center',
                  color: 'var(--color-text-muted)',
                  fontSize: '0.84rem',
                }}
              >
                <i className="fa-regular fa-image" style={{ fontSize: '1.6rem', display: 'block', marginBottom: '6px', color: '#94a3b8' }} />
                Aucune photo sélectionnée pour le moment.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
                {images.map((img, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'relative',
                      height: '105px',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      border: i === 0 ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      boxShadow: 'var(--shadow-xs)',
                    }}
                  >
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      style={{
                        position: 'absolute',
                        top: '5px',
                        right: '5px',
                        backgroundColor: 'rgba(239, 68, 68, 0.95)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '0.72rem',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      }}
                      title="Retirer cette photo"
                    >
                      <i className="fa-solid fa-xmark" />
                    </button>
                    {i === 0 && (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: '5px',
                          left: '5px',
                          backgroundColor: 'var(--color-primary)',
                          color: '#ffffff',
                          fontSize: '0.64rem',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        Principale
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Final Submit Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={() => setStep(5)} className="btn btn-secondary" disabled={loading}>
              <i className="fa-solid fa-arrow-left" />
              <span>Précédent</span>
            </button>
            <button
              onClick={handleSubmit}
              className="btn btn-primary"
              disabled={loading}
              style={{ padding: '10px 28px', fontSize: '0.9rem', fontWeight: 800 }}
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin" />
                  <span>Enregistrement dans Turso...</span>
                </>
              ) : isEditing ? (
                <>
                  <i className="fa-solid fa-check" />
                  <span>Mettre à jour l'annonce</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-cloud-arrow-up" />
                  <span>Publier l'annonce maintenant</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
