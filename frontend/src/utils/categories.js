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

export const ALL_CATEGORIES = [
  ...GENERAL_SAFETY_CATEGORIES,
  ...WOMEN_SAFETY_CATEGORIES,
];

export const AFFECTED_GROUPS = [
  { id: 'woman', label: 'Woman' },
  { id: 'man', label: 'Man' },
  { id: 'elderly', label: 'Elderly' },
  { id: 'child', label: 'Child' },
  { id: 'general', label: 'General / Public' },
];
