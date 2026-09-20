import { describe, it, expect } from 'vitest';
import { applyFiltersToGeoJSON } from '../components/ReportMarkersLayer';
import { searchLocalLocalities, CHENNAI_LOCALITIES } from '../utils/chennaiLocalities';

describe('applyFiltersToGeoJSON', () => {
  const sampleGeoJSON = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [80.23, 13.04] },
        properties: {
          id: '1',
          category: 'poor_lighting',
          affected_group: 'woman',
          created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), // 2h ago
        },
      },
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [80.21, 13.08] },
        properties: {
          id: '2',
          category: 'unsafe_road',
          affected_group: 'general',
          created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(), // 48h ago
        },
      },
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [80.25, 13.00] },
        properties: {
          id: '3',
          category: 'catcalling',
          affected_group: 'woman',
          created_at: new Date(Date.now() - 100 * 3600 * 1000).toISOString(), // 100h ago
        },
      },
    ],
  };

  it('returns all features when no filters are applied', () => {
    const res = applyFiltersToGeoJSON(sampleGeoJSON, {});
    expect(res.features).toHaveLength(3);
  });

  it('filters accurately by category', () => {
    const res = applyFiltersToGeoJSON(sampleGeoJSON, { category: 'poor_lighting' });
    expect(res.features).toHaveLength(1);
    expect(res.features[0].properties.id).toBe('1');
  });

  it('filters accurately by affected_group', () => {
    const res = applyFiltersToGeoJSON(sampleGeoJSON, { affected_group: 'woman' });
    expect(res.features).toHaveLength(2);
    expect(res.features.map((f) => f.properties.id)).toEqual(['1', '3']);
  });

  it('filters accurately by hours_back', () => {
    // 6 hours back should only match feature 1 (2h ago)
    const res6h = applyFiltersToGeoJSON(sampleGeoJSON, { hours_back: 6 });
    expect(res6h.features).toHaveLength(1);
    expect(res6h.features[0].properties.id).toBe('1');

    // 72 hours back should match feature 1 and 2
    const res72h = applyFiltersToGeoJSON(sampleGeoJSON, { hours_back: 72 });
    expect(res72h.features).toHaveLength(2);
    expect(res72h.features.map((f) => f.properties.id)).toEqual(['1', '2']);
  });

  it('combines category, affected_group, and hours_back', () => {
    const res = applyFiltersToGeoJSON(sampleGeoJSON, {
      category: 'poor_lighting',
      affected_group: 'woman',
      hours_back: 24,
    });
    expect(res.features).toHaveLength(1);
    expect(res.features[0].properties.id).toBe('1');

    const noMatch = applyFiltersToGeoJSON(sampleGeoJSON, {
      category: 'unsafe_road',
      affected_group: 'woman',
    });
    expect(noMatch.features).toHaveLength(0);
  });
});

describe('searchLocalLocalities', () => {
  it('contains over 100 curated localities across Chennai', () => {
    expect(CHENNAI_LOCALITIES.length).toBeGreaterThan(100);
  });

  it('matches exact and prefix queries', () => {
    const tNagar = searchLocalLocalities('T. Nagar');
    expect(tNagar.length).toBeGreaterThan(0);
    expect(tNagar[0].shortName).toBe('T. Nagar');

    const adyar = searchLocalLocalities('Ady');
    expect(adyar.some((item) => item.shortName === 'Adyar')).toBe(true);
  });

  it('matches common Chennai aliases like CMBT, Airport, EA Mall', () => {
    const cmbt = searchLocalLocalities('cmbt');
    expect(cmbt.length).toBeGreaterThan(0);
    expect(cmbt[0].shortName).toBe('Koyambedu CMBT');

    const airport = searchLocalLocalities('airport');
    expect(airport.length).toBeGreaterThan(0);
    expect(airport[0].shortName).toBe('Chennai Airport');

    const vr = searchLocalLocalities('vr mall');
    expect(vr.length).toBeGreaterThan(0);
    expect(vr[0].shortName).toBe('Thirumangalam');
  });

  it('respects query limit parameter', () => {
    const results = searchLocalLocalities('nagar', 4);
    expect(results.length).toBeLessThanOrEqual(4);
  });

  it('returns empty array on empty or invalid query', () => {
    expect(searchLocalLocalities('')).toEqual([]);
    expect(searchLocalLocalities('   ')).toEqual([]);
    expect(searchLocalLocalities(null)).toEqual([]);
  });
});
