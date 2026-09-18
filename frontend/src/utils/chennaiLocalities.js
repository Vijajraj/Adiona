/**
 * Curated high-precision coordinates for major Chennai localities, transit hubs, and landmarks.
 * Provides sub-millisecond instant autocomplete before falling back to remote geocoding.
 */

export const CHENNAI_LOCALITIES = [
  // Central Chennai
  { name: 'T. Nagar (Thyagaraya Nagar)', shortName: 'T. Nagar', category: 'Shopping Hub', lat: 13.0418, lng: 80.2341 },
  { name: 'Pondy Bazaar', shortName: 'Pondy Bazaar', category: 'Commercial Hub', lat: 13.0402, lng: 80.2393 },
  { name: 'Nungambakkam', shortName: 'Nungambakkam', category: 'Commercial & Residential', lat: 13.0569, lng: 80.2425 },
  { name: 'Kodambakkam', shortName: 'Kodambakkam', category: 'Transit & Residential', lat: 13.0528, lng: 80.2254 },
  { name: 'Egmore', shortName: 'Egmore', category: 'Railway Station & Hub', lat: 13.0827, lng: 80.2607 },
  { name: 'Chennai Central Railway Station', shortName: 'Chennai Central', category: 'Major Railway Terminus', lat: 13.0827, lng: 80.2757 },
  { name: 'Parry\'s Corner / George Town', shortName: 'Parry\'s Corner', category: 'Commercial & Port', lat: 13.0891, lng: 80.2882 },
  { name: 'Royapettah', shortName: 'Royapettah', category: 'Central Commercial', lat: 13.0537, lng: 80.2603 },
  { name: 'Triplicane', shortName: 'Triplicane', category: 'Historic Locality', lat: 13.0587, lng: 80.2755 },
  { name: 'Thousand Lights', shortName: 'Thousand Lights', category: 'Anna Salai Corridor', lat: 13.0601, lng: 80.2526 },
  { name: 'Alwarpet', shortName: 'Alwarpet', category: 'Residential & Cafes', lat: 13.0334, lng: 80.2514 },
  { name: 'Teynampet', shortName: 'Teynampet', category: 'Central Arterial', lat: 13.0405, lng: 80.2504 },
  { name: 'Mylapore', shortName: 'Mylapore', category: 'Cultural & Historic', lat: 13.0368, lng: 80.2676 },
  { name: 'Mandaveli', shortName: 'Mandaveli', category: 'Residential Hub', lat: 13.0280, lng: 80.2612 },
  { name: 'Chetpet', shortName: 'Chetpet', category: 'Central Residential', lat: 13.0716, lng: 80.2415 },
  { name: 'Kilpauk', shortName: 'Kilpauk', category: 'Medical & Residential', lat: 13.0784, lng: 80.2412 },

  // South Chennai & Coastal
  { name: 'Adyar', shortName: 'Adyar', category: 'Residential & Commercial', lat: 13.0012, lng: 80.2565 },
  { name: 'Besant Nagar (Elliot\'s Beach)', shortName: 'Besant Nagar', category: 'Beach Promenade', lat: 12.9982, lng: 80.2668 },
  { name: 'Thiruvanmiyur', shortName: 'Thiruvanmiyur', category: 'Coastal & Transit Hub', lat: 12.9830, lng: 80.2594 },
  { name: 'Kotturpuram', shortName: 'Kotturpuram', category: 'Anna University Area', lat: 13.0169, lng: 80.2416 },
  { name: 'Marina Beach Promenade', shortName: 'Marina Beach', category: 'Promenade & Landmark', lat: 13.0500, lng: 80.2824 },
  { name: 'Santhome Cathedral & Beach', shortName: 'Santhome', category: 'Coastal Landmark', lat: 13.0332, lng: 80.2785 },
  { name: 'RA Puram (Raja Annamalaipuram)', shortName: 'RA Puram', category: 'Residential', lat: 13.0232, lng: 80.2560 },
  { name: 'Saidapet', shortName: 'Saidapet', category: 'Transit & Metro Hub', lat: 13.0213, lng: 80.2231 },
  { name: 'Guindy', shortName: 'Guindy', category: 'Industrial & Metro Hub', lat: 13.0067, lng: 80.2025 },
  { name: 'IIT Madras Campus', shortName: 'IIT Madras', category: 'Institutional Hub', lat: 12.9915, lng: 80.2337 },

  // IT Corridor (OMR) & ECR
  { name: 'Perungudi (OMR Phase 1)', shortName: 'Perungudi', category: 'IT Corridor', lat: 12.9654, lng: 80.2461 },
  { name: 'Kandanchavadi', shortName: 'Kandanchavadi', category: 'IT Express Highway', lat: 12.9680, lng: 80.2450 },
  { name: 'Thoraipakkam', shortName: 'Thoraipakkam', category: 'OMR Junction', lat: 12.9416, lng: 80.2362 },
  { name: 'Sholinganallur Junction', shortName: 'Sholinganallur', category: 'Major IT Hub', lat: 12.9010, lng: 80.2279 },
  { name: 'Karapakkam', shortName: 'Karapakkam', category: 'OMR Tech Parks', lat: 12.9165, lng: 80.2298 },
  { name: 'Navalur (OMR)', shortName: 'Navalur', category: 'Tech Park & Commercial', lat: 12.8458, lng: 80.2265 },
  { name: 'Siruseri SIPCOT IT Park', shortName: 'Siruseri', category: 'SIPCOT Tech Zone', lat: 12.8256, lng: 80.2185 },
  { name: 'Palavakkam (ECR)', shortName: 'Palavakkam', category: 'East Coast Road', lat: 12.9602, lng: 80.2582 },
  { name: 'Neelankarai (ECR)', shortName: 'Neelankarai', category: 'ECR Coastal', lat: 12.9492, lng: 80.2580 },
  { name: 'Injambakkam', shortName: 'Injambakkam', category: 'ECR Corridor', lat: 12.9213, lng: 80.2530 },

  // South-West & Transit Suburbs
  { name: 'Velachery', shortName: 'Velachery', category: 'Commercial & MRTS Hub', lat: 12.9759, lng: 80.2212 },
  { name: 'Phoenix Marketcity (Velachery)', shortName: 'Phoenix Marketcity', category: 'Shopping Destination', lat: 12.9918, lng: 80.2170 },
  { name: 'Madipakkam', shortName: 'Madipakkam', category: 'Residential Hub', lat: 12.9623, lng: 80.1986 },
  { name: 'Pallikaranai', shortName: 'Pallikaranai', category: 'Residential Area', lat: 12.9349, lng: 80.2137 },
  { name: 'Medavakkam', shortName: 'Medavakkam', category: 'South Suburb Hub', lat: 12.9171, lng: 80.1923 },
  { name: 'Nanganallur', shortName: 'Nanganallur', category: 'Temple Locality', lat: 12.9807, lng: 80.1873 },
  { name: 'Alandur Metro Station', shortName: 'Alandur', category: 'Metro Interchange', lat: 13.0040, lng: 80.2015 },
  { name: 'Chennai International Airport (Meenambakkam)', shortName: 'Chennai Airport', category: 'Airport Terminal', lat: 12.9941, lng: 80.1709 },
  { name: 'Pallavaram', shortName: 'Pallavaram', category: 'Railway & Suburb', lat: 12.9675, lng: 80.1491 },
  { name: 'Chromepet', shortName: 'Chromepet', category: 'Commercial & Suburb', lat: 12.9516, lng: 80.1462 },
  { name: 'Tambaram West / Bus Stand', shortName: 'Tambaram', category: 'Major Railway & Bus Hub', lat: 12.9249, lng: 80.1000 },
  { name: 'Tambaram East', shortName: 'Tambaram East', category: 'Residential & Transit', lat: 12.9226, lng: 80.1275 },
  { name: 'Perungalathur', shortName: 'Perungalathur', category: 'South Entry Hub', lat: 12.9054, lng: 80.0898 },

  // West & North-West
  { name: 'Anna Nagar (Roundtana & Tower)', shortName: 'Anna Nagar', category: 'Prime Residential & Retail', lat: 13.0850, lng: 80.2101 },
  { name: 'Anna Nagar West', shortName: 'Anna Nagar West', category: 'Bus Depot & Residential', lat: 13.0903, lng: 80.1972 },
  { name: 'Shenoy Nagar', shortName: 'Shenoy Nagar', category: 'Metro & Residential', lat: 13.0787, lng: 80.2258 },
  { name: 'Koyambedu (CMBT)', shortName: 'Koyambedu CMBT', category: 'Inter-State Bus Terminus', lat: 13.0694, lng: 80.2056 },
  { name: 'Vadapalani (Murugan Temple / Mall)', shortName: 'Vadapalani', category: 'Metro & Commercial Hub', lat: 13.0500, lng: 80.2121 },
  { name: 'Ashok Nagar', shortName: 'Ashok Nagar', category: 'Residential & Metro', lat: 13.0373, lng: 80.2123 },
  { name: 'KK Nagar (Kalaignar Karunanidhi Nagar)', shortName: 'KK Nagar', category: 'Residential Hub', lat: 13.0410, lng: 80.1994 },
  { name: 'West Mambalam', shortName: 'West Mambalam', category: 'Residential & Station', lat: 13.0382, lng: 80.2228 },
  { name: 'Virugambakkam', shortName: 'Virugambakkam', category: 'Arcot Road Corridor', lat: 13.0531, lng: 80.1923 },
  { name: 'Porur Junction', shortName: 'Porur', category: 'West Commercial Hub', lat: 13.0382, lng: 80.1565 },
  { name: 'DLF IT Park (Ramapuram / Manapakkam)', shortName: 'DLF IT Park', category: 'Major Tech Park', lat: 13.0298, lng: 80.1764 },
  { name: 'Mogappair (East / West)', shortName: 'Mogappair', category: 'Residential Suburb', lat: 13.0837, lng: 80.1742 },
  { name: 'Ambattur Industrial Estate', shortName: 'Ambattur', category: 'Industrial & IT Hub', lat: 13.0978, lng: 80.1613 },
  { name: 'Korattur', shortName: 'Korattur', category: 'Lake & Residential', lat: 13.1118, lng: 80.1837 },
  { name: 'Villivakkam', shortName: 'Villivakkam', category: 'Railway & Suburb', lat: 13.1075, lng: 80.2058 },
  { name: 'Kolathur', shortName: 'Kolathur', category: 'North-West Hub', lat: 13.1235, lng: 80.2173 },
  { name: 'Perambur (Loco Works)', shortName: 'Perambur', category: 'Railway Hub', lat: 13.1089, lng: 80.2443 },
  { name: 'Washermanpet', shortName: 'Washermanpet', category: 'North Chennai Metro', lat: 13.1092, lng: 80.2831 },
  { name: 'Royapuram', shortName: 'Royapuram', category: 'Historic Railway Station', lat: 13.1112, lng: 80.2947 },
];

/**
 * Fast search helper that filters curated localities with prefix and substring matching.
 */
export function searchLocalLocalities(query, limit = 6) {
  if (!query || query.trim().length < 1) return [];
  const clean = query.trim().toLowerCase();

  const exactMatches = [];
  const prefixMatches = [];
  const substringMatches = [];

  for (const item of CHENNAI_LOCALITIES) {
    const nameLower = item.name.toLowerCase();
    const shortLower = item.shortName.toLowerCase();

    if (shortLower === clean || nameLower === clean) {
      exactMatches.push(item);
    } else if (shortLower.startsWith(clean) || nameLower.startsWith(clean)) {
      prefixMatches.push(item);
    } else if (shortLower.includes(clean) || nameLower.includes(clean) || item.category.toLowerCase().includes(clean)) {
      substringMatches.push(item);
    }
  }

  const combined = [...exactMatches, ...prefixMatches, ...substringMatches];
  return combined.slice(0, limit);
}
