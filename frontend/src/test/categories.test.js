import { describe, it, expect } from 'vitest';
import {
  GENERAL_SAFETY_CATEGORIES,
  WOMEN_SAFETY_CATEGORIES,
  SAFE_SPOT_CATEGORIES,
  ALL_CATEGORIES,
  AFFECTED_GROUPS,
} from '../utils/categories';
import { CHENNAI_BOUNDS, CHENNAI_CENTER } from '../utils/bounds';

describe('Categories Specification (§4.1)', () => {
  it('keeps General Safety, Women Safety, and Safe Spot categories strictly separated', () => {
    const generalIds = new Set(GENERAL_SAFETY_CATEGORIES.map((c) => c.id));
    const womenIds = new Set(WOMEN_SAFETY_CATEGORIES.map((c) => c.id));
    const safeIds = new Set(SAFE_SPOT_CATEGORIES.map((c) => c.id));

    // Ensure no overlapping category IDs (except other_general which can be shared/distinguished)
    for (const id of generalIds) {
      expect(womenIds.has(id)).toBe(false);
    }
    for (const id of safeIds) {
      if (id !== 'other_general') {
        expect(womenIds.has(id)).toBe(false);
        expect(generalIds.has(id)).toBe(false);
      }
    }

    expect(GENERAL_SAFETY_CATEGORIES.length).toBe(7);
    expect(WOMEN_SAFETY_CATEGORIES.length).toBe(5);
    expect(SAFE_SPOT_CATEGORIES.length).toBe(6);
    expect(ALL_CATEGORIES.length).toBe(18);
  });

  it('distinguishes "Other" for general and women lists', () => {
    expect(GENERAL_SAFETY_CATEGORIES.some((c) => c.id === 'other_general')).toBe(true);
    expect(WOMEN_SAFETY_CATEGORIES.some((c) => c.id === 'other_women')).toBe(true);
  });

  it('provides all 5 affected demographic groups', () => {
    const groupIds = AFFECTED_GROUPS.map((g) => g.id);
    expect(groupIds).toEqual(['woman', 'man', 'elderly', 'child', 'general']);
  });
});

describe('Chennai Bounds Specification (§11a)', () => {
  it('has exact OSM Nominatim coordinates', () => {
    const [sw, ne] = CHENNAI_BOUNDS;
    expect(sw[0]).toBeCloseTo(80.1070369, 5); // minlon
    expect(sw[1]).toBeCloseTo(12.9205289, 5); // minlat
    expect(ne[0]).toBeCloseTo(80.4270369, 5); // maxlon
    expect(ne[1]).toBeCloseTo(13.2405289, 5); // maxlat
  });

  it('center coordinates lie within Chennai bounds', () => {
    const [cLng, cLat] = CHENNAI_CENTER;
    const [sw, ne] = CHENNAI_BOUNDS;
    expect(cLng).toBeGreaterThanOrEqual(sw[0]);
    expect(cLng).toBeLessThanOrEqual(ne[0]);
    expect(cLat).toBeGreaterThanOrEqual(sw[1]);
    expect(cLat).toBeLessThanOrEqual(ne[1]);
  });
});
