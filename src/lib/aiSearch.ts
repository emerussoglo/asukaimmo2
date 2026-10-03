import { FilterState, PropertyType, TransactionType } from '../types';

export interface AIParsedResult {
  detectedCity?: string;
  detectedType?: PropertyType;
  detectedTransaction?: TransactionType;
  detectedMaxPrice?: number;
  detectedBedrooms?: number;
  detectedFurnished?: boolean;
  explanation: string;
  matchingFilters: Partial<FilterState>;
}

export function parseNaturalLanguageQuery(query: string): AIParsedResult {
  const text = query.toLowerCase().trim();

  let detectedCity: string | undefined;
  let detectedType: PropertyType | undefined;
  let detectedTransaction: TransactionType | undefined;
  let detectedMaxPrice: number | undefined;
  let detectedBedrooms: number | undefined;
  let detectedFurnished: boolean | undefined;

  // City detection
  if (text.includes('cotonou')) detectedCity = 'Cotonou';
  else if (text.includes('calavi') || text.includes('abomey-calavi')) detectedCity = 'Abomey-Calavi';
  else if (text.includes('porto-novo') || text.includes('porto')) detectedCity = 'Porto-Novo';
  else if (text.includes('ouidah')) detectedCity = 'Ouidah';
  else if (text.includes('parakou')) detectedCity = 'Parakou';
  else if (text.includes('bohicon')) detectedCity = 'Bohicon';

  // Transaction type
  if (text.includes('louer') || text.includes('location') || text.includes('loyer')) {
    detectedTransaction = 'RENT';
  } else if (text.includes('vendre') || text.includes('achat') || text.includes('acheter') || text.includes('vente')) {
    detectedTransaction = 'SALE';
  }

  // Property type
  if (text.includes('appartement')) detectedType = 'Appartement';
  else if (text.includes('villa')) detectedType = 'Villa';
  else if (text.includes('studio')) detectedType = 'Studio';
  else if (text.includes('maison')) detectedType = 'Maison';
  else if (text.includes('chambre-salon') || text.includes('chambre salon')) detectedType = 'Chambre-salon';
  else if (text.includes('chambre')) detectedType = 'Chambre';
  else if (text.includes('terrain') || text.includes('parcelle')) detectedType = 'Terrain';
  else if (text.includes('bureau')) detectedType = 'Bureau';
  else if (text.includes('boutique') || text.includes('magasin')) detectedType = 'Boutique';
  else if (text.includes('immeuble')) detectedType = 'Immeuble';
  else if (text.includes('résidence') || text.includes('residence')) detectedType = 'Résidence';
  else if (text.includes('meublé') || text.includes('meuble')) {
    detectedFurnished = true;
    detectedType = 'Meublé';
  }

  if (text.includes('meublé') || text.includes('meuble')) {
    detectedFurnished = true;
  }

  // Bedroom extraction: e.g. "2 chambres", "3 pièces", "1 chambre"
  const bedroomMatch = text.match(/(\d+)\s*(?:chambres?|ch|pièces?)/);
  if (bedroomMatch) {
    detectedBedrooms = parseInt(bedroomMatch[1], 10);
  }

  // Price extraction: e.g. "150 000", "150000", "200k", "50 millions"
  const priceMatches = text.match(/(?:moins de|budget|max|pour|maximum)?\s*([0-9\s.,]+)\s*(?:fcfa|f cfa|cfa|francs?|m|millions?|k)?/gi);
  if (priceMatches) {
    for (const match of priceMatches) {
      const cleanNums = match.replace(/[^0-9]/g, '');
      if (cleanNums && cleanNums.length >= 4) {
        const val = parseInt(cleanNums, 10);
        if (val > 10000 && val < 500000000) {
          detectedMaxPrice = val;
          break;
        }
      }
    }
  }

  // If millions was mentioned
  if (text.includes('million')) {
    const millionMatch = text.match(/(\d+)\s*millions?/);
    if (millionMatch) {
      detectedMaxPrice = parseInt(millionMatch[1], 10) * 1000000;
    }
  }

  // Build clean explanations
  const detectedParts: string[] = [];
  if (detectedType) detectedParts.push(`Type : ${detectedType}`);
  if (detectedCity) detectedParts.push(`Ville : ${detectedCity}`);
  if (detectedBedrooms) detectedParts.push(`${detectedBedrooms} chambre(s)`);
  if (detectedMaxPrice) detectedParts.push(`Budget max : ${detectedMaxPrice.toLocaleString('fr-FR')} FCFA`);
  if (detectedTransaction) detectedParts.push(`Transaction : ${detectedTransaction === 'RENT' ? 'À louer' : 'À vendre'}`);
  if (detectedFurnished) detectedParts.push(`Meublé`);

  const explanation =
    detectedParts.length > 0
      ? `Recherche IA démo : ${detectedParts.join(' • ')}`
      : `Recherche textuelle pour : "${query}"`;

  const matchingFilters: Partial<FilterState> = {
    keyword: query,
    ...(detectedCity ? { city: detectedCity } : {}),
    ...(detectedType ? { propertyType: detectedType } : {}),
    ...(detectedTransaction ? { transactionType: detectedTransaction } : {}),
    ...(detectedMaxPrice ? { maxPrice: detectedMaxPrice } : {}),
    ...(detectedBedrooms ? { bedrooms: detectedBedrooms } : {}),
    ...(detectedFurnished !== undefined ? { isFurnished: detectedFurnished } : {}),
  };

  return {
    detectedCity,
    detectedType,
    detectedTransaction,
    detectedMaxPrice,
    detectedBedrooms,
    detectedFurnished,
    explanation,
    matchingFilters,
  };
}
