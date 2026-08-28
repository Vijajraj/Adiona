import { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  CHENNAI_BOUNDS,
  CHENNAI_CENTER,
  DEFAULT_ZOOM,
  MAP_STYLE_URL,
  MAP_STYLE_DARK_URL,
} from '../utils/bounds';
import { fetchHeatmap } from '../utils/api';
import { ReportModal } from './ReportModal';
import { ConfirmPrompt } from './ConfirmPrompt';
import { FilterBar } from './FilterBar';
import { PrivacyNoticeModal } from './PrivacyNotice';
import { ModerationModal } from './ModerationModal';
import { Sun, Moon, Plus, Shield, Info, RefreshCw } from 'lucide-react';

const HEATMAP_SOURCE_ID = 'safety-reports-source';
const HEATMAP_LAYER_ID = 'safety-reports-heatmap';
const POINTS_LAYER_ID = 'safety-reports-points';

export function MapView({ deviceId }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const clickMarkerRef = useRef(null);
  const abortControllerRef = useRef(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [heatmapData, setHeatmapData] = useState([]);
  const [filters, setFilters] = useState({
    category: null,
    hours_back: null,
    affected_group: null,
  });

  // Modals state
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [existingReportToConfirm, setExistingReportToConfirm] = useState(null);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isModerationModalOpen, setIsModerationModalOpen] = useState(false);
  const [loadingHeatmap, setLoadingHeatmap] = useState(false);

  // Helper to convert data to GeoJSON
  const createGeoJSON = useCallback((data) => ({
    type: 'FeatureCollection',
    features: (data || []).map((point) => ({
      type: 'Feature',
      id: point.id,
      properties: {
        id: point.id,
        category: point.category,
        status: point.status,
        confirmations: point.confirmations || 0,
        weight: point.weight || 1,
        lat: point.lat,
        lng: point.lng,
      },
      geometry: {
        type: 'Point',
        coordinates: [point.lng, point.lat],
      },
    })),
  }), []);

  // Configure layers onto the map instance
  const setupHeatmapLayers = useCallback((map, data) => {
    if (!map) return;

    const geojson = createGeoJSON(data);

    if (!map.getSource(HEATMAP_SOURCE_ID)) {
      map.addSource(HEATMAP_SOURCE_ID, {
        type: 'geojson',
        data: geojson,
      });
    } else {
      map.getSource(HEATMAP_SOURCE_ID).setData(geojson);
    }

    if (!map.getLayer(HEATMAP_LAYER_ID)) {
      map.addLayer({
        id: HEATMAP_LAYER_ID,
        type: 'heatmap',
        source: HEATMAP_SOURCE_ID,
        maxzoom: 17,
        paint: {
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'weight'],
            0, 0,
            1, 0.4,
            3, 0.7,
            5, 1.0,
            10, 1.5,
          ],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(0, 0, 0, 0)',
            0.15, 'rgb(65, 182, 196)',
            0.35, 'rgb(254, 217, 118)',
            0.65, 'rgb(254, 153, 41)',
            0.85, 'rgb(227, 26, 28)',
            1.0, 'rgb(128, 0, 38)',
          ],
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 15,
            13, 25,
            16, 45,
          ],
          'heatmap-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            14, 0.85,
            17, 0.65,
          ],
        },
      });
    }

    if (!map.getLayer(POINTS_LAYER_ID)) {
      map.addLayer({
        id: POINTS_LAYER_ID,
        type: 'circle',
        source: HEATMAP_SOURCE_ID,
        minzoom: 13,
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            13, 5,
            16, 10,
          ],
          'circle-color': [
            'interpolate',
            ['linear'],
            ['get', 'weight'],
            1, '#f59e0b',
            5, '#ef4444',
            10, '#991b1b',
          ],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1.5,
          'circle-opacity': 0.85,
        },
      });

      map.on('mouseenter', POINTS_LAYER_ID, () => {
        if (map.getCanvas()) map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', POINTS_LAYER_ID, () => {
        if (map.getCanvas()) map.getCanvas().style.cursor = 'crosshair';
      });
    }
  }, [createGeoJSON]);

  // Load heatmap data from backend with AbortController to prevent race conditions
  const loadHeatmapData = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoadingHeatmap(true);
    try {
      const data = await fetchHeatmap(filters, controller.signal);
      setHeatmapData(data);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Failed to load heatmap:', err);
      }
    } finally {
      setLoadingHeatmap(false);
    }
  }, [filters]);

  // Update GeoJSON source when heatmapData changes
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const source = mapRef.current.getSource(HEATMAP_SOURCE_ID);
    if (source) {
      source.setData(createGeoJSON(heatmapData));
    } else {
      setupHeatmapLayers(mapRef.current, heatmapData);
    }
  }, [heatmapData, mapLoaded, createGeoJSON, setupHeatmapLayers]);

  // Close helper
  const handleModalClose = useCallback(() => {
    if (clickMarkerRef.current) {
      clickMarkerRef.current.remove();
      clickMarkerRef.current = null;
    }
    setIsReportModalOpen(false);
    setIsConfirmModalOpen(false);
    setIsPrivacyModalOpen(false);
    setIsModerationModalOpen(false);
  }, []);

  const handleModalCloseRef = useRef(handleModalClose);
  useEffect(() => {
    handleModalCloseRef.current = handleModalClose;
  }, [handleModalClose]);

  // Keyboard accessibility: Escape to close modals (using ref to avoid stale closures)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleModalCloseRef.current();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle window resizing to keep map canvas synced
  useEffect(() => {
    const handleResize = () => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initial Map Setup
  useEffect(() => {
    if (mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: isDarkMode ? MAP_STYLE_DARK_URL : MAP_STYLE_URL,
      center: CHENNAI_CENTER,
      zoom: DEFAULT_ZOOM,
      minZoom: 10,
      maxZoom: 19,
      maxBounds: CHENNAI_BOUNDS,
      attributionControl: false,
    });

    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'bottom-right');
    map.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: false,
      }),
      'bottom-right'
    );
    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution: '© OpenFreeMap © OpenStreetMap contributors',
      }),
      'bottom-left'
    );

    map.on('load', () => {
      setMapLoaded(true);
    });

    map.on('click', (e) => {
      const { lng, lat } = e.lngLat;

      if (
        lng < CHENNAI_BOUNDS[0][0] ||
        lng > CHENNAI_BOUNDS[1][0] ||
        lat < CHENNAI_BOUNDS[0][1] ||
        lat > CHENNAI_BOUNDS[1][1]
      ) {
        return;
      }

      // Check if user clicked an existing point (guard against unmounted layer)
      const pointsLayerExists = map.getLayer(POINTS_LAYER_ID);
      if (pointsLayerExists) {
        const features = map.queryRenderedFeatures(e.point, { layers: [POINTS_LAYER_ID] });
        if (features && features.length > 0) {
          const feature = features[0];
          const props = feature.properties || {};
          if (props.id) {
            setExistingReportToConfirm({
              id: props.id,
              lat: props.lat || lat,
              lng: props.lng || lng,
              category: props.category,
              status: props.status,
              confirmations: props.confirmations || 0,
            });
            setSelectedCoords({ lat, lng });
            setIsConfirmModalOpen(true);
            return;
          }
        }
      }

      // Show temporary pin on click
      if (clickMarkerRef.current) {
        clickMarkerRef.current.remove();
      }
      clickMarkerRef.current = new maplibregl.Marker({ color: '#4f46e5' })
        .setLngLat([lng, lat])
        .addTo(map);

      setSelectedCoords({ lat, lng });
      setIsReportModalOpen(true);
    });

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (clickMarkerRef.current) {
        clickMarkerRef.current.remove();
        clickMarkerRef.current = null;
      }
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Fetch heatmap on mount & filter changes
  useEffect(() => {
    loadHeatmapData();
  }, [loadHeatmapData]);

  // Robust Map Style Toggle (Light <-> Dark)
  const toggleMapStyle = () => {
    if (!mapRef.current) return;
    const nextDarkMode = !isDarkMode;
    setIsDarkMode(nextDarkMode);

    const nextStyle = nextDarkMode ? MAP_STYLE_DARK_URL : MAP_STYLE_URL;
    mapRef.current.setStyle(nextStyle);

    mapRef.current.once('style.load', () => {
      setupHeatmapLayers(mapRef.current, heatmapData);
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({ category: null, hours_back: null, affected_group: null });
  };

  const handleReportSuccess = () => {
    if (clickMarkerRef.current) {
      clickMarkerRef.current.remove();
      clickMarkerRef.current = null;
    }
    loadHeatmapData();
  };

  return (
    <div className="map-view-root">
      {/* Top Header Bar */}
      <header className="app-header">
        <div className="header-brand">
          <div className="brand-icon">
            <Shield size={22} className="text-white" />
          </div>
          <div>
            <h1 className="brand-title">Chennai Safety Map</h1>
            <p className="brand-subtitle">Hyperlocal Open Crowdsourced Safety Network</p>
          </div>
        </div>

        <div className="header-actions">
          {/* Refresh Button */}
          <button
            type="button"
            className="action-btn"
            onClick={loadHeatmapData}
            title="Refresh heatmap data"
            aria-label="Refresh data"
          >
            <RefreshCw size={18} className={loadingHeatmap ? 'animate-spin' : ''} />
          </button>

          {/* Style Toggle */}
          <button
            type="button"
            className="action-btn"
            onClick={toggleMapStyle}
            title={isDarkMode ? 'Switch to Light Map' : 'Switch to Dark Map'}
            aria-label="Toggle map theme"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Moderation Queue Button */}
          <button
            type="button"
            className="action-btn moderation-btn"
            onClick={() => setIsModerationModalOpen(true)}
            title="Moderation Queue"
            aria-label="Open moderation queue"
          >
            <Shield size={18} />
            <span className="hidden sm:inline">Moderation</span>
          </button>

          {/* Privacy Disclosure Button */}
          <button
            type="button"
            className="action-btn privacy-btn"
            onClick={() => setIsPrivacyModalOpen(true)}
            title="Privacy & Anonymity Disclosure"
          >
            <Info size={18} />
            <span className="hidden sm:inline">Anonymity & Privacy</span>
          </button>
        </div>
      </header>

      {/* Map Canvas */}
      <div ref={mapContainerRef} className="map-canvas" />

      {/* Floating Instructions Banner */}
      <div className="map-instructions-badge">
        <Plus size={16} />
        <span>Click anywhere on Chennai map to report or confirm a spot</span>
      </div>

      {/* Heatmap Legend */}
      <div className="heatmap-legend">
        <div className="legend-title">Safety Density</div>
        <div className="legend-gradient" />
        <div className="legend-labels">
          <span>Low Concern</span>
          <span>Moderate</span>
          <span>High Severity</span>
        </div>
      </div>

      {/* Filter Bar Component */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={handleModalClose}
        coordinates={selectedCoords}
        deviceId={deviceId}
        onReportSubmitted={handleReportSuccess}
        onOpenPrivacy={() => setIsPrivacyModalOpen(true)}
      />

      {/* Confirm Modal */}
      <ConfirmPrompt
        isOpen={isConfirmModalOpen}
        onClose={handleModalClose}
        existingReport={existingReportToConfirm}
        deviceId={deviceId}
        onConfirmed={handleReportSuccess}
        onProceedWithNewReport={() => {
          setIsConfirmModalOpen(false);
          setIsReportModalOpen(true);
        }}
      />

      {/* Full Privacy Disclosure Modal */}
      <PrivacyNoticeModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />

      {/* Moderation Modal */}
      <ModerationModal
        isOpen={isModerationModalOpen}
        onClose={() => setIsModerationModalOpen(false)}
        onRefreshMap={loadHeatmapData}
      />
    </div>
  );
}
