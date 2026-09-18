import { useEffect, useCallback, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import { fetchHeatmap } from '../utils/api';

export const REPORTS_SOURCE_ID = 'reports';
export const CLUSTERS_LAYER_ID = 'clusters';
export const CLUSTER_COUNT_LAYER_ID = 'cluster-count';
export const UNCLUSTERED_LAYER_ID = 'unclustered-point';

/**
 * Convert flat reports array to GeoJSON FeatureCollection
 * Coordinate order: [longitude, latitude] (GeoJSON standard)
 */
export function toGeoJSON(reportsData) {
  return {
    type: 'FeatureCollection',
    features: (reportsData || []).map((point) => ({
      type: 'Feature',
      id: point.id,
      geometry: {
        type: 'Point',
        coordinates: [point.lng, point.lat], // [lng, lat] GeoJSON standard
      },
      properties: {
        id: point.id,
        category: point.category,
        status: point.status,
        confirmations: point.confirmations || 0,
        weight: typeof point.weight === 'number' ? point.weight : 1,
        note: point.note || '',
        lat: point.lat,
        lng: point.lng,
      },
    })),
  };
}

export function ReportMarkersLayer({
  map,
  mapLoaded,
  filters,
  refreshKey,
  onLoadingChange,
  onPointSelect,
}) {
  const abortControllerRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const retryCountRef = useRef(0);
  const activePopupRef = useRef(null);

  const loadAndApplyReports = useCallback(async () => {
    if (!map) return;
    if (!mapLoaded && !map.loaded()) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    if (onLoadingChange) onLoadingChange(true);

    try {
      const data = await fetchHeatmap(filters, controller.signal);
      const geojson = toGeoJSON(data);
      console.log(`[Adiona] Clustered markers data received: ${geojson.features.length} points`);

      // 1. Add or update MapLibre GeoJSON Source with clustering enabled (Step 2)
      const existingSource = map.getSource(REPORTS_SOURCE_ID);
      if (existingSource) {
        existingSource.setData(geojson);
      } else {
        map.addSource(REPORTS_SOURCE_ID, {
          type: 'geojson',
          data: geojson,
          cluster: true,
          clusterMaxZoom: 14, // Max zoom to cluster points on
          clusterRadius: 50,  // Radius of each cluster when clustering points (defaults to 50)
        });
      }

      // 2. Add Cluster Circles Layer (Step 3.1)
      if (!map.getLayer(CLUSTERS_LAYER_ID)) {
        map.addLayer({
          id: CLUSTERS_LAYER_ID,
          type: 'circle',
          source: REPORTS_SOURCE_ID,
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'step',
              ['get', 'point_count'],
              '#51bbd6', // Blue for < 10 points
              10,
              '#f1f075', // Yellow for 10 - 30 points
              30,
              '#f28cb1', // Pink/Red for >= 30 points
            ],
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              18,
              10,
              24,
              30,
              30,
            ],
            'circle-stroke-width': 2.5,
            'circle-stroke-color': '#ffffff',
            'circle-opacity': 0.9,
          },
        });
      }

      // 3. Add Cluster Count Label Layer (Step 3.2)
      if (!map.getLayer(CLUSTER_COUNT_LAYER_ID)) {
        map.addLayer({
          id: CLUSTER_COUNT_LAYER_ID,
          type: 'symbol',
          source: REPORTS_SOURCE_ID,
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
            'text-size': 13,
          },
          paint: {
            'text-color': '#111827',
          },
        });
      }

      // 4. Add Unclustered Individual Point Layer (Step 3.3)
      if (!map.getLayer(UNCLUSTERED_LAYER_ID)) {
        map.addLayer({
          id: UNCLUSTERED_LAYER_ID,
          type: 'circle',
          source: REPORTS_SOURCE_ID,
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': [
              'match',
              ['get', 'status'],
              'unsafe', '#ef4444',
              'safe', '#10b981',
              '#f59e0b',
            ],
            'circle-radius': 7,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
            'circle-opacity': 0.95,
          },
        });
      }

      // 5. Interactivity: Cluster Click Zoom Expansion (Step 4.1)
      map.off('click', CLUSTERS_LAYER_ID);
      map.on('click', CLUSTERS_LAYER_ID, (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: [CLUSTERS_LAYER_ID],
        });
        if (!features.length) return;
        const clusterId = features[0].properties.cluster_id;
        const source = map.getSource(REPORTS_SOURCE_ID);
        if (!source || !source.getClusterExpansionZoom) return;

        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
          map.easeTo({
            center: features[0].geometry.coordinates,
            zoom: zoom + 0.5,
          });
        });
      });

      // 6. Interactivity: Unclustered Point Click Popup (Step 4.2)
      map.off('click', UNCLUSTERED_LAYER_ID);
      map.on('click', UNCLUSTERED_LAYER_ID, (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: [UNCLUSTERED_LAYER_ID],
        });
        if (!features.length) return;
        const feature = features[0];
        const coordinates = feature.geometry.coordinates.slice();
        const { id, category, status, note, confirmations, lat, lng } = feature.properties;

        if (onPointSelect) {
          onPointSelect({
            id,
            category,
            status,
            note,
            confirmations,
            lat: lat || coordinates[1],
            lng: lng || coordinates[0],
          });
        }

        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        if (activePopupRef.current) {
          activePopupRef.current.remove();
        }

        const isUnsafe = status === 'unsafe';
        const statusColor = isUnsafe ? '#ef4444' : (status === 'safe' ? '#10b981' : '#f59e0b');
        const formattedCategory = (category || 'Safety Incident').replace(/_/g, ' ');
        const noteHtml = note
          ? `<div style="margin-top: 6px; padding: 6px; background-color: #f3f4f6; border-radius: 4px; color: #374151; font-size: 12px; font-style: italic;">"${note}"</div>`
          : '';

        const popup = new maplibregl.Popup({ offset: 12, closeButton: true })
          .setLngLat(coordinates)
          .setHTML(`
            <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 13px; line-height: 1.4; color: #111827; padding: 4px 6px; min-width: 170px;">
              <div style="font-weight: 700; text-transform: capitalize; font-size: 14px; margin-bottom: 3px;">
                ${formattedCategory}
              </div>
              <div style="display: flex; align-items: center; gap: 6px; font-size: 12px; margin-bottom: 2px;">
                <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${statusColor};"></span>
                <span style="font-weight: 600; text-transform: uppercase; color: ${statusColor};">${status}</span>
                <span style="color: #6b7280;">· ${confirmations || 0} confirms</span>
              </div>
              ${noteHtml}
            </div>
          `)
          .addTo(map);

        activePopupRef.current = popup;
      });

      // 7. Cursor hover effects
      map.on('mouseenter', CLUSTERS_LAYER_ID, () => {
        if (map.getCanvas()) map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', CLUSTERS_LAYER_ID, () => {
        if (map.getCanvas()) map.getCanvas().style.cursor = 'crosshair';
      });
      map.on('mouseenter', UNCLUSTERED_LAYER_ID, () => {
        if (map.getCanvas()) map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', UNCLUSTERED_LAYER_ID, () => {
        if (map.getCanvas()) map.getCanvas().style.cursor = 'crosshair';
      });

      retryCountRef.current = 0; // Reset on success
      if (onLoadingChange) onLoadingChange(false);
    } catch (err) {
      if (err.name !== 'AbortError') {
        const MAX_RETRIES = 3;
        retryCountRef.current += 1;
        if (onLoadingChange) onLoadingChange(false);

        if (retryCountRef.current <= MAX_RETRIES) {
          const delay = 5000 * Math.pow(2, retryCountRef.current - 1); // 5s, 10s, 20s
          console.warn(`[Adiona] Fetch failed (attempt ${retryCountRef.current}/${MAX_RETRIES}), retrying in ${delay / 1000}s:`, err.message);
          if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = setTimeout(() => {
            loadAndApplyReports();
          }, delay);
        } else {
          console.error(`[Adiona] Fetch failed after ${MAX_RETRIES} retries, giving up. Reload the page to try again.`, err.message);
        }
      }
    }
  }, [map, mapLoaded, filters, onLoadingChange, onPointSelect]);

  // Handle map style changes (e.g. Dark/Light theme toggle)
  useEffect(() => {
    if (!map) return;
    const handleStyleLoad = () => {
      loadAndApplyReports();
    };
    map.on('style.load', handleStyleLoad);
    return () => {
      map.off('style.load', handleStyleLoad);
    };
  }, [map, loadAndApplyReports]);

  // Handle data fetch and refresh triggers (Step 5)
  useEffect(() => {
    loadAndApplyReports();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (activePopupRef.current) {
        activePopupRef.current.remove();
      }
    };
  }, [loadAndApplyReports, refreshKey]);

  return null;
}
