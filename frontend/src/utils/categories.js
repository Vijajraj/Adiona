export const GENERAL_SAFETY_CATEGORIES = [
  {
    id: 'poor_lighting',
    label: 'Poor / No Lighting',
    icon: 'LightbulbOff',
    description: 'Dark streets, non-functional streetlights, pitch dark walkways',
  },
  {
    id: 'isolated_area',
    label: 'Isolated / Deserted Area',
    icon: 'Compass',
    description: 'Empty alleys, no people around, abandoned buildings',
  },
  {
    id: 'no_cctv',
    label: 'No CCTV Coverage',
    icon: 'VideoOff',
    description: 'Blind spots, unmonitored public corridors',
  },
  {
    id: 'stray_animal',
    label: 'Stray Animal Risk',
    icon: 'PawPrint',
    description: 'Aggressive stray packs, dangerous unmanaged animals',
  },
  {
    id: 'robbery_theft',
    label: 'Robbery / Theft-Prone',
    icon: 'AlertTriangle',
    description: 'Known snatching spots, pickpocketing, mugging risks',
  },
  {
    id: 'unsafe_road',
    label: 'Unsafe Road / No Footpath',
    icon: 'Footprints',
    description: 'Broken pavement, high-speed traffic, pedestrian hazard',
  },
  {
    id: 'other_general',
    label: 'Other General Issue',
    icon: 'HelpCircle',
    description: 'Other infrastructure or environment safety concern',
  },
];

export const WOMEN_SAFETY_CATEGORIES = [
  {
    id: 'catcalling',
    label: 'Catcalling / Verbal Harassment',
    icon: 'MessageSquareWarning',
    description: 'Leering, whistling, inappropriate comments, verbal abuse',
  },
  {
    id: 'stalking',
    label: 'Stalking',
    icon: 'Eye',
    description: 'Being followed, tracked, or persistently monitored',
  },
  {
    id: 'physical_harassment',
    label: 'Physical Harassment / Groping',
    icon: 'ShieldAlert',
    description: 'Inappropriate contact, physical assault, overcrowding abuse',
  },
  {
    id: 'unsafe_transport',
    label: 'Unsafe Public Transport Stop',
    icon: 'Bus',
    description: 'Poorly lit bus stops, unruly crowd, unsafe auto/taxi stands',
  },
  {
    id: 'other_women',
    label: 'Other Harassment / Threat',
    icon: 'AlertOctagon',
    description: 'Other specific safety concern targeting women',
  },
];

export const SAFE_SPOT_CATEGORIES = [
  {
    id: 'well_lit',
    label: 'Well Lit & Bright Area',
    icon: 'Sun',
    description: 'Bright streetlights, well illuminated walkways & active shops',
  },
  {
    id: 'cctv_monitored',
    label: 'CCTV Monitored / Guarded',
    icon: 'Video',
    description: 'Visible CCTV cameras, active security guards, monitored area',
  },
  {
    id: 'active_crowd',
    label: 'Active & Busy Public Space',
    icon: 'Users',
    description: 'Friendly crowds, open shops, active street life & pedestrian density',
  },
  {
    id: 'police_patrol',
    label: 'Police Booth / Patrol Zone',
    icon: 'Shield',
    description: 'Nearby police station, help desk, or active patrolling presence',
  },
  {
    id: 'safe_transport_stop',
    label: 'Safe Public Transport Hub',
    icon: 'Bus',
    description: 'Well-lit bus stand, metro station, active & organized auto stand',
  },
  {
    id: 'other_general',
    label: 'Other Safe Spot / Landmark',
    icon: 'HelpCircle',
    description: 'Other verified safe location, community hub, or safe landmark',
  },
];

export const ALL_CATEGORIES = [
  ...GENERAL_SAFETY_CATEGORIES,
  ...WOMEN_SAFETY_CATEGORIES,
  ...SAFE_SPOT_CATEGORIES,
];

export const AFFECTED_GROUPS = [
  { id: 'woman', label: 'Woman' },
  { id: 'man', label: 'Man' },
  { id: 'elderly', label: 'Elderly' },
  { id: 'child', label: 'Child' },
  { id: 'general', label: 'General / Public' },
];
