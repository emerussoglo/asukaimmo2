import React, { useState, useRef } from 'react';
import { Listing, PropertyType, TransactionType, User } from '../../types';
import { ALL_AMENITIES } from '../../data/mockData';
import { listingRepo } from '../../lib/turso';
import { api } from '../../lib/api';

interface PublishWizardProps {
  currentUser: User | null;
  editingListing?: Listing | null;
  onClose: () => void;
  onSuccess: (newListing: Listing) => void;
  onUpgradeRequired: () => void;
}

export const PublishWizard: React.FC<PublishWizardProps> = ({
  currentUser,
  editingListing,
  onClose,
  onSuccess,
  onUpgradeRequired,
}) => {
  const [step, setStep] = useState(1);

  // Form State
  const [transactionType, setTransactionType] = useState<TransactionType>(
    editingListing?.transactionType || 'RENT'
  );
  const [propertyType, setPropertyType] = useState<PropertyType>(
    editingListing?.propertyType || 'Appartement'
  );

  const [title, setTitle] = useState(editingListing?.title || '');
  const [description, setDescription] = useState(editingListing?.description || '');
  const [price, setPrice] = useState<number | ''>(editingListing ? editingListing.price : '');
  const [priceUnit, setPriceUnit] = useState<string>(
    editingListing ? editingListing.priceUnit : '/ mois'
  );
  const [bedrooms, setBedrooms] = useState<number>(editingListing ? editingListing.bedrooms : 2);
  const [bathrooms, setBathrooms] = useState<number>(editingListing ? editingListing.bathrooms : 1);
  const [surface, setSurface] = useState<number>(editingListing ? editingListing.surface : 65);

  // Dynamic category states
  const [legalTitle, setLegalTitle] = useState<string>('Titre Foncier (TF)');
  const [terrainType, setTerrainType] = useState<string>('Constructible');
  const [isViabilise, setIsViabilise] = useState<boolean>(true);
  const [capacityPersons, setCapacityPersons] = useState<number>(150);
  const [floorsCount, setFloorsCount] = useState<number>(2);
  const [unitsCount, setUnitsCount] = useState<number>(6);
  const [hotelStars, setHotelStars] = useState<string>('3 étoiles');
  const [isFurnished, setIsFurnished] = useState<boolean>(false);
  const [hasShopWindow, setHasShopWindow] = useState<boolean>(true);

  const [department, setDepartment] = useState('Littoral');
  const [city, setCity] = useState(editingListing?.city || 'Cotonou');
  const [neighborhood, setNeighborhood] = useState(editingListing?.neighborhood || 'Cadjèhoun');
  const [address, setAddress] = useState(editingListing?.address || '');
  const [latitude, setLatitude] = useState(editingListing?.latitude || 6.3601);
  const [longitude, setLongitude] = useState(editingListing?.longitude || 2.3985);

  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(
    editingListing?.features || ['Wifi', 'Climatisation', 'Stationnement / Parking']
  );

  // Real Images State - Empty by default or existing images
  const [images, setImages] = useState<string[]>(editingListing?.images || []);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [phone, setPhone] = useState(
    editingListing?.ownerPhone || currentUser?.phone || '+229 97 00 12 34'
  );
  const [whatsapp, setWhatsapp] = useState(
    editingListing?.ownerWhatsapp || currentUser?.whatsapp || '+229 97 00 12 34'
  );
  const [email, setEmail] = useState(currentUser?.email || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Check Plan Limits
  const userPlan = currentUser?.plan || 'FREE';
  const currentListingsCount = currentUser?.listingsCount || 0;
  const maxListings = userPlan === 'PRO' ? 20 : userPlan === 'AGENCE' ? 100 : 5;
  const maxPhotos = userPlan === 'PRO' ? 15 : 6;

  const isLimitReached = currentListingsCount >= maxListings;

  const handleUseCurrentPosition = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setLatitude(Math.round(pos.coords.latitude * 10000) / 10000);
        setLongitude(Math.round(pos.coords.longitude * 10000) / 10000);
      });
    }
  };

  const handleToggleFeature = (label: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(label) ? prev.filter((f) => f !== label) : [...prev, label]
    );
  };

  // Real File Upload to Server
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
          setUploadError(`L’image ${file.name} dépasse la limite de 10 Mo.`);
          continue;
        }

        // Read file as Base64 Data URL
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Real upload to backend server storage
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

  const handleRemoveImage = async (indexToRemove: number) => {
    const targetUrl = images[indexToRemove];
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    if (targetUrl && targetUrl.startsWith('/uploads/')) {
      try {
        await api.upload.deleteImage(targetUrl);
      } catch (err) {
        console.warn('Image deletion notice:', err);
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

  const handleFinalSubmit = async () => {
    setSubmitError(null);

    // Validation
    if (!title.trim()) {
      setSubmitError("Veuillez renseigner le titre de l'annonce.");
      setStep(2);
      return;
    }
    if (price === '' || Number(price) <= 0) {
      setSubmitError('Veuillez indiquer un prix valide.');
      setStep(2);
      return;
    }
    if (!city.trim()) {
      setSubmitError('Veuillez indiquer la ville.');
      setStep(3);
      return;
    }

    setIsSubmitting(true);

    try {
      const slugBase = (title || `${propertyType} standing à ${city}`).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const slug = `${slugBase || 'bien'}-${Date.now().toString().slice(-4)}`;

      // Final features list enriched with dynamic choices
      const enrichedFeatures = [...selectedFeatures];
      if (propertyType === 'Terrain') {
        enrichedFeatures.push(`Titre : ${legalTitle}`);
        enrichedFeatures.push(`Type : ${terrainType}`);
        if (isViabilise) enrichedFeatures.push('Viabilisé');
      } else if (propertyType === 'Place de fête' || propertyType === 'Salle de conférence') {
        enrichedFeatures.push(`Capacité : ${capacityPersons} personnes`);
        if (hasShopWindow) enrichedFeatures.push('Sono & Climatisation');
      } else if (propertyType === 'Bureau' || propertyType === 'Boutique') {
        if (hasShopWindow) enrichedFeatures.push('Vitrine sur rue');
      } else if (propertyType === 'Immeuble') {
        enrichedFeatures.push(`R+${floorsCount}`);
        enrichedFeatures.push(`${unitsCount} appartements`);
      } else if (propertyType === 'Hôtel') {
        enrichedFeatures.push(`${hotelStars}`);
      } else if (isFurnished) {
        enrichedFeatures.push('Meublé');
      }

      // If no images uploaded, use clean placeholder with actual property type
      const finalImages = images.length > 0 ? images : [
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
      ];

      const listingPayload: Listing = {
        id: editingListing?.id || `lst_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        slug: editingListing?.slug || slug,
        title: title.trim(),
        description: description.trim() || `Très beau bien de type ${propertyType} situé à ${city}, quartier ${neighborhood}.`,
        transactionType,
        propertyType,
        price: Number(price),
        priceUnit: transactionType === 'RENT' ? priceUnit : 'total',
        city: city.trim(),
        neighborhood: (neighborhood || city).trim(),
        address: address.trim(),
        latitude,
        longitude,
        bedrooms: propertyType === 'Terrain' || propertyType === 'Place de fête' || propertyType === 'Salle de conférence' ? 0 : bedrooms,
        bathrooms: propertyType === 'Terrain' ? 0 : bathrooms,
        surface: Number(surface) || 0,
        images: finalImages,
        features: enrichedFeatures,
        status: 'PUBLISHED',
        isFeatured: userPlan === 'PRO',
        isSponsored: userPlan === 'PRO',
        likesCount: editingListing?.likesCount || 0,
        viewsCount: editingListing?.viewsCount || 1,
        contactsCount: editingListing?.contactsCount || 0,
        ownerId: currentUser?.id || 'usr_guest',
        ownerName: currentUser?.name || 'Annonceur certifié',
        ownerPhone: phone || '+229 97 00 12 34',
        ownerWhatsapp: whatsapp || phone || '+229 97 00 12 34',
        ownerRole: userPlan === 'PRO' ? 'Propriétaire certifié' : 'Propriétaire',
        isOwnerVerified: true,
        publishedAt: editingListing?.publishedAt || new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      };

      // 1. Save in local repository
      if (editingListing) {
        listingRepo.updateListing(listingPayload);
      } else {
        listingRepo.saveListing(listingPayload);
      }

      // 2. Persist directly in Turso DB via API
      try {
        await api.public.createListing(listingPayload);
      } catch (dbErr) {
        console.warn('Persist to Turso notice:', dbErr);
      }

      setIsSubmitting(false);
      onSuccess(listingPayload);
    } catch (err: any) {
      console.error('Submit listing error:', err);
      setSubmitError(err.message || "Erreur lors de l'enregistrement de l'annonce.");
      setIsSubmitting(false);
    }
  };

  const stepsList = [
    { num: 1, label: 'Type' },
    { num: 2, label: 'Informations' },
    { num: 3, label: 'Localisation' },
    { num: 4, label: 'Équipements' },
    { num: 5, label: 'Photos' },
    { num: 6, label: 'Contact' },
    { num: 7, label: 'Publication' },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 120,
        backgroundColor: 'rgba(5, 46, 29, 0.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '780px',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xl)',
          overflow: 'hidden',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#ffffff',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.82rem',
                }}
              >
                <i className="fa-solid fa-house-chimney" />
              </div>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-secondary-blue)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                ASUKAIMMO • Dépôt d'annonce
              </span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '2px' }}>
              {editingListing ? "Modifier l'annonce" : 'Publier une nouvelle annonce'}
            </h2>
          </div>

          <button
            onClick={onClose}
            aria-label="Fermer"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              border: 'none',
            }}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Steps Breadcrumb Progress */}
        <div
          style={{
            padding: '12px 24px',
            backgroundColor: 'var(--color-bg)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
          }}
        >
          {stepsList.map((s) => {
            const isPassed = step > s.num;
            const isCurrent = step === s.num;
            return (
              <div
                key={s.num}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: isCurrent || isPassed ? 1 : 0.45,
                  flexShrink: 0,
                  cursor: isPassed ? 'pointer' : 'default',
                }}
                onClick={() => {
                  if (isPassed) setStep(s.num);
                }}
              >
                <div
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    backgroundColor: isCurrent ? 'var(--color-primary)' : isPassed ? 'var(--color-accent)' : '#d1d5db',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                  }}
                >
                  {isPassed ? <i className="fa-solid fa-check" style={{ fontSize: '0.65rem' }} /> : s.num}
                </div>
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: isCurrent ? 800 : 600,
                    color: isCurrent ? 'var(--color-primary)' : 'var(--color-text)',
                  }}
                >
                  {s.label}
                </span>
                {s.num < stepsList.length && (
                  <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.6rem', color: '#9ca3af', margin: '0 2px' }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Submit / Error Notice */}
        {submitError && (
          <div
            style={{
              padding: '10px 24px',
              backgroundColor: '#fee2e2',
              borderBottom: '1px solid #fecaca',
              color: '#b91c1c',
              fontSize: '0.84rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <i className="fa-solid fa-circle-exclamation" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Step Body Content */}
        <div style={{ padding: '24px', maxHeight: '62vh', overflowY: 'auto' }}>
          {/* STEP 1: TYPE & OFFRE */}
          {step === 1 && (
            <div>
              <label style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--color-primary)', display: 'block', marginBottom: '10px' }}>
                Type d'offre *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '22px' }}>
                {[
                  { id: 'RENT', label: 'À louer (Location)', icon: 'fa-key', desc: 'Logement mensuel, meublé, bureau...' },
                  { id: 'SALE', label: 'À vendre (Vente)', icon: 'fa-tag', desc: 'Parcelle, villa, maison, immeuble...' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTransactionType(t.id as any)}
                    style={{
                      padding: '14px',
                      borderRadius: 'var(--radius-md)',
                      border: transactionType === t.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      backgroundColor: transactionType === t.id ? 'var(--color-primary-light)' : '#ffffff',
                      color: 'var(--color-primary)',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: transactionType === t.id ? 'var(--color-primary)' : 'var(--color-bg)',
                        color: transactionType === t.id ? '#ffffff' : 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1rem',
                        flexShrink: 0,
                      }}
                    >
                      <i className={`fa-solid ${t.icon}`} />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.92rem', fontWeight: 800, display: 'block' }}>{t.label}</span>
                      <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>{t.desc}</span>
                    </div>
                  </button>
                ))}
              </div>

              <label style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--color-primary)', display: 'block', marginBottom: '10px' }}>
                Catégorie de bien (14 catégories disponibles)
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                  gap: '8px',
                }}
              >
                {propertyTypes.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setPropertyType(cat)}
                    style={{
                      padding: '10px 8px',
                      borderRadius: 'var(--radius-sm)',
                      border: propertyType === cat ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      backgroundColor: propertyType === cat ? 'var(--color-primary-light)' : '#ffffff',
                      color: propertyType === cat ? 'var(--color-primary)' : 'var(--color-text)',
                      fontWeight: propertyType === cat ? 800 : 600,
                      fontSize: '0.82rem',
                      textAlign: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: INFORMATIONS DYNAMIQUES */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '5px' }}>
                  Titre de l'annonce *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={`Ex : ${propertyType} de standing situé à ${city}`}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '5px' }}>
                    Prix (FCFA) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={price}
                    onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Ex : 200000"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.88rem' }}
                  />
                </div>

                {transactionType === 'RENT' && (
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '5px' }}>
                      Périodicité *
                    </label>
                    <select
                      value={priceUnit}
                      onChange={(e) => setPriceUnit(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.88rem', backgroundColor: '#ffffff' }}
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
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '5px' }}>
                    {propertyType === 'Terrain' ? 'Superficie (en m²)' : 'Surface habitable / utile (m²)'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={surface}
                    onChange={(e) => setSurface(Number(e.target.value))}
                    placeholder="Ex : 75"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              {/* DYNAMIC FIELDS PER CATEGORY */}
              {propertyType === 'Terrain' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', padding: '14px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '4px' }}>
                      Type de terrain
                    </label>
                    <select
                      value={terrainType}
                      onChange={(e) => setTerrainType(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.84rem', backgroundColor: '#ffffff' }}
                    >
                      <option value="Constructible">Terrain à bâtir (Constructible)</option>
                      <option value="Agricole">Terrain agricole / Ferme</option>
                      <option value="Commercial">Zone commerciale / Bord de voie</option>
                      <option value="Industriel">Zone industrielle</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '4px' }}>
                      Document juridique
                    </label>
                    <select
                      value={legalTitle}
                      onChange={(e) => setLegalTitle(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.84rem', backgroundColor: '#ffffff' }}
                    >
                      <option value="Titre Foncier (TF)">Titre Foncier (TF)</option>
                      <option value="Convention de vente">Convention de vente avec tampon</option>
                      <option value="Attestation de recasement">Attestation de recasement</option>
                      <option value="Certificat d'Appartenance">Certificat d'Appartenance (ANDF)</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '16px' }}>
                    <input
                      type="checkbox"
                      id="wiz_viab"
                      checked={isViabilise}
                      onChange={(e) => setIsViabilise(e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label htmlFor="wiz_viab" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)', cursor: 'pointer' }}>
                      Terrain viabilisé (Eau & électricité disponibles)
                    </label>
                  </div>
                </div>
              ) : propertyType === 'Place de fête' || propertyType === 'Salle de conférence' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', padding: '14px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '4px' }}>
                      Capacité d'accueil assise (personnes) *
                    </label>
                    <input
                      type="number"
                      min={10}
                      value={capacityPersons}
                      onChange={(e) => setCapacityPersons(Number(e.target.value))}
                      placeholder="Ex : 250"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.84rem' }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '16px' }}>
                    <input
                      type="checkbox"
                      id="wiz_clim"
                      checked={hasShopWindow}
                      onChange={(e) => setHasShopWindow(e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label htmlFor="wiz_clim" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)', cursor: 'pointer' }}>
                      Climatisation et sonorisation incluses
                    </label>
                  </div>
                </div>
              ) : propertyType === 'Bureau' || propertyType === 'Boutique' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', padding: '14px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '4px' }}>
                      Nombre de bureaux / pièces
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={bedrooms || 1}
                      onChange={(e) => setBedrooms(Number(e.target.value))}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.84rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '4px' }}>
                      Sanitaires dédiés
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={bathrooms || 1}
                      onChange={(e) => setBathrooms(Number(e.target.value))}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.84rem' }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '16px' }}>
                    <input
                      type="checkbox"
                      id="wiz_vitrine"
                      checked={hasShopWindow}
                      onChange={(e) => setHasShopWindow(e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label htmlFor="wiz_vitrine" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)', cursor: 'pointer' }}>
                      Vitrine sur rue / Accès direct clients
                    </label>
                  </div>
                </div>
              ) : propertyType === 'Immeuble' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', padding: '14px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '4px' }}>
                      Nombre de niveaux (ex : R+2)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={floorsCount}
                      onChange={(e) => setFloorsCount(Number(e.target.value))}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.84rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '4px' }}>
                      Nombre total d'appartements / unités
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={unitsCount}
                      onChange={(e) => setUnitsCount(Number(e.target.value))}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.84rem' }}
                    />
                  </div>
                </div>
              ) : propertyType === 'Hôtel' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', padding: '14px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '4px' }}>
                      Nombre de chambres disponibles
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={bedrooms || 12}
                      onChange={(e) => setBedrooms(Number(e.target.value))}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.84rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '4px' }}>
                      Standing / Étoiles
                    </label>
                    <select
                      value={hotelStars}
                      onChange={(e) => setHotelStars(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.84rem', backgroundColor: '#ffffff' }}
                    >
                      <option value="Résidence hôtelière">Résidence hôtelière</option>
                      <option value="2 étoiles">2 étoiles</option>
                      <option value="3 étoiles">3 étoiles</option>
                      <option value="4 étoiles">4 étoiles</option>
                    </select>
                  </div>
                </div>
              ) : propertyType === 'Studio' || propertyType === 'Chambre' || propertyType === 'Chambre-salon' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '14px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '4px' }}>
                      Salle d'eau
                    </label>
                    <select
                      value={bathrooms}
                      onChange={(e) => setBathrooms(Number(e.target.value))}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.84rem', backgroundColor: '#ffffff' }}
                    >
                      <option value={1}>Salle d'eau privative</option>
                      <option value={0}>Partagée / externe</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '16px' }}>
                    <input
                      type="checkbox"
                      id="wiz_furn"
                      checked={isFurnished}
                      onChange={(e) => setIsFurnished(e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label htmlFor="wiz_furn" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)', cursor: 'pointer' }}>
                      Logement meublé (lit, armoire...)
                    </label>
                  </div>
                </div>
              ) : (
                /* Residential: Appartement, Maison, Villa, Meublé, Résidence */
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '5px' }}>
                      Nombre de chambres
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={bedrooms}
                      onChange={(e) => setBedrooms(Number(e.target.value))}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.88rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '5px' }}>
                      Salles d'eau / Salles de bain
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={bathrooms}
                      onChange={(e) => setBathrooms(Number(e.target.value))}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.88rem' }}
                    />
                  </div>
                </div>
              )}

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '5px' }}>
                  Description détaillée
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez les atouts majeurs, commodités incluses, conditions..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.85rem' }}
                />
              </div>
            </div>
          )}

          {/* STEP 3: LOCALISATION */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '5px' }}>
                    Département
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.88rem', backgroundColor: '#ffffff' }}
                  >
                    <option value="Littoral">Littoral (Cotonou)</option>
                    <option value="Atlantique">Atlantique (Calavi, Ouidah)</option>
                    <option value="Ouémé">Ouémé (Porto-Novo)</option>
                    <option value="Borgou">Borgou (Parakou)</option>
                    <option value="Zou">Zou (Bohicon, Abomey)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '5px' }}>
                    Ville / Commune *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ex : Cotonou"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '5px' }}>
                  Quartier *
                </label>
                <input
                  type="text"
                  required
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Ex : Cadjèhoun, Haie Vive, Fidjrossè, Arconville..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '5px' }}>
                  Repères & Adresse
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ex : Rue pavée, non loin de la pharmacie..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '4px' }}>
                    Latitude GPS
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={latitude}
                    onChange={(e) => setLatitude(Number(e.target.value))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '4px' }}>
                    Longitude GPS
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={longitude}
                    onChange={(e) => setLongitude(Number(e.target.value))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleUseCurrentPosition}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'var(--color-accent-hover)',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  width: 'fit-content',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                }}
              >
                <i className="fa-solid fa-location-crosshairs" />
                <span>Utiliser ma géolocalisation actuelle</span>
              </button>
            </div>
          )}

          {/* STEP 4: ÉQUIPEMENTS */}
          {step === 4 && (
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '14px' }}>
                Cochez les commodités disponibles pour ce bien :
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: '10px',
                }}
              >
                {ALL_AMENITIES.map((amenity) => {
                  const isChecked = selectedFeatures.includes(amenity.label);
                  return (
                    <button
                      key={amenity.id}
                      type="button"
                      onClick={() => handleToggleFeature(amenity.label)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        border: isChecked ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                        backgroundColor: isChecked ? 'var(--color-primary-light)' : '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className={`fa-solid ${amenity.icon}`} style={{ color: isChecked ? 'var(--color-primary)' : 'var(--color-text-muted)', fontSize: '0.9rem' }} />
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text)' }}>
                          {amenity.label}
                        </span>
                      </div>
                      {isChecked && <i className="fa-solid fa-check" style={{ color: 'var(--color-accent)', fontSize: '0.8rem' }} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: PHOTOS (REAL UPLOAD & TURSO STORAGE) */}
          {step === 5 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                  Photos réelles du bien ({images.length} ajoutée{images.length > 1 ? 's' : ''})
                </span>
                <span style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)' }}>
                  Format JPG, PNG, WEBP • Max 10 Mo
                </span>
              </div>

              {/* Hidden Real File Input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFilesChosen}
              />

              {/* Upload Dropzone */}
              <div
                onClick={() => {
                  if (!uploadingPhotos) fileInputRef.current?.click();
                }}
                style={{
                  border: '2px dashed var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '24px 16px',
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
                    <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.6rem', color: 'var(--color-primary)' }} />
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                      Téléversement et enregistrement en cours...
                    </span>
                    <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                      Veuillez patienter pendant l'écriture du fichier
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-primary-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-primary)',
                        fontSize: '1.2rem',
                      }}
                    >
                      <i className="fa-solid fa-cloud-arrow-up" />
                    </div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                      Sélectionner des photos depuis votre appareil
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                      Cliquez ici pour choisir des photos depuis votre téléphone ou ordinateur
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
                    backgroundColor: '#fee2e2',
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

              {/* Image Previews Grid with Delete */}
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '8px' }}>
                  Aperçu des photos ({images.length})
                </span>

                {images.length === 0 ? (
                  <div
                    style={{
                      padding: '24px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--color-bg)',
                      textAlign: 'center',
                      color: 'var(--color-text-muted)',
                      fontSize: '0.82rem',
                    }}
                  >
                    <i className="fa-regular fa-image" style={{ fontSize: '1.6rem', display: 'block', marginBottom: '6px', color: '#94a3b8' }} />
                    Aucune photo ajoutée pour l'instant. Ajoutez au moins 1 photo représentative.
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                      gap: '10px',
                    }}
                  >
                    {images.map((img, i) => (
                      <div
                        key={i}
                        style={{
                          position: 'relative',
                          height: '95px',
                          borderRadius: 'var(--radius-md)',
                          overflow: 'hidden',
                          border: i === 0 ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                          boxShadow: 'var(--shadow-xs)',
                        }}
                      >
                        <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {i === 0 && (
                          <span
                            style={{
                              position: 'absolute',
                              bottom: '4px',
                              left: '4px',
                              backgroundColor: 'var(--color-primary)',
                              color: '#ffffff',
                              fontSize: '0.62rem',
                              fontWeight: 700,
                              padding: '2px 5px',
                              borderRadius: '3px',
                            }}
                          >
                            Principale
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(i)}
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(239, 68, 68, 0.95)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.65rem',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                          title="Supprimer cette photo"
                        >
                          <i className="fa-solid fa-xmark" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 6: CONTACT */}
          {step === 6 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '5px' }}>
                  Numéro de téléphone d'appel (+229) *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+229 97 00 12 34"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '5px' }}>
                  Numéro WhatsApp (+229) *
                </label>
                <input
                  type="tel"
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+229 97 00 12 34"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '5px' }}>
                  Adresse Email (facultatif)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@exemple.com"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.88rem' }}
                />
              </div>
            </div>
          )}

          {/* STEP 7: CONFIRMATION & PUBLICATION */}
          {step === 7 && (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.6rem',
                  margin: '0 auto 12px',
                }}
              >
                <i className="fa-solid fa-paper-plane" />
              </div>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '6px' }}>
                Prêt à publier votre bien ?
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', maxWidth: '440px', margin: '0 auto 20px' }}>
                Votre annonce sera enregistrée dans Turso, immédiatement visible sur la plateforme, avec ses photos et son lien partageable direct.
              </p>

              {/* Summary Card */}
              <div
                style={{
                  backgroundColor: 'var(--color-bg)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '16px',
                  textAlign: 'left',
                  marginBottom: '20px',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-primary)' }}>
                    {title || `${propertyType} à ${city}`}
                  </span>
                  <span style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '0.92rem' }}>
                    {price ? `${Number(price).toLocaleString('fr-FR')} FCFA` : 'Non précisé'} {transactionType === 'RENT' ? priceUnit : ''}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <span><i className="fa-solid fa-building" /> {propertyType}</span>
                  <span><i className="fa-solid fa-tag" /> {transactionType === 'RENT' ? 'Location' : 'Vente'}</span>
                  <span><i className="fa-solid fa-location-dot" /> {neighborhood}, {city}</span>
                  <span><i className="fa-solid fa-camera" /> {images.length} photo(s)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#ffffff',
          }}
        >
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="btn btn-secondary btn-sm"
            >
              <i className="fa-solid fa-arrow-left" />
              <span>Précédent</span>
            </button>
          ) : (
            <div />
          )}

          {step < 7 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="btn btn-primary btn-sm"
              style={{ padding: '8px 20px' }}
            >
              <span>Suivant</span>
              <i className="fa-solid fa-arrow-right" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleFinalSubmit}
              className="btn btn-primary"
              style={{ padding: '10px 24px', gap: '8px' }}
            >
              {isSubmitting ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin" />
                  <span>Enregistrement en cours...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check" />
                  <span>Confirmer et Publier</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
