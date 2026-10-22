/**
 * Chennai Safety Map — Bilingual Translation Dictionary (English & தமிழ்)
 * Phase 2 Spec §3.3.
 */

export const translations = {
  en: {
    // Header & Meta
    appTitle: 'Adiona',
    appSubtitle: 'Chennai Safety Map',
    betaTag: 'Phase 2 Live',
    noLoginBadge: 'No login required',
    anonymousBadge: '100% Anonymous',
    
    // Actions & Buttons
    reportIssue: 'Report Safety Concern',
    reportSafeSpot: 'Mark Safe Spot',
    filters: 'Filters',
    heatmapFilters: 'Heatmap Filters',
    problemCategory: 'Problem Category',
    timeRange: 'Time Range',
    affectedDemographic: 'Affected Demographic',
    nearbyHelp: 'Emergency Help',
    nearbyHelpDesc: 'Police, 24/7 hospitals, pharmacies & transit',
    lowerRiskRoute: 'Route Safety Check',
    institutionalDashboard: 'Civic Dashboard',
    openDataExport: 'Open Data (CC BY 4.0)',
    giveFeedback: 'Feedback',
    privacyNotice: 'Privacy & Data Policy',
    searchPlaceholder: 'Search Chennai locality (e.g., T Nagar, CMBT, OMR)...',
    clearFilters: 'Reset Filters',
    applyFilters: 'Apply',
    close: 'Close',
    cancel: 'Cancel',
    submit: 'Submit Report',
    submitting: 'Submitting...',
    confirm: 'Confirm Report',
    confirming: 'Confirming...',
    reportDifferent: 'Report Different Issue Here',
    useMyLocation: 'Locate Me',

    // Time-of-Day Filter (Spec §3.2)
    timeOfDay: 'Time of Day',
    timeAll: 'All Hours',
    timeMorning: 'Morning (5AM - 12PM)',
    timeAfternoon: 'Afternoon (12PM - 5PM)',
    timeEvening: 'Evening (5PM - 9PM)',
    timeNight: 'Night (9PM - 5AM)',
    recency: 'Recency',
    past24h: 'Past 24 Hours',
    past7d: 'Past 7 Days',
    past30d: 'Past 30 Days',
    past90d: 'Past 90 Days',
    allTime: 'All Time (Cumulative)',

    // Statuses
    unsafeArea: 'Safety Concern',
    safeSpot: 'Safe Spot',
    statusSafe: 'Safe Spot',
    statusUnsafe: 'Unsafe Issue',
    
    // Categories — General Safety
    cat_poor_lighting: 'Poor / No Lighting',
    cat_desc_poor_lighting: 'Dark streets, non-functional streetlights, pitch dark walkways',
    cat_isolated_area: 'Isolated / Deserted Area',
    cat_desc_isolated_area: 'Empty alleys, no people around, abandoned buildings',
    cat_no_cctv: 'No CCTV Coverage',
    cat_desc_no_cctv: 'Blind spots, unmonitored public corridors',
    cat_stray_animal: 'Stray Animal Risk',
    cat_desc_stray_animal: 'Aggressive stray packs, dangerous unmanaged animals',
    cat_robbery_theft: 'Robbery / Theft-Prone',
    cat_desc_robbery_theft: 'Known snatching spots, pickpocketing, mugging risks',
    cat_unsafe_road: 'Unsafe Road / No Footpath',
    cat_desc_unsafe_road: 'Broken pavement, high-speed traffic, pedestrian hazard',
    cat_other_general: 'Other General Issue',
    cat_desc_other_general: 'Other infrastructure or environment safety concern',

    // Categories — Women Safety
    cat_catcalling: 'Catcalling / Verbal Harassment',
    cat_desc_catcalling: 'Leering, whistling, inappropriate comments, verbal abuse',
    cat_stalking: 'Stalking',
    cat_desc_stalking: 'Being followed, tracked, or persistently monitored',
    cat_physical_harassment: 'Physical Harassment / Groping',
    cat_desc_physical_harassment: 'Inappropriate contact, physical assault, overcrowding abuse',
    cat_unsafe_transport: 'Unsafe Public Transport Stop',
    cat_desc_unsafe_transport: 'Poorly lit bus stops, unruly crowd, unsafe auto stands',
    cat_other_women: 'Other Threat to Women',
    cat_desc_other_women: 'Other specific safety concern targeting women',

    // Categories — Safe Spots
    cat_well_lit: 'Well Lit & Bright Area',
    cat_desc_well_lit: 'Bright streetlights, illuminated walkways & active shops',
    cat_cctv_monitored: 'CCTV Monitored / Guarded',
    cat_desc_cctv_monitored: 'Visible CCTV cameras, security guards, monitored area',
    cat_active_crowd: 'Active & Busy Public Space',
    cat_desc_active_crowd: 'Friendly crowds, open shops, active street life',
    cat_police_patrol: 'Police Booth / Patrol Zone',
    cat_desc_police_patrol: 'Nearby police station, help desk, or patrolling presence',
    cat_safe_transport_stop: 'Safe Public Transport Hub',
    cat_desc_safe_transport_stop: 'Well-lit bus stand, metro station, organized stand',

    // Demographic groups
    group_woman: 'Woman',
    group_man: 'Man',
    group_elderly: 'Elderly',
    group_child: 'Child',
    group_general: 'General Public',
    affectedGroupLabel: 'Most Affected Group (Optional)',

    // Help Layer Types
    help_police: 'Police Station / Outpost',
    help_hospital: '24/7 Hospital / Trauma Center',
    help_pharmacy: '24/7 Pharmacy',
    help_transit: 'Metro / Railway Station',
    helpEmergencyNum: 'Emergency Helpline',
    helpAddress: 'Address',
    distanceKm: 'km away',

    // Empty state & Alerts
    noReportsMatch: 'No reports match the selected filters.',
    noReportsHint: 'Try widening the time window, selecting all hours, or tap the map to be the first to report here.',
    locationOutsideChennai: 'Selected point is outside Chennai city limits. Please tap inside Chennai.',
    reportSuccess: 'Report submitted successfully! Thank you for making Chennai safer.',
    confirmSuccess: 'Report confirmed! Safety intensity updated on map.',

    // Routing
    routeCorridorRisk: 'Corridor Safety Assessment',
    lowerReportedRiskNotice: 'Lower-reported-risk route based on community reports. Not a guarantee of safety.',
    passesLightingIssues: 'Passes {count} locations flagged for poor lighting after dark',
    
    // Privacy
    privacyHeading: 'Zero-Knowledge Privacy',
    whatStored: 'What is Stored',
    whatNotStored: 'What is NEVER Stored',
    stored1: '~100m snapped grid coordinates (approximate)',
    stored2: 'Selected category and time bucket (IST)',
    stored3: 'Anonymous randomized device token (for spam control)',
    notStored1: 'Your exact GPS location or address',
    notStored2: 'Your name, phone number, email, or IP address',
    notStored3: 'Your movement trajectory or tracking cookies',
  },

  ta: {
    // Header & Meta
    appTitle: 'அடியோனா (Adiona)',
    appSubtitle: 'சென்னை பாதுகாப்பு வரைபடம்',
    betaTag: 'கட்டம் 2 நேரலை',
    noLoginBadge: 'உள்நுழைவு தேவையில்லை',
    anonymousBadge: '100% அநாமதேயமானது',
    
    // Actions & Buttons
    reportIssue: 'பாதுகாப்பு குறைபாட்டைப் பதிவிடவும்',
    reportSafeSpot: 'பாதுகாப்பான இடத்தைப் பகிரவும்',
    filters: 'வடிகட்டிகள் (Filters)',
    heatmapFilters: 'வரைபட வடிகட்டிகள்',
    problemCategory: 'குறைபாட்டின் வகை',
    timeRange: 'கால இடைவெளி',
    affectedDemographic: 'பாதிக்கப்படும் பிரிவு',
    nearbyHelp: 'அவசர உதவி மையங்கள்',
    nearbyHelpDesc: 'காவல் நிலையம், 24/7 மருத்துவமனை, மருந்தகம் & ரயில் நிலையம்',
    lowerRiskRoute: 'வழித்தடப் பாதுகாப்பு சோதனை',
    institutionalDashboard: 'பொது நிர்வாக டாஷ்போர்டு',
    openDataExport: 'திறந்த தரவு ஏற்றுமதி (CC BY 4.0)',
    giveFeedback: 'கருத்துகள்',
    privacyNotice: 'தனியுரிமை மற்றும் தரவுக் கொள்கை',
    searchPlaceholder: 'சென்னை பகுதிகளைத் தேடவும் (எ.கா: தி.நகர், கோயம்பேடு, OMR)...',
    clearFilters: 'வடிகட்டிகளை மீட்டமை',
    applyFilters: 'பயன்படுத்து',
    close: 'மூடுக',
    cancel: 'ரத்து செய்',
    submit: 'பதிவைச் சமர்ப்பிக்கவும்',
    submitting: 'பதிவாகிறது...',
    confirm: 'இக்குறைபாட்டை உறுதிசெய்',
    confirming: 'உறுதிசெய்யப்படுகிறது...',
    reportDifferent: 'இங்கே வேறு குறைபாட்டைப் பதிவுசெய்',
    useMyLocation: 'என் தற்போதைய இருப்பிடம்',

    // Time-of-Day Filter (Spec §3.2)
    timeOfDay: 'நேரப் பிரிவு (Time of Day)',
    timeAll: 'அனைத்து நேரமும்',
    timeMorning: 'காலை (5AM - 12PM)',
    timeAfternoon: 'மதியம் (12PM - 5PM)',
    timeEvening: 'மாலை (5PM - 9PM)',
    timeNight: 'இரவு (9PM - 5AM)',
    recency: 'கால இடைவெளி',
    past24h: 'கடந்த 24 மணிநேரம்',
    past7d: 'கடந்த 7 நாட்கள்',
    past30d: 'கடந்த 30 நாட்கள்',
    past90d: 'கடந்த 90 நாட்கள்',
    allTime: 'எல்லா நாட்களும்',

    // Statuses
    unsafeArea: 'பாதுகாப்புக் குறைபாடு',
    safeSpot: 'பாதுகாப்பான இடம்',
    statusSafe: 'பாதுகாப்பான இடம்',
    statusUnsafe: 'பாதுகாப்பற்ற குறைபாடு',
    
    // Categories — General Safety
    cat_poor_lighting: 'போதிய வெளிச்சமின்மை / இருள்',
    cat_desc_poor_lighting: 'இருண்ட தெருக்கள், எரியாத தெருவிளக்குகள், நடைபாதை இருள்',
    cat_isolated_area: 'ஆள்நடமாட்டமற்ற பகுதி',
    cat_desc_isolated_area: 'வெறிச்சோடிய சந்துகள், மக்கள் இல்லாத பாழடைந்த கட்டிடங்கள்',
    cat_no_cctv: 'CCTV கண்காணிப்பு இல்லை',
    cat_desc_no_cctv: 'கண்காணிப்பு இல்லாத பொதுப் பாதைகள், மறைவான இடங்கள்',
    cat_stray_animal: 'தெரு விலங்குகள் அச்சுறுத்தல்',
    cat_desc_stray_animal: 'ஆக்ரோஷமான தெருநாய்கள், கட்டுப்படுத்தப்படாத விலங்குகள்',
    cat_robbery_theft: 'பறிப்பு / திருட்டு அபாயம்',
    cat_desc_robbery_theft: 'செயின் பறிப்பு, பாக்கெட் அடித்தல், வழிப்பறி அபாயப் பகுதி',
    cat_unsafe_road: 'பாதுகாப்பற்ற சாலை / நடைபாதை இல்லை',
    cat_desc_unsafe_road: 'உடைந்த நடைபாதை, அதிக வேகப் போக்குவரத்து, பாதசாரி ஆபத்து',
    cat_other_general: 'பிற பொதுவான குறைபாடு',
    cat_desc_other_general: 'மற்ற கட்டமைப்பு அல்லது சுற்றுச்சூழல் பாதுகாப்புப் பிரச்சனை',

    // Categories — Women Safety
    cat_catcalling: 'ஈவ்டீசிங் / வாய்மொழி துன்புறுத்தல்',
    cat_desc_catcalling: 'சீண்டுதல், விசிலடித்தல், தகாத வார்த்தைகள், அநாகரீகப் பேச்சு',
    cat_stalking: 'பின்தொடர்தல் (Stalking)',
    cat_desc_stalking: 'தொடர்ந்து பின் தொடருதல், கண்காணித்தல், வழிமறித்தல்',
    cat_physical_harassment: 'உடல் ரீதியான தொல்லை / தீண்டல்',
    cat_desc_physical_harassment: 'தகாத தொடுதல், கூட்ட நெரிசலைப் பயன்படுத்தி பாலியல் சீண்டல்',
    cat_unsafe_transport: 'பாதுகாப்பற்ற பேருந்து நிறுத்தம் / ஆட்டோ ஸ்டாண்ட்',
    cat_desc_unsafe_transport: 'வெளிச்சமில்லாத பேருந்து நிறுத்தம், ஒழுங்கற்ற கூட்டம்',
    cat_other_women: 'பெண்களுக்கான பிற அச்சுறுத்தல்',
    cat_desc_other_women: 'பெண்களைக் குறிவைத்து நடக்கும் பிற பாதுகாப்புப் பிரச்சனைகள்',

    // Categories — Safe Spots
    cat_well_lit: 'நல்ல வெளிச்சமுள்ள பகுதி',
    cat_desc_well_lit: 'பிரகாசமான தெருவிளக்குகள், திறந்த கடைகள் மற்றும் பாதுகாப்பான நடைபாதை',
    cat_cctv_monitored: 'CCTV கண்காணிப்பு பகுதி',
    cat_desc_cctv_monitored: 'CCTV கேமராக்கள், பாதுகாப்புக் காவலர்கள் உள்ள பகுதி',
    cat_active_crowd: 'மக்கள் நடமாட்டம் உள்ள இடம்',
    cat_desc_active_crowd: 'நட்பான பொதுமக்கள், இரவு வரை இயங்கும் கடைகள்',
    cat_police_patrol: 'காவல் உதவி மையம் / ரோந்து பகுதி',
    cat_desc_police_patrol: 'அருகிலுள்ள காவல் நிலையம், புறக்காவல் நிலையம் அல்லது ரோந்து',
    cat_safe_transport_stop: 'பாதுகாப்பான போக்குவரத்து மையம்',
    cat_desc_safe_transport_stop: 'வெளிச்சமான பேருந்து நிறுத்தம், மெட்ரோ அல்லது ரயில் நிலையம்',

    // Demographic groups
    group_woman: 'பெண்கள்',
    group_man: 'ஆண்கள்',
    group_elderly: 'முதியவர்கள்',
    group_child: 'குழந்தைகள்',
    group_general: 'பொது மக்கள்',
    affectedGroupLabel: 'பாதிக்கப்படும் குழு (விருப்பத்தேர்வு)',

    // Help Layer Types
    help_police: 'காவல் நிலையம் / புறக்காவல் நிலையம்',
    help_hospital: '24/7 மருத்துவமனை / அவசர சிகிச்சை',
    help_pharmacy: '24/7 மருந்தகம்',
    help_transit: 'மெட்ரோ / ரயில் நிலையம்',
    helpEmergencyNum: 'அவசர உதவி எண்',
    helpAddress: 'முகவரி',
    distanceKm: 'கி.மீ தொலைவில்',

    // Empty state & Alerts
    noReportsMatch: 'தேர்ந்தெடுத்த வடிகட்டிகளுக்கு ஏற்ப பதிவுகள் ஏதுமில்லை.',
    noReportsHint: 'நேரப் பிரிவை மாற்றவும் அல்லது வரைபடத்தில் தொட்டு உங்கள் முதல் பதிவைச் சமர்ப்பிக்கவும்.',
    locationOutsideChennai: 'தேர்வு செய்த இடம் சென்னை எல்லைக்கு வெளியே உள்ளது. சென்னைக்குள் தேர்ந்தெடுக்கவும்.',
    reportSuccess: 'பதிவு வெற்றிகரமாகச் சமர்ப்பிக்கப்பட்டது! சென்னையைப் பாதுகாப்பானதாக மாற்ற உதவியதற்கு நன்றி.',
    confirmSuccess: 'பதிவு உறுதிசெய்யப்பட்டது! வரைபடத்தில் புதுப்பிக்கப்பட்டுள்ளது.',

    // Routing
    routeCorridorRisk: 'வழித்தடப் பாதுகாப்பு மதிப்பீடு',
    lowerReportedRiskNotice: 'குறைவான ஆபத்துகள் பதிவாகியுள்ள வழித்தடம். இது முழுமையான பாதுகாப்புக்கான உத்தரவாதம் அல்ல.',
    passesLightingIssues: 'இருள் சூழ்ந்ததாகக் குறிக்கப்பட்ட {count} இடங்களைக் கடந்து செல்கிறது',

    // Privacy
    privacyHeading: 'முழுமையான அநாமதேயப் பாதுகாப்பு',
    whatStored: 'சேமிக்கப்படுபவை',
    whatNotStored: 'ஒருபோதும் சேமிக்கப்படாதவை',
    stored1: '~100மீ தோராயமான கட்டக் குறியீடுகள் (Snapping)',
    stored2: 'தேர்ந்தெடுத்த வகை மற்றும் நேரப் பிரிவு (IST)',
    stored3: 'சீரற்ற சாதன அடையாளக் குறியீடு (ஸ்பேம் தடுப்பிற்கு மட்டும்)',
    notStored1: 'உங்கள் துல்லியமான GPS அல்லது வீட்டு முகவரி',
    notStored2: 'உங்கள் பெயர், தொலைபேசி எண், மின்னஞ்சல் அல்லது IP முகவரி',
    notStored3: 'உங்கள் பயண வழித்தடப் பதிவுகள் அல்லது கண்காணிப்பு குக்கீகள்',
  },
};
