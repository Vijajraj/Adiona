// Chennai Bounding Box (source: OSM Nominatim — spec §11a)
export const CHENNAI_BOUNDS = [
  [80.1070369, 12.9205289], // southwest (minlon, minlat)
  [80.4270369, 13.2405289], // northeast (maxlon, maxlat)
];

// Chennai geographical center for initial map load
export const CHENNAI_CENTER = [80.2707, 13.0827]; // [lng, lat]
export const DEFAULT_ZOOM = 12;

// Inline style objects using raster tiles — guaranteed to load without
// external style-JSON fetches, API keys, or vector-tile CORS issues.

export const MAP_STYLE_URL = {
  version: 8,
  name: 'OSM Liberty Light',
  sources: {
    osm: {
      type: 'raster',
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxzoom: 19,
    },
  },
  layers: [{ id: 'osm-tiles', type: 'raster', source: 'osm' }],
};

export const MAP_STYLE_DARK_URL = {
  version: 8,
  name: 'CartoDB Dark Matter',
  sources: {
    'carto-dark': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
      ],
      tileSize: 256,
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxzoom: 20,
    },
  },
  layers: [{ id: 'carto-dark-tiles', type: 'raster', source: 'carto-dark' }],
};
