import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import LanguageToggle from '../components/LanguageToggle';
import { LanguageProvider } from '../i18n/LanguageContext';
import { DashboardModal } from '../components/DashboardModal';
import { RouteSafetyModal } from '../components/RouteSafetyModal';
import * as api from '../utils/api';
import { CHENNAI_BOUNDS } from '../utils/bounds';

const helpPointsPath = path.resolve(__dirname, '../../public/data/help_points.geojson');
const helpPointsGeoJSON = JSON.parse(fs.readFileSync(helpPointsPath, 'utf8'));

describe('Phase 2 — Tamil Localization (§3.3)', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('adiona_language', 'en');
  });

  it('toggles language between English and Tamil and updates html lang attribute', () => {
    render(
      <LanguageProvider>
        <LanguageToggle />
      </LanguageProvider>
    );

    const toggleBtn = screen.getByRole('button');
    expect(toggleBtn).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');

    // Click toggle to switch language
    fireEvent.click(toggleBtn);
    expect(localStorage.getItem('adiona_language')).toBe('ta');
    expect(document.documentElement.lang).toBe('ta');
  });
});

describe('Phase 2 — Nearby Emergency Help Points Data (§3.10)', () => {
  it('contains valid GeoJSON features strictly within Chennai bounds', () => {
    expect(helpPointsGeoJSON.type).toBe('FeatureCollection');
    expect(Array.isArray(helpPointsGeoJSON.features)).toBe(true);
    expect(helpPointsGeoJSON.features.length).toBeGreaterThanOrEqual(10);

    const [minLng, minLat] = CHENNAI_BOUNDS[0];
    const [maxLng, maxLat] = CHENNAI_BOUNDS[1];

    helpPointsGeoJSON.features.forEach((f) => {
      expect(f.type).toBe('Feature');
      expect(f.geometry.type).toBe('Point');
      const [lng, lat] = f.geometry.coordinates;

      expect(lat).toBeGreaterThanOrEqual(minLat);
      expect(lat).toBeLessThanOrEqual(maxLat);
      expect(lng).toBeGreaterThanOrEqual(minLng);
      expect(lng).toBeLessThanOrEqual(maxLng);

      expect(f.properties.id).toBeDefined();
      expect(f.properties.name).toBeDefined();
      expect(['police', 'hospital', 'pharmacy', 'transit']).toContain(f.properties.type);
      expect(f.properties.open_hours).toBeDefined();
    });
  });
});

describe('Phase 2 — Lower-Reported-Risk Route Suggestion (§3.7)', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('adiona_language', 'en');
  });

  it('evaluates corridor risk and displays lower-reported-risk phrasing without saying "safe route"', async () => {
    vi.spyOn(api, 'scoreRouteGeometry').mockResolvedValueOnce({
      total_points: 13,
      cells_traversed: 8,
      unsafe_cells_count: 2,
      max_cell_risk: 3.2,
      aggregate_risk_score: 5.4,
      lighting_flags_after_dark: 1,
      high_risk_categories: ['poor_lighting'],
      plain_language_summary: 'Route passes 1 cell flagged for poor lighting after dark. Evaluated as lower-reported-risk corridor.',
    });

    render(
      <LanguageProvider>
        <RouteSafetyModal isOpen={true} onClose={() => {}} />
      </LanguageProvider>
    );

    expect(screen.getByText(/Lower-Reported-Risk Route/i)).toBeInTheDocument();

    const checkBtn = screen.getByRole('button', { name: /Evaluate Route Corridor/i });
    fireEvent.click(checkBtn);

    await waitFor(() => {
      expect(screen.getByText(/Lower-Reported-Risk Evaluation Complete/i)).toBeInTheDocument();
      expect(screen.getByText(/Route passes 1 cell flagged for poor lighting after dark/i)).toBeInTheDocument();
    });

    // Mandatory compliance check: Never use the absolute phrase "safe route"
    const textContent = document.body.textContent.toLowerCase();
    expect(textContent).not.toContain('this is a safe route');
  });
});

describe('Phase 2 — Institutional Dashboard & Open Data (§3.5, §3.6)', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('adiona_language', 'en');
  });

  it('renders auth gate initially and allows switching to Open Data tab', () => {
    render(
      <LanguageProvider>
        <DashboardModal isOpen={true} onClose={() => {}} />
      </LanguageProvider>
    );

    // Initial restricted state
    expect(screen.getByText(/Restricted Institutional Access/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter Admin Secret/i)).toBeInTheDocument();

    // Switch to Open Data tab
    const openDataTab = screen.getByRole('button', { name: /Open Data Export/i });
    fireEvent.click(openDataTab);

    expect(screen.getByText(/Creative Commons Attribution 4.0 International/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download CSV Dataset/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download JSON Dataset/i })).toBeInTheDocument();
  });
});
