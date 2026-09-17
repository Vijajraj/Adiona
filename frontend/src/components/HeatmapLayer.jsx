import { useEffect, useCallback, useRef } from 'react';
import { fetchHeatmap } from '../utils/api';

export const HEATMAP_SOURCE_ID = 'safety-reports-source';
export const HEATMAP_LAYER_ID = 'safety-reports-heatmap';
export const POINTS_LAYER_ID = 'safety-reports-points';

/**
 * Convert flat heatmap data array to standard GeoJSON FeatureCollection
 * Spec §9 & GeoJSON standard: coordinates must be [longitude, latitude]
 */
export function toGeoJSON(heatmapData) {
  return {
    type: 'FeatureCollection',
    features: (heatmapData || []).map((point) => ({
      type: 'Feature',
      id: point.id,
      geometry: {
        type: 'Point',
        coordinates: [point.lng, point.lat], // GeoJSON order: [lng, lat]
      },
      properties: {
        id: point.id,
        weight: typeof point.weight === 'number' ? point.weight : 1,
        category: point.category,
        status: point.status,
        confirmations: point.confirmations || 0,
        lat: point.lat,
        lng: point.lng,
      },
    })),
  };
}

export function HeatmapLayer({ map, mapLoaded, filters, refreshKey, onLoadingChange }) {
  const abortControllerRef = useRef(null);
  const retryTimeoutRef = useRef(null);

  const loadAndApplyHeatmap = useCallback(async () => {
    if (!map || !mapLoaded) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    if (onLoadingChange) onLoadingChange(true);

    try {
      const data = await fetchHeatmap(filters, controller.signal);
      const geojson = toGeoJSON(data);

      if (!map.isStyleLoaded()) {
        await new Promise((resolve) => map.once('style.load', resolve));
      }

      // Add or update MapLibre GeoJSON source
      const existingSource = map.getSource(HEATMAP_SOURCE_ID);
      if (existingSource) {
        existingSource.setData(geojson);
      } else {
        map.addSource(HEATMAP_SOURCE_ID, {
          type: 'geojson',
          data: geojson,
        });
      }

      // Add heatmap layer if missing
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
              0, 0.5,
              1, 0.8,
              3, 1.0,
              5, 1.5,
            ],
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0, 'rgba(0, 0, 0, 0)',
              0.05, 'rgb(65, 182, 196)',
              0.2, 'rgb(254, 217, 118)',
              0.5, 'rgb(254, 153, 41)',
              0.8, 'rgb(227, 26, 28)',
              1.0, 'rgb(128, 0, 38)',
            ],
            'heatmap-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              2, 15,
              10, 25,
              13, 35,
              16, 55,
            ],
            'heatmap-opacity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              2, 0.95,
              14, 0.85,
              17, 0.65,
            ],
          },
        });
      }

      // Add circle points layer for individual incident inspection
      if (!map.getLayer(POINTS_LAYER_ID)) {
        map.addLayer({
          id: POINTS_LAYER_ID,
          type: 'circle',
          source: HEATMAP_SOURCE_ID,
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              2, 4,
              8, 6,
              12, 8,
              16, 14,
            ],
            'circle-color': [
              'match',
              ['get', 'status'],
              'unsafe', '#ef4444',
              'safe', '#10b981',
              '#f59e0b',
            ],
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1.5,
            'circle-opacity': 0.9,
          },
        });

        map.on('mouseenter', POINTS_LAYER_ID, () => {
          if (map.getCanvas()) map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', POINTS_LAYER_ID, () => {
          if (map.getCanvas()) map.getCanvas().style.cursor = 'crosshair';
        });
      }

      if (onLoadingChange) onLoadingChange(false);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('Heatmap fetch encountered an error, retrying in 5s for cloud backend spinup...', err);
        if (onLoadingChange) onLoadingChange(false);
        // Automatic single retry in case backend was cold-starting
        if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = setTimeout(() => {
          loadAndApplyHeatmap();
        }, 5000);
      }
    }
  }, [map, mapLoaded, filters, onLoadingChange]);

  // Handle map style changes (e.g. Dark/Light toggle)
  useEffect(() => {
    if (!map) return;
    const handleStyleLoad = () => {
      loadAndApplyHeatmap();
    };
    map.on('style.load', handleStyleLoad);
    return () => {
      map.off('style.load', handleStyleLoad);
    };
  }, [map, loadAndApplyHeatmap]);

  useEffect(() => {
    loadAndApplyHeatmap();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [loadAndApplyHeatmap, refreshKey]);

  return null;
}
