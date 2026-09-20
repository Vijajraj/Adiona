/**
 * Curated high-precision coordinates for major Chennai localities, transit hubs, and landmarks.
 * Provides sub-millisecond instant autocomplete with aliases before falling back to remote geocoding.
 */

export const CHENNAI_LOCALITIES = [
  // Central Chennai & Arterial Corridors
  {
    name: 'T. Nagar (Thyagaraya Nagar)',
    shortName: 'T. Nagar',
    category: 'Shopping Hub',
    lat: 13.0418,
    lng: 80.2341,
    aliases: ['t nagar', 'thyagaraya nagar', 'panagal park', 'rameswaram road', 'usman road'],
  },
  {
    name: 'Pondy Bazaar',
    shortName: 'Pondy Bazaar',
    category: 'Commercial Hub',
    lat: 13.0402,
    lng: 80.2393,
    aliases: ['pondy bazar', 'pedestrian plaza', 'sir thyagaraya road'],
  },
  {
    name: 'Nungambakkam',
    shortName: 'Nungambakkam',
    category: 'Commercial & Residential',
    lat: 13.0569,
    lng: 80.2425,
    aliases: ['nungambakkam high road', 'nhr', 'sterling road', 'college road', 'valluvar kottam'],
  },
  {
    name: 'Kodambakkam',
    shortName: 'Kodambakkam',
    category: 'Transit & Residential',
    lat: 13.0528,
    lng: 80.2254,
    aliases: ['kodambakkam bridge', 'subway', 'meenakshi college', 'power house'],
  },
  {
    name: 'Egmore',
    shortName: 'Egmore',
    category: 'Railway Station & Hub',
    lat: 13.0827,
    lng: 80.2607,
    aliases: ['egmore station', 'gandhi irwin road', 'museum', 'cooum'],
  },
  {
    name: 'Chennai Central Railway Station',
    shortName: 'Chennai Central',
    category: 'Major Railway Terminus',
    lat: 13.0827,
    lng: 80.2757,
    aliases: ['central', 'puratchi thalaivar dr mg ramachandran central', 'mgr central', 'park station', 'ripon building'],
  },
  {
    name: 'Rajiv Gandhi Government General Hospital (GH)',
    shortName: 'Madras Medical College / GH',
    category: 'Tertiary Hospital',
    lat: 13.0805,
    lng: 80.2778,
    aliases: ['gh', 'general hospital', 'mmc', 'park town gh'],
  },
  {
    name: 'Parry\'s Corner / George Town',
    shortName: 'Parry\'s Corner',
    category: 'Commercial & Port Hub',
    lat: 13.0891,
    lng: 80.2882,
    aliases: ['parrys', 'george town', 'high court', 'dare house', 'nsck bose road'],
  },
  {
    name: 'Sowcarpet & Broadway',
    shortName: 'Sowcarpet',
    category: 'Wholesale & Retail Hub',
    lat: 13.0935,
    lng: 80.2798,
    aliases: ['sowcarpeta', 'mint street', 'broadway bus stand', 'kasi chetty street'],
  },
  {
    name: 'Royapettah',
    shortName: 'Royapettah',
    category: 'Central Commercial',
    lat: 13.0537,
    lng: 80.2603,
    aliases: ['royapetta', 'royapettah high road', 'clock tower', 'royapettah hospital'],
  },
  {
    name: 'Express Avenue Mall',
    shortName: 'Express Avenue (EA)',
    category: 'Shopping Destination',
    lat: 13.0587,
    lng: 80.2642,
    aliases: ['ea mall', 'express avenue', 'whites road', 'royapettah mall'],
  },
  {
    name: 'Spencer Plaza / Mount Road',
    shortName: 'Spencer Plaza',
    category: 'Commercial Landmark',
    lat: 13.0620,
    lng: 80.2605,
    aliases: ['spencers', 'mount road', 'anna salai spencer', 'thousand lights metro'],
  },
  {
    name: 'Triplicane',
    shortName: 'Triplicane',
    category: 'Historic Locality',
    lat: 13.0587,
    lng: 80.2755,
    aliases: ['thiruvallikeni', 'parthasarathy temple', 'triplicane high road'],
  },
  {
    name: 'Chepauk (MA Chidambaram Stadium)',
    shortName: 'Chepauk',
    category: 'Sports & Govt Corridor',
    lat: 13.0628,
    lng: 80.2794,
    aliases: ['chepauk stadium', 'cric stadium', 'ezhilagam', 'bell road'],
  },
  {
    name: 'Thousand Lights',
    shortName: 'Thousand Lights',
    category: 'Anna Salai Corridor',
    lat: 13.0601,
    lng: 80.2526,
    aliases: ['thousand lights mosque', 'greams road', 'apollo hospital greams road'],
  },
  {
    name: 'Alwarpet',
    shortName: 'Alwarpet',
    category: 'Residential & Cafes',
    lat: 13.0334,
    lng: 80.2514,
    aliases: ['tt k road', 'alwarpet signal', 'eldams road', 'cp ramaswamy road'],
  },
  {
    name: 'Teynampet',
    shortName: 'Teynampet',
    category: 'Central Arterial',
    lat: 13.0405,
    lng: 80.2504,
    aliases: ['teynampet signal', 'siet college', 'dmk head office', 'anna arivalayam'],
  },
  {
    name: 'Mylapore',
    shortName: 'Mylapore',
    category: 'Cultural & Historic',
    lat: 13.0368,
    lng: 80.2676,
    aliases: ['kapaleeshwarar temple', 'luz corner', 'luz church road', 'kutchery road'],
  },
  {
    name: 'Mandaveli',
    shortName: 'Mandaveli',
    category: 'Residential & MRTS',
    lat: 13.0280,
    lng: 80.2612,
    aliases: ['mandavelipakkam', 'st marys road', 'mandaveli station', 'rk mutt road'],
  },
  {
    name: 'RA Puram (Raja Annamalaipuram)',
    shortName: 'RA Puram',
    category: 'Upscale Residential',
    lat: 13.0232,
    lng: 80.2560,
    aliases: ['raja annamalaipuram', 'sangeetha ra puram', 'billroth hospital'],
  },
  {
    name: 'Chetpet',
    shortName: 'Chetpet',
    category: 'Central Residential & Eco Park',
    lat: 13.0716,
    lng: 80.2415,
    aliases: ['chetpet eco park', 'harrington road', 'mcc school', 'chetpet signal'],
  },
  {
    name: 'Kilpauk',
    shortName: 'Kilpauk',
    category: 'Medical & Residential',
    lat: 13.0784,
    lng: 80.2412,
    aliases: ['kmc', 'kilpauk medical college', 'ormes road', 'poonamallee high road kilpauk'],
  },
  {
    name: 'Purasaivakkam & Kellys',
    shortName: 'Purasaivakkam',
    category: 'Shopping & Historic Hub',
    lat: 13.0864,
    lng: 80.2543,
    aliases: ['purasawalkam', 'doveton', 'kellys', 'gangadeeshwarar temple', 'tana street'],
  },
  {
    name: 'Vepery & Periamet',
    shortName: 'Vepery',
    category: 'Institutional & Veterinary',
    lat: 13.0850,
    lng: 80.2650,
    aliases: ['vepery high road', 'police commissioner office', 'veterinary college', 'periamet'],
  },

  // South Chennai & Coastal Promenade
  {
    name: 'Adyar',
    shortName: 'Adyar',
    category: 'Residential & Commercial',
    lat: 13.0012,
    lng: 80.2565,
    aliases: ['adyar signal', 'gandhi nagar', 'sardar patel road', 'adyar depot'],
  },
  {
    name: 'Besant Nagar (Elliot\'s Beach)',
    shortName: 'Besant Nagar',
    category: 'Beach Promenade & Cafes',
    lat: 12.9982,
    lng: 80.2668,
    aliases: ['elliots beach', 'bessie', 'schmidt memorial', 'velankanni church besant nagar'],
  },
  {
    name: 'Thiruvanmiyur',
    shortName: 'Thiruvanmiyur',
    category: 'Coastal & Transit Hub',
    lat: 12.9830,
    lng: 80.2594,
    aliases: ['thiruvanmiyur beach', 'marundeeswarar temple', 'thiruvanmiyur bus stand', 'valmiki nagar'],
  },
  {
    name: 'Kotturpuram',
    shortName: 'Kotturpuram',
    category: 'Institutional & Riverfront',
    lat: 13.0169,
    lng: 80.2416,
    aliases: ['anna centenary library', 'kottur', 'gandhi mandapam road'],
  },
  {
    name: 'Marina Beach Promenade',
    shortName: 'Marina Beach',
    category: 'Promenade & Landmark',
    lat: 13.0500,
    lng: 80.2824,
    aliases: ['marina', 'kamarajar salai', 'lighthouse', 'kannagi statue', 'mgr memorial'],
  },
  {
    name: 'Santhome Cathedral & Foreshore Estate',
    shortName: 'Santhome',
    category: 'Coastal Landmark',
    lat: 13.0332,
    lng: 80.2785,
    aliases: ['santhome basilica', 'foreshore estate', 'pattinapakkam', 'dooming kuppam'],
  },
  {
    name: 'MRC Nagar',
    shortName: 'MRC Nagar',
    category: 'Corporate & Coastal Hub',
    lat: 13.0185,
    lng: 80.2740,
    aliases: ['leela palace', 'sun tv office', 'raja muthiah puram', 'ayyapakkam road'],
  },
  {
    name: 'Saidapet',
    shortName: 'Saidapet',
    category: 'Transit & Metro Hub',
    lat: 13.0213,
    lng: 80.2231,
    aliases: ['saidapet court', 'saidapet bus stand', 'saidapet metro', 'panagal building'],
  },
  {
    name: 'Guindy & Kathipara',
    shortName: 'Guindy',
    category: 'Transit Interchange & Industrial',
    lat: 13.0067,
    lng: 80.2025,
    aliases: ['kathipara', 'kathipara junction', 'guindy station', 'guindy national park', 'olympia tech park'],
  },
  {
    name: 'IIT Madras Campus',
    shortName: 'IIT Madras',
    category: 'Premier Institute',
    lat: 12.9915,
    lng: 80.2337,
    aliases: ['iitm', 'iit campus', 'taramani gate', 'clri'],
  },

  // IT Corridor (OMR) & ECR
  {
    name: 'Perungudi (OMR Phase 1)',
    shortName: 'Perungudi',
    category: 'IT Corridor & Tollgate',
    lat: 12.9654,
    lng: 80.2461,
    aliases: ['perungudi toll', 'kandanchavadi omr', 'world trade center', 'wtc chennai'],
  },
  {
    name: 'Kandanchavadi',
    shortName: 'Kandanchavadi',
    category: 'IT Express Highway',
    lat: 12.9680,
    lng: 80.2450,
    aliases: ['kandanchavadi signal', 'omr kandanchavadi', 'rmz millenia'],
  },
  {
    name: 'Thoraipakkam',
    shortName: 'Thoraipakkam',
    category: 'OMR Junction & Residential',
    lat: 12.9416,
    lng: 80.2362,
    aliases: ['tidel park 2', 'thoraipakkam junction', '200 feet radial road junction', 'omr toll'],
  },
  {
    name: 'Sholinganallur Junction',
    shortName: 'Sholinganallur',
    category: 'Major IT Hub & Crossway',
    lat: 12.9010,
    lng: 80.2279,
    aliases: ['sholing', 'sholinganallur signal', 'elcot sez', 'infosys omr', 'wipro omr'],
  },
  {
    name: 'Karapakkam',
    shortName: 'Karapakkam',
    category: 'OMR Tech Parks',
    lat: 12.9165,
    lng: 80.2298,
    aliases: ['tcs karapakkam', 'cognizant karapakkam', 'kcg college'],
  },
  {
    name: 'Navalur (OMR)',
    shortName: 'Navalur',
    category: 'Tech Park & Commercial Hub',
    lat: 12.8458,
    lng: 80.2265,
    aliases: ['navalur toll', 'vivira mall', 'marina mall omr', 'egattur'],
  },
  {
    name: 'Siruseri SIPCOT IT Park',
    shortName: 'Siruseri',
    category: 'SIPCOT Tech Zone',
    lat: 12.8256,
    lng: 80.2185,
    aliases: ['siruseri sipcot', 'tcs siruseri', 'omr end', 'sipcot it park'],
  },
  {
    name: 'Kelambakkam Junction',
    shortName: 'Kelambakkam',
    category: 'OMR - ECR Crossroad',
    lat: 12.7885,
    lng: 80.2188,
    aliases: ['kelambakkam bus stand', 'cheyyur road', 'vandalur kelambakkam road'],
  },
  {
    name: 'Kottivakkam (ECR)',
    shortName: 'Kottivakkam',
    category: 'ECR Residential & Beach',
    lat: 12.9730,
    lng: 80.2585,
    aliases: ['kottivakkam beach', 'ecr first toll', 'palavakkam link'],
  },
  {
    name: 'Palavakkam (ECR)',
    shortName: 'Palavakkam',
    category: 'East Coast Road Suburb',
    lat: 12.9602,
    lng: 80.2582,
    aliases: ['palavakkam beach', 'ecr palavakkam'],
  },
  {
    name: 'Neelankarai (ECR)',
    shortName: 'Neelankarai',
    category: 'ECR Coastal Haven',
    lat: 12.9492,
    lng: 80.2580,
    aliases: ['neelankarai beach', 'buyani road', 'casuarina drive'],
  },
  {
    name: 'Injambakkam & Akkarai',
    shortName: 'Injambakkam',
    category: 'ECR Cultural & Beach Corridor',
    lat: 12.9213,
    lng: 80.2530,
    aliases: ['akkarai beach', 'prarthana drive-in', 'vgp universal kingdom', 'iskcon chennai'],
  },
  {
    name: 'Kovalam Beach & Muttukadu',
    shortName: 'Kovalam (Covelong)',
    category: 'Coastal Resort & Water Sports',
    lat: 12.7933,
    lng: 80.2514,
    aliases: ['covelong', 'kovalam ecr', 'muttukadu boat house', 'surf school'],
  },

  // South-West & Transit Suburbs
  {
    name: 'Velachery',
    shortName: 'Velachery',
    category: 'Commercial & MRTS Hub',
    lat: 12.9759,
    lng: 80.2212,
    aliases: ['velachery station', 'vijaya nagar', 'velachery bypass', 'kaiveli'],
  },
  {
    name: 'Phoenix Marketcity (Velachery)',
    shortName: 'Phoenix Marketcity',
    category: 'Shopping & Entertainment',
    lat: 12.9918,
    lng: 80.2170,
    aliases: ['phoenix mall', 'palladium', 'velachery mall'],
  },
  {
    name: 'Madipakkam',
    shortName: 'Madipakkam',
    category: 'Residential Hub',
    lat: 12.9623,
    lng: 80.1986,
    aliases: ['koot road', 'madipakkam lake', 'puzhuthivakkam', 'ullagaram'],
  },
  {
    name: 'Pallikaranai & Marshland',
    shortName: 'Pallikaranai',
    category: 'Residential & Eco Zone',
    lat: 12.9349,
    lng: 80.2137,
    aliases: ['pallikaranai marsh', 'oil mill bus stop', 'kamakshi hospital'],
  },
  {
    name: 'Medavakkam',
    shortName: 'Medavakkam',
    category: 'South Suburb Flyover Hub',
    lat: 12.9171,
    lng: 80.1923,
    aliases: ['medavakkam junction', 'medavakkam flyover', 'perumbakkam junction', 'nanmangalam'],
  },
  {
    name: 'Nanganallur',
    shortName: 'Nanganallur',
    category: 'Heritage & Residential',
    lat: 12.9807,
    lng: 80.1873,
    aliases: ['anjaneyar temple', 'pazhavanthangal', 'nanganallur market'],
  },
  {
    name: 'Alandur Metro Station',
    shortName: 'Alandur',
    category: 'Metro Interchange Hub',
    lat: 13.0040,
    lng: 80.2015,
    aliases: ['alandur court', 'asarkhana', 'alandur metro'],
  },
  {
    name: 'Chennai International Airport (Meenambakkam)',
    shortName: 'Chennai Airport',
    category: 'Airport Terminal',
    lat: 12.9941,
    lng: 80.1709,
    aliases: ['airport', 'maa airport', 'meenambakkam', 'domestic terminal', 'international terminal', 'aerodrome'],
  },
  {
    name: 'Pallavaram',
    shortName: 'Pallavaram',
    category: 'Railway & Suburb Hub',
    lat: 12.9675,
    lng: 80.1491,
    aliases: ['pallavaram flyover', 'cantonment', 'tirusulam', 'pallavaram shandy'],
  },
  {
    name: 'Chromepet',
    shortName: 'Chromepet',
    category: 'Commercial & Retail Suburb',
    lat: 12.9516,
    lng: 80.1462,
    aliases: ['mit bridge', 'clc works road', 'saravana stores chromepet', 'hasthinapuram signal'],
  },
  {
    name: 'Tambaram Sanatorium (MEPZ)',
    shortName: 'Tambaram Sanatorium',
    category: 'Export Zone & Railway Station',
    lat: 12.9372,
    lng: 80.1342,
    aliases: ['sanatorium', 'mepz', 'special economic zone', 'tb hospital'],
  },
  {
    name: 'Tambaram West / Bus Stand',
    shortName: 'Tambaram',
    category: 'Major Railway & Gateway Hub',
    lat: 12.9249,
    lng: 80.1000,
    aliases: ['tambaram railway station', 'tambaram bus stand', 'gst road tambaram', 'mudichur road'],
  },
  {
    name: 'Tambaram East & Camp Road',
    shortName: 'Tambaram East',
    category: 'Residential & Educational Hub',
    lat: 12.9226,
    lng: 80.1275,
    aliases: ['camp road', 'mcc', 'madras christian college', 'selaiyur'],
  },
  {
    name: 'Perungalathur',
    shortName: 'Perungalathur',
    category: 'South Chennai Transit Gateway',
    lat: 12.9054,
    lng: 80.0898,
    aliases: ['perungalathur bus stop', 'bye pass perungalathur', 'kamraj nagar'],
  },
  {
    name: 'Vandalur (Arignar Anna Zoo)',
    shortName: 'Vandalur',
    category: 'Transit Junction & Zoo',
    lat: 12.8900,
    lng: 80.0805,
    aliases: ['vandalur zoo', 'crescent college', 'kilambakkam link', 'vandalur flyover'],
  },
  {
    name: 'Kilambakkam (KCBT Bus Terminus)',
    shortName: 'Kilambakkam (KCBT)',
    category: 'Inter-City Bus Terminus',
    lat: 12.8685,
    lng: 80.0680,
    aliases: ['kcbt', 'kalaignar centenary bus terminus', 'kilambakkam terminus', 'mbt'],
  },
  {
    name: 'Guduvancheri & Urapakkam',
    shortName: 'Guduvancheri',
    category: 'GST Road Suburb Hub',
    lat: 12.8436,
    lng: 80.0601,
    aliases: ['urapakkam', 'srm university kattankulathur', 'nandivaram'],
  },

  // West & North-West Chennai
  {
    name: 'Anna Nagar (Roundtana & Tower Park)',
    shortName: 'Anna Nagar',
    category: 'Prime Commercial & Residential',
    lat: 13.0850,
    lng: 80.2101,
    aliases: ['anna nagar roundtana', 'tower park', 'shanthi colony', '2nd avenue anna nagar'],
  },
  {
    name: 'Anna Nagar West Depot',
    shortName: 'Anna Nagar West',
    category: 'Bus Depot & Residential',
    lat: 13.0903,
    lng: 80.1972,
    aliases: ['anna nagar west depot', 'millennium park', 'thirumangalam road'],
  },
  {
    name: 'Thirumangalam & VR Chennai Mall',
    shortName: 'Thirumangalam',
    category: 'Metro & Retail Landmark',
    lat: 13.0838,
    lng: 80.1932,
    aliases: ['vr mall', 'vr chennai', 'thirumangalam metro', 'thirumangalam flyover'],
  },
  {
    name: 'Shenoy Nagar & Thiru Vi Ka Park',
    shortName: 'Shenoy Nagar',
    category: 'Metro & Residential Park',
    lat: 13.0787,
    lng: 80.2258,
    aliases: ['shenoy nagar metro', 'thiru vi ka park', 'aminjikarai bridge'],
  },
  {
    name: 'Aminjikarai',
    shortName: 'Aminjikarai',
    category: 'Commercial Corridor',
    lat: 13.0725,
    lng: 80.2230,
    aliases: ['ampan skywalk', 'poonamallee high road aminjikarai', 'tollgate aminjikarai'],
  },
  {
    name: 'Koyambedu (CMBT Terminus)',
    shortName: 'Koyambedu CMBT',
    category: 'Inter-State Bus & Market Terminus',
    lat: 13.0694,
    lng: 80.2056,
    aliases: ['cmbt', 'koyambedu market', 'koyambedu bus terminus', 'koyambedu metro', 'vegetable market'],
  },
  {
    name: 'Vadapalani (Murugan Temple & Nexus Mall)',
    shortName: 'Vadapalani',
    category: 'Metro & Temple Hub',
    lat: 13.0500,
    lng: 80.2121,
    aliases: ['vadapalani temple', 'nexus vijaya mall', 'forum mall vadapalani', 'sims hospital', 'vadapalani depot'],
  },
  {
    name: 'Ashok Nagar & Pillar',
    shortName: 'Ashok Nagar',
    category: 'Residential & Metro Junction',
    lat: 13.0373,
    lng: 80.2123,
    aliases: ['ashok pillar', 'ashok nagar metro', 'udayam theatre', '11th avenue'],
  },
  {
    name: 'KK Nagar (Kalaignar Karunanidhi Nagar)',
    shortName: 'KK Nagar',
    category: 'Residential Grid Hub',
    lat: 13.0410,
    lng: 80.1994,
    aliases: ['esic hospital', 'psbb school', 'munusamy salai', 'kk nagar depot'],
  },
  {
    name: 'West Mambalam',
    shortName: 'West Mambalam',
    category: 'Residential & Temple Town',
    lat: 13.0382,
    lng: 80.2228,
    aliases: ['mambalam station', 'ayodhya mandapam', 'govindan road'],
  },
  {
    name: 'Virugambakkam & Saligramam',
    shortName: 'Virugambakkam',
    category: 'Arcot Road Cinema Corridor',
    lat: 13.0531,
    lng: 80.1923,
    aliases: ['saligramam', 'arcot road virugambakkam', 'prasad studios', 'chinmaya nagar'],
  },
  {
    name: 'Valasaravakkam',
    shortName: 'Valasaravakkam',
    category: 'Arcot Road Suburb',
    lat: 13.0435,
    lng: 80.1764,
    aliases: ['valasarawalkam', 'kesavardhini', 'chowdry nagar'],
  },
  {
    name: 'Porur Junction & Tollgate',
    shortName: 'Porur',
    category: 'West Commercial & Healthcare Hub',
    lat: 13.0382,
    lng: 80.1565,
    aliases: ['porur roundtana', 'porur flyover', 'sri ramachandra hospital', 'srmc', 'porur lake'],
  },
  {
    name: 'DLF IT Park (Ramapuram / Manapakkam)',
    shortName: 'DLF IT Park',
    category: 'Major Tech Park Campus',
    lat: 13.0298,
    lng: 80.1764,
    aliases: ['dlf chennai', 'ramapuram dlf', 'manapakkam', 'l&t idpl', 'mount poonamallee high road'],
  },
  {
    name: 'Iyyappanthangal & Kattupakkam',
    shortName: 'Iyyappanthangal',
    category: 'Bus Depot & Transit',
    lat: 13.0415,
    lng: 80.1385,
    aliases: ['iyyappanthangal depot', 'kattupakkam', 'prestige bella vista'],
  },
  {
    name: 'Poonamallee',
    shortName: 'Poonamallee',
    category: 'West Highway Transit Gateway',
    lat: 13.0487,
    lng: 80.1118,
    aliases: ['poonamallee bus terminus', 'poovirundhavalli', 'bangalore highway junction'],
  },
  {
    name: 'Mogappair (East / West)',
    shortName: 'Mogappair',
    category: 'Residential Suburb & Schools',
    lat: 13.0837,
    lng: 80.1742,
    aliases: ['mogappair east', 'mogappair west', 'golden flats', 'collector nagar', 'sparsh hospital'],
  },
  {
    name: 'Nolambur',
    shortName: 'Nolambur',
    category: 'Residential Layout',
    lat: 13.0728,
    lng: 80.1652,
    aliases: ['nolambur phase 1', 'service road nolambur', 'jaswant nagar'],
  },
  {
    name: 'Ambattur Industrial Estate & OT',
    shortName: 'Ambattur',
    category: 'Industrial & Tech Hub',
    lat: 13.0978,
    lng: 80.1613,
    aliases: ['ambattur ot', 'ambattur estate', 'telephone exchange ambattur', 'ambattur railway station'],
  },
  {
    name: 'Korattur',
    shortName: 'Korattur',
    category: 'Lake & Suburban Rail',
    lat: 13.1118,
    lng: 80.1837,
    aliases: ['korattur station', 'korattur lake', 'central avenue korattur'],
  },
  {
    name: 'Padi / Lucas TVS Junction',
    shortName: 'Padi',
    category: 'Grade Separator Junction',
    lat: 13.0988,
    lng: 80.1882,
    aliases: ['padi flyover', 'lucas tvs', 'padi saravana stores', 'britannia signal'],
  },
  {
    name: 'Villivakkam',
    shortName: 'Villivakkam',
    category: 'Railway & Suburb',
    lat: 13.1075,
    lng: 80.2058,
    aliases: ['villivakkam bus stand', 'villivakkam station', 'nathamuni theatre'],
  },
  {
    name: 'Kolathur',
    shortName: 'Kolathur',
    category: 'North-West Hub',
    lat: 13.1235,
    lng: 80.2173,
    aliases: ['kolathur junction', 'retteri junction', 'retteri flyover', '200 feet road kolathur'],
  },
  {
    name: 'Avadi',
    shortName: 'Avadi',
    category: 'Defence & Suburban Railway Terminus',
    lat: 13.1147,
    lng: 80.1018,
    aliases: ['avadi station', 'hvf avadi', 'crpf avadi', 'avadi checkpost'],
  },

  // North Chennai
  {
    name: 'Perambur (Loco Works & Carriage)',
    shortName: 'Perambur',
    category: 'Railway Junction & Hub',
    lat: 13.1089,
    lng: 80.2443,
    aliases: ['perambur railway station', 'loco works', 'perambur flyover', 'icf', 'spectrum mall'],
  },
  {
    name: 'Madhavaram & MMBT Terminus',
    shortName: 'Madhavaram',
    category: 'Bus Terminus & North Hub',
    lat: 13.1482,
    lng: 80.2312,
    aliases: ['mmbt', 'madhavaram moffussil bus terminus', 'roundtana madhavaram', 'milk colony'],
  },
  {
    name: 'Red Hills (Puzhal)',
    shortName: 'Red Hills',
    category: 'North Gateway & Reservoir',
    lat: 13.1932,
    lng: 80.1970,
    aliases: ['redhills', 'puzhal prison', 'red hills lake', 'gnt road'],
  },
  {
    name: 'Washermanpet',
    shortName: 'Washermanpet',
    category: 'North Chennai Metro Terminus',
    lat: 13.1092,
    lng: 80.2831,
    aliases: ['washermenpet', 'sir theagaraya college', 'old washermanpet'],
  },
  {
    name: 'Royapuram',
    shortName: 'Royapuram',
    category: 'Historic Railway Station',
    lat: 13.1112,
    lng: 80.2947,
    aliases: ['royapuram station', 'kalmandapam', 'bridge road'],
  },
  {
    name: 'Tondiarpet',
    shortName: 'Tondiarpet',
    category: 'Residential & Oil Corridor',
    lat: 13.1287,
    lng: 80.2891,
    aliases: ['thondiarpet', 'tondiarpet depot', 'vaidyanathan street'],
  },
  {
    name: 'Tiruvottiyur',
    shortName: 'Tiruvottiyur',
    category: 'North Metro Corridor & Coastal',
    lat: 13.1610,
    lng: 80.3012,
    aliases: ['thiruvottiyur', 'wimco nagar', 'vadivudai amman temple'],
  },
  {
    name: 'Ennore & Manali',
    shortName: 'Ennore',
    category: 'Industrial Port & Thermal Zone',
    lat: 13.2045,
    lng: 80.3235,
    aliases: ['ennore port', 'manali refinery', 'kamrajar port'],
  },
  {
    name: 'Stanley Medical College Hospital',
    shortName: 'Stanley Hospital',
    category: 'North Chennai Tertiary Hospital',
    lat: 13.1070,
    lng: 80.2874,
    aliases: ['stanley', 'old jail road', 'stanley medical college'],
  },
  {
    name: 'Mint / Vallalar Nagar Bus Terminus',
    shortName: 'Mint Terminus',
    category: 'North Bus Terminus',
    lat: 13.1065,
    lng: 80.2801,
    aliases: ['mint', 'vallalar nagar', 'mint clock tower', 'basin bridge junction'],
  },
  {
    name: 'Vyasarpadi & Jeeva Railway Station',
    shortName: 'Vyasarpadi',
    category: 'Suburban Rail & Residential',
    lat: 13.1165,
    lng: 80.2605,
    aliases: ['vyasarpadi jeeva', 'kalyanapuram', 'murthy nagar'],
  },
  {
    name: 'Maduravoyal Flyover & Grade Separator',
    shortName: 'Maduravoyal',
    category: 'Highway & Bypass Interchange',
    lat: 13.0645,
    lng: 80.1632,
    aliases: ['maduravoyal junction', 'cooum bridge', 'maduravoyal toll'],
  },
  {
    name: 'Vanagaram & Apollo Speciality Hospital',
    shortName: 'Vanagaram',
    category: 'Healthcare & Commercial',
    lat: 13.0560,
    lng: 80.1420,
    aliases: ['apollo vanagaram', 'fish market vanagaram', 'service road vanagaram'],
  },
  {
    name: 'Thiruverkadu Karumariamman Temple',
    shortName: 'Thiruverkadu',
    category: 'Pilgrimage & Residential Hub',
    lat: 13.0725,
    lng: 80.1235,
    aliases: ['karumariamman temple', 'cooum river', 'thiruverkadu bus stand'],
  },
  {
    name: 'Kundrathur Murugan Temple',
    shortName: 'Kundrathur',
    category: 'Heritage & Suburb Junction',
    lat: 12.9975,
    lng: 80.0950,
    aliases: ['kundrathur temple', 'sekizhar nagar', 'kundrathur bus stop'],
  },
  {
    name: 'Mangadu Kamakshi Amman Temple',
    shortName: 'Mangadu',
    category: 'Temple Town & Suburb',
    lat: 13.0235,
    lng: 80.1185,
    aliases: ['mangadu amman', 'kamakshi temple', 'mangadu market'],
  },
  {
    name: 'Pammal & Pozhichalur',
    shortName: 'Pammal',
    category: 'South-West Suburb Hub',
    lat: 12.9735,
    lng: 80.1345,
    aliases: ['pozhichalur', 'pammal main road', 'shankara eye hospital'],
  },
  {
    name: 'Anakaputhur & Thiruneermalai',
    shortName: 'Anakaputhur',
    category: 'Weaving Town & Temple Hill',
    lat: 12.9810,
    lng: 80.1170,
    aliases: ['thiruneermalai perumal', 'neelamangalam', 'anakaputhur bridge'],
  },
  {
    name: 'Chitlapakkam Lake & Residential Hub',
    shortName: 'Chitlapakkam',
    category: 'Lake & Suburban Residential',
    lat: 12.9355,
    lng: 80.1490,
    aliases: ['chitlapakkam lake', 'varadaraja theatre', 'mahadevan street'],
  },
  {
    name: 'Hasthinapuram',
    shortName: 'Hasthinapuram',
    category: 'Suburban Bus Stand & Market',
    lat: 12.9460,
    lng: 80.1585,
    aliases: ['hasthinapuram bus terminus', 'nehru nagar', 'kumaran kundram hill'],
  },
  {
    name: 'Sembakkam',
    shortName: 'Sembakkam',
    category: 'Velachery Main Road Suburb',
    lat: 12.9240,
    lng: 80.1685,
    aliases: ['sembakkam lake', 'kameshwarar nagar', 'rajakilpakkam junction'],
  },
  {
    name: 'Selaiyur & Bharath University',
    shortName: 'Selaiyur',
    category: 'Educational & Residential Hub',
    lat: 12.9180,
    lng: 80.1450,
    aliases: ['bharath university selaiyur', 'zion school', 'selaiyur police station'],
  },
  {
    name: 'Kovilambakkam & Sunnambu Kolathur',
    shortName: 'Kovilambakkam',
    category: 'Radial Road Residential Hub',
    lat: 12.9470,
    lng: 80.1870,
    aliases: ['sunnambu kolathur', '200 feet radial road', 'veeramani nagar'],
  },
  {
    name: 'Semmancheri & Sathyabama University',
    shortName: 'Semmancheri',
    category: 'OMR University & Tech Hub',
    lat: 12.8715,
    lng: 80.2220,
    aliases: ['sathyabama', 'sathyabama deemed university', 'semmancheri police station', 'omr semmancheri'],
  },
];

/**
 * Fast multi-tier search helper that filters curated localities with:
 * 1. Exact name/shortName/alias match
 * 2. Prefix match on shortName/name/alias
 * 3. Word boundary match
 * 4. Substring inclusion across name, shortName, category, and all aliases
 */
export function searchLocalLocalities(query, limit = 8) {
  if (!query || typeof query !== 'string') return [];
  const clean = query.trim().toLowerCase();
  if (clean.length < 1) return [];

  const exactMatches = [];
  const prefixMatches = [];
  const wordMatches = [];
  const substringMatches = [];
  const seenShortNames = new Set();

  for (const item of CHENNAI_LOCALITIES) {
    const nameLower = item.name.toLowerCase();
    const shortLower = item.shortName.toLowerCase();
    const catLower = (item.category || '').toLowerCase();
    const aliases = item.aliases || [];

    // Check exact matches
    const isExact =
      shortLower === clean ||
      nameLower === clean ||
      aliases.some((a) => a === clean);

    if (isExact) {
      exactMatches.push(item);
      seenShortNames.add(item.shortName);
      continue;
    }

    // Check prefix matches
    const isPrefix =
      shortLower.startsWith(clean) ||
      nameLower.startsWith(clean) ||
      aliases.some((a) => a.startsWith(clean));

    if (isPrefix) {
      prefixMatches.push(item);
      seenShortNames.add(item.shortName);
      continue;
    }

    // Check word-boundary matches (e.g. searching "nagar" matches "T. Nagar")
    const words = `${nameLower} ${shortLower} ${aliases.join(' ')}`.split(/[\s,()/-]+/);
    const isWordMatch = words.some((w) => w.startsWith(clean));

    if (isWordMatch) {
      wordMatches.push(item);
      seenShortNames.add(item.shortName);
      continue;
    }

    // Check substring match
    const isSubstring =
      shortLower.includes(clean) ||
      nameLower.includes(clean) ||
      catLower.includes(clean) ||
      aliases.some((a) => a.includes(clean));

    if (isSubstring) {
      substringMatches.push(item);
      seenShortNames.add(item.shortName);
    }
  }

  const combined = [
    ...exactMatches,
    ...prefixMatches,
    ...wordMatches,
    ...substringMatches,
  ];

  return combined.slice(0, limit);
}
