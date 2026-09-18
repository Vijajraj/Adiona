import { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// Ensure MapLibre Web Worker loads correctly in Vite / Vercel production
if (typeof window !== 'undefined' && typeof maplibregl.setWorkerUrl === 'function') {
  maplibregl.setWorkerUrl('/assets/maplibre-gl-worker.mjs');
}
import {
  CHENNAI_BOUNDS,
  CHENNAI_CENTER,
  DEFAULT_ZOOM,
  MAP_STYLE_URL,
  MAP_STYLE_DARK_URL,
} from '../utils/bounds';
import { ReportModal } from './ReportModal';
import { ConfirmPrompt } from './ConfirmPrompt';
import { FilterBar } from './FilterBar';
import { PrivacyNoticeModal } from './PrivacyNotice';
import { ModerationModal } from './ModerationModal';
import { FeedbackModal } from './FeedbackModal';
import { SearchBar } from './SearchBar';
import {
  ReportMarkersLayer,
  UNCLUSTERED_LAYER_ID,
  CLUSTERS_LAYER_ID,
} from './ReportMarkersLayer';
import { Sun, Moon, Plus, Shield, Info, RefreshCw, Share2, Check, Star, MessageSquareHeart } from 'lucide-react';

function GithubIcon({ size = 16, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

// Helper to parse deep-linked URL params (Spec §4.2)
function getInitialMapParams() {
  if (typeof window === 'undefined') {
    return { initialCenter: CHENNAI_CENTER, initialZoom: DEFAULT_ZOOM };
  }

  const params = new URLSearchParams(window.location.search);
  const lat = parseFloat(params.get('lat'));
  const lng = parseFloat(params.get('lng'));
  const zoom = parseFloat(params.get('zoom'));

  const minLng = CHENNAI_BOUNDS[0][0];
  const minLat = CHENNAI_BOUNDS[0][1];
  const maxLng = CHENNAI_BOUNDS[1][0];
  const maxLat = CHENNAI_BOUNDS[1][1];

  let initialCenter = CHENNAI_CENTER;
  let initialZoom = DEFAULT_ZOOM;

  if (
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= minLat &&
    lat <= maxLat &&
    lng >= minLng &&
    lng <= maxLng
  ) {
    initialCenter = [lng, lat];
  }

  if (!isNaN(zoom) && zoom >= 10 && zoom <= 19) {
    initialZoom = zoom;
  }

  return { initialCenter, initialZoom };
}

export function MapView({ deviceId }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const clickMarkerRef = useRef(null);
  const abortControllerRef = useRef(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showShareToast, setShowShareToast] = useState(false);
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
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [loadingHeatmap, setLoadingHeatmap] = useState(false);
  const [, setTick] = useState(0);

  // Periodic ticker to refresh relative time labels (e.g. "Updated 2m ago")
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const formatTimeAgo = useCallback((date) => {
    if (!date) return 'just now';
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 30) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  }, []);

  // Handle selecting an existing report from map markers
  const handleSelectReport = useCallback((report) => {
    if (clickMarkerRef.current) {
      clickMarkerRef.current.remove();
      clickMarkerRef.current = null;
    }
    setSelectedCoords({ lat: report.lat, lng: report.lng });
    setExistingReportToConfirm(report);
    setIsConfirmModalOpen(true);
  }, []);

  const handleSelectReportRef = useRef(handleSelectReport);
  useEffect(() => {
    handleSelectReportRef.current = handleSelectReport;
  }, [handleSelectReport]);

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
    setIsFeedbackModalOpen(false);
  }, []);

  const handleModalCloseRef = useRef(handleModalClose);
  useEffect(() => {
    handleModalCloseRef.current = handleModalClose;
  }, [handleModalClose]);

  // Keyboard accessibility: Escape to close modals
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

  // Initial Map Setup & Deep Linking
  useEffect(() => {
    if (mapRef.current) return;

    const { initialCenter, initialZoom } = getInitialMapParams();

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: isDarkMode ? MAP_STYLE_DARK_URL : MAP_STYLE_URL,
      center: initialCenter,
      zoom: initialZoom,
      minZoom: 2,
      maxZoom: 19,
      attributionControl: false,
    });

    mapRef.current = map;
    setMapInstance(map);
    if (typeof window !== 'undefined') {
      window.map = map;
    }

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

    const handleMapLoad = () => {
      setMapLoaded(true);
      map.resize();
    };

    if (map.loaded()) {
      handleMapLoad();
    } else {
      map.once('load', handleMapLoad);
    }

    // Update URL query params on pan/zoom (Spec §4.2 URL Coordinate Sharing)
    map.on('moveend', () => {
      if (!mapRef.current) return;
      const center = mapRef.current.getCenter();
      const currentZoom = Math.round(mapRef.current.getZoom());
      const url = new URL(window.location.href);
      url.searchParams.set('lat', center.lat.toFixed(4));
      url.searchParams.set('lng', center.lng.toFixed(4));
      url.searchParams.set('zoom', currentZoom.toString());
      window.history.replaceState({}, '', url.toString());
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

      // Check if user clicked a cluster or unclustered marker
      if (map.getLayer(CLUSTERS_LAYER_ID)) {
        const clusterFeatures = map.queryRenderedFeatures(e.point, { layers: [CLUSTERS_LAYER_ID] });
        if (clusterFeatures && clusterFeatures.length > 0) {
          return; // Handled by cluster zoom expansion
        }
      }

      if (map.getLayer(UNCLUSTERED_LAYER_ID)) {
        const pointFeatures = map.queryRenderedFeatures(e.point, { layers: [UNCLUSTERED_LAYER_ID] });
        if (pointFeatures && pointFeatures.length > 0) {
          const feature = pointFeatures[0];
          const props = feature.properties || {};
          const coords = feature.geometry.coordinates;
          handleSelectReportRef.current?.({
            id: props.id,
            category: props.category,
            status: props.status,
            confirmations: props.confirmations,
            note: props.note,
            created_at: props.created_at,
            lat: coords[1],
            lng: coords[0],
          });
          return;
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
      setMapInstance(null);
      if (typeof window !== 'undefined') {
        window.map = null;
      }
    };
  }, []);


  // Handle locality selection from Nominatim SearchBar
  const handleSelectLocality = (location) => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({
      center: [location.lng, location.lat],
      zoom: 15,
      essential: true,
    });

    // Temporary pin highlight
    if (clickMarkerRef.current) {
      clickMarkerRef.current.remove();
    }
    clickMarkerRef.current = new maplibregl.Marker({ color: '#10b981' })
      .setLngLat([location.lng, location.lat])
      .addTo(mapRef.current);
  };

  // URL Share link generator with Clipboard Toast
  const handleShareLink = () => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl).then(() => {
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2500);
    });
  };

  // Map Style Toggle
  const toggleMapStyle = () => {
    if (!mapRef.current) return;
    const nextDarkMode = !isDarkMode;
    setIsDarkMode(nextDarkMode);

    const nextStyle = nextDarkMode ? MAP_STYLE_DARK_URL : MAP_STYLE_URL;
    mapRef.current.setStyle(nextStyle);
    mapRef.current.once('styledata', () => {
      setRefreshKey((k) => k + 1); // forces ReportMarkersLayer to re-add source/layers
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
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="map-view-root">
      <ReportMarkersLayer
        map={mapLoaded ? mapInstance : null}
        apiBaseUrl={import.meta.env.VITE_API_BASE_URL}
        refreshTrigger={refreshKey}
        onSelectReport={handleSelectReport}
      />
      {/* Top Header Bar */}
      <header className="app-header">
        <div className="header-brand">
          <div className="brand-icon">
            <Shield size={22} className="text-white" />
          </div>
          <div>
            <h1 className="brand-title">Chennai Safety Map</h1>
            <p className="brand-subtitle">
              Hyperlocal Open Safety Network <span className="opacity-40">•</span> Information updated: 15/09/2006
            </p>
          </div>
        </div>

        {/* Search Bar (Spec §4.2) */}
        <SearchBar onSelectLocation={handleSelectLocality} />

        <div className="header-actions">
          {/* Star on GitHub */}
          <a
            href="https://github.com/Vijajraj/Adiona"
            target="_blank"
            rel="noopener noreferrer"
            className="action-btn github-star-btn"
            title="Star Adiona on GitHub"
            aria-label="Star on GitHub"
          >
            <GithubIcon size={16} />
            <Star size={14} className="fill-amber-400 text-amber-400" />
            <span className="hidden sm:inline">Star</span>
          </a>

          {/* Community Feedback */}
          <button
            type="button"
            className="action-btn feedback-btn"
            onClick={() => setIsFeedbackModalOpen(true)}
            title="Community Feedback & Suggestions"
            aria-label="Give Community Feedback"
          >
            <MessageSquareHeart size={18} className="text-rose-500" />
            <span className="hidden sm:inline">Feedback</span>
          </button>

          {/* Share Link Button (Spec §4.2) */}
          <button
            type="button"
            className="action-btn share-btn"
            onClick={handleShareLink}
            title="Share current map view URL"
            aria-label="Share location link"
          >
            <Share2 size={18} />
            <span className="hidden sm:inline">Share</span>
          </button>

          {/* Refresh Button with Live Time */}
          <button
            type="button"
            className="action-btn refresh-btn"
            onClick={() => {
              setLastUpdated(new Date());
              setRefreshKey((k) => k + 1);
            }}
            title={`Last updated: ${lastUpdated.toLocaleTimeString()} (${formatTimeAgo(lastUpdated)}) — Click to refresh`}
            aria-label="Refresh data"
          >
            <RefreshCw size={18} className={loadingHeatmap ? 'animate-spin' : ''} />
            <span className="text-xs text-slate-500 dark:text-slate-400 hidden lg:inline">
              {formatTimeAgo(lastUpdated)}
            </span>
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
        <span className="live-dot" />
        <span className="text-emerald-400 font-semibold">Live</span>
        <span className="opacity-40">•</span>
        <span>Information updated: 15/09/2006</span>
        <span className="opacity-40 hidden md:inline">•</span>
        <span className="hidden md:inline">Click anywhere to report</span>
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
        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 pt-1 border-t border-slate-200 dark:border-slate-800">
          Information updated: 15/09/2006
        </div>
      </div>

      {/* Filter Bar Component */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
      />

      {/* Share Toast Banner */}
      {showShareToast && (
        <div className="share-toast-badge" role="status">
          <Check size={18} />
          <span>Shareable map link copied to clipboard!</span>
        </div>
      )}

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
          if (mapRef.current && selectedCoords) {
            if (clickMarkerRef.current) {
              clickMarkerRef.current.remove();
            }
            clickMarkerRef.current = new maplibregl.Marker({ color: '#4f46e5' })
              .setLngLat([selectedCoords.lng, selectedCoords.lat])
              .addTo(mapRef.current);
          }
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
        onRefreshMap={() => setRefreshKey((k) => k + 1)}
      />

      {/* Community Feedback Modal */}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        deviceId={deviceId}
      />
    </div>
  );
}
