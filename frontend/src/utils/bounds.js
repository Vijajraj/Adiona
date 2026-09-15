// Chennai Bounding Box (source: OSM Nominatim — spec §11a)
export const CHENNAI_BOUNDS = [
  [80.1070369, 12.9205289], // southwest (minlon, minlat)
  [80.4270369, 13.2405289], // northeast (maxlon, maxlat)
];

// Chennai geographical center for initial map load
export const CHENNAI_CENTER = [80.2707, 13.0827]; // [lng, lat]
export const DEFAULT_ZOOM = 12;

// CARTO Positron vector tile style (Light) & CARTO Dark Matter (High-contrast Dark)
// Served globally via Cloudflare CDN with guaranteed 100% uptime and CORS support
export const MAP_STYLE_URL = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
export const MAP_STYLE_DARK_URL = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
