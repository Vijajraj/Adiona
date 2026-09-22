import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Mock maplibre-gl constructors so MapView can mount cleanly in jsdom
vi.mock('maplibre-gl', () => {
  function MockMap() {
    this.on = vi.fn();
    this.off = vi.fn();
    this.once = vi.fn();
    this.remove = vi.fn();
    this.resize = vi.fn();
    this.addControl = vi.fn();
    this.addSource = vi.fn();
    this.getSource = vi.fn();
    this.addLayer = vi.fn();
    this.getLayer = vi.fn();
    this.setStyle = vi.fn();
    this.flyTo = vi.fn();
    this.easeTo = vi.fn();
    this.fitBounds = vi.fn();
    this.loaded = vi.fn(() => true);
    this.isStyleLoaded = vi.fn(() => true);
    this.getCanvas = vi.fn(() => ({ style: {} }));
  }

  function MockMarker() {
    this.setLngLat = vi.fn().mockReturnThis();
    this.addTo = vi.fn().mockReturnThis();
    this.remove = vi.fn();
  }

  function MockBounds() {
    this.extend = vi.fn();
  }

  return {
    Map: MockMap,
    Marker: MockMarker,
    NavigationControl: function () {},
    GeolocateControl: function () {},
    AttributionControl: function () {},
    LngLatBounds: MockBounds,
    setWorkerUrl: vi.fn(),
  };
});

import { MapView } from '../components/MapView';

describe('MapView Component Mount Test', () => {
  it('mounts cleanly without any ReferenceError or runtime crash', () => {
    render(<MapView />);

    const brandHeaders = screen.getAllByText('Chennai Safety Map');
    expect(brandHeaders.length).toBeGreaterThan(0);
    expect(screen.getByText('Safety Density')).toBeInTheDocument();
  });
});
