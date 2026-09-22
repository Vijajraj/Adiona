import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";

import seedReports from "../data/seedReports.json";

export const REPORTS_SOURCE_ID = "reports";
export const HEATMAP_SOURCE_ID = "reports-heatmap";
export const HEATMAP_LAYER_ID = "safety-heatmap";
export const CLUSTERS_LAYER_ID = "clusters";
export const CLUSTER_COUNT_LAYER_ID = "cluster-count";
export const UNCLUSTERED_LAYER_ID = "unclustered-point";

export function toGeoJSON(heatmapData) {
  return {
    type: "FeatureCollection",
    features: (heatmapData || []).map((point) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [point.lng, point.lat], // GeoJSON order: [lng, lat]
      },
      properties: {
        id: point.id,
        weight: Number(point.weight) || 1.5,
        status: point.status || "unsafe",
        category: point.category,
        affected_group: point.affected_group,
        confirmations: Number(point.confirmations) || 0,
        note: point.note,
        created_at: point.created_at,
      },
    })),
  };
}

/**
 * Filter GeoJSON features instantaneously on the client side.
 * Evaluates category, affected demographic group, and time window (hours_back).
 */
export function applyFiltersToGeoJSON(geojson, filters = {}) {
  if (!geojson || !Array.isArray(geojson.features)) return geojson;
  if (!filters) return geojson;

  const { category, hours_back, affected_group } = filters;
  if (!category && !hours_back && !affected_group) {
    return geojson;
  }

  const now = Date.now();
  const cutoffTime = hours_back ? now - Number(hours_back) * 3600 * 1000 : null;

  const filteredFeatures = geojson.features.filter((f) => {
    const props = f.properties || {};

    // 1. Category filter
    if (category && props.category !== category) {
      return false;
    }

    // 2. Affected demographic group filter
    if (affected_group && props.affected_group !== affected_group) {
      return false;
    }

    // 3. Time filter (hours_back)
    if (cutoffTime && props.created_at) {
      const createdAtTime = new Date(props.created_at).getTime();
      if (!isNaN(createdAtTime) && createdAtTime < cutoffTime) {
        return false;
      }
    }

    return true;
  });

  return {
    ...geojson,
    features: filteredFeatures,
  };
}

// Pre-initialize in-memory cache with curated Chennai reports so ANY device (mobile, Safari,
// cold-start Render, offline) immediately renders clusters and report markers in 0ms!
let cachedHeatmapGeoJSON = toGeoJSON(seedReports);

export default function ReportMarkersLayer({
  map,
  apiBaseUrl,
  refreshTrigger,
  refreshKey,
  onSelectReport,
  filters,
  viewMode = "both", // "both" | "heatmap" | "clusters"
  onStatsChange,
}) {
  const sourceAddedRef = useRef(false);
  const onSelectReportRef = useRef(onSelectReport);
  const prevFiltersRef = useRef(filters);

  useEffect(() => {
    onSelectReportRef.current = onSelectReport;
  }, [onSelectReport]);

  // Immediately notify parent of current stats
  useEffect(() => {
    if (onStatsChange && cachedHeatmapGeoJSON) {
      const displayData = applyFiltersToGeoJSON(cachedHeatmapGeoJSON, filters);
      onStatsChange({
        totalCount: cachedHeatmapGeoJSON.features.length,
        filteredCount: displayData.features.length,
        features: displayData.features,
      });
    }
  }, [filters, onStatsChange]);

  // Adjust layer opacities dynamically when viewMode changes
  useEffect(() => {
    if (!map || !map.isStyleLoaded()) return;

    try {
      if (map.getLayer(HEATMAP_LAYER_ID)) {
        map.setPaintProperty(
          HEATMAP_LAYER_ID,
          "heatmap-opacity",
          viewMode === "clusters" ? 0 : 0.82
        );
      }
      if (map.getLayer(CLUSTERS_LAYER_ID)) {
        map.setPaintProperty(
          CLUSTERS_LAYER_ID,
          "circle-opacity",
          viewMode === "heatmap" ? 0 : 0.88
        );
      }
      if (map.getLayer(CLUSTER_COUNT_LAYER_ID)) {
        map.setPaintProperty(
          CLUSTER_COUNT_LAYER_ID,
          "text-opacity",
          viewMode === "heatmap" ? 0 : 1
        );
      }
      if (map.getLayer(UNCLUSTERED_LAYER_ID)) {
        map.setPaintProperty(
          UNCLUSTERED_LAYER_ID,
          "circle-opacity",
          viewMode === "heatmap" ? 0.35 : 1
        );
      }
    } catch (err) {
      // Map style may be changing
    }
  }, [map, viewMode]);

  // Immediately re-attach clusters & safety density heatmap as soon as the map style finishes loading or swapping
  useEffect(() => {
    if (!map) return;

    const handleStyleData = () => {
      if (map.isStyleLoaded() && cachedHeatmapGeoJSON) {
        if (!map.getSource(REPORTS_SOURCE_ID) || !map.getSource(HEATMAP_SOURCE_ID)) {
          setupOrUpdateLayers(
            map,
            applyFiltersToGeoJSON(cachedHeatmapGeoJSON, filters),
            sourceAddedRef,
            onSelectReportRef,
            viewMode
          );
        }
      }
    };

    map.on("styledata", handleStyleData);
    return () => map.off("styledata", handleStyleData);
  }, [map, filters, viewMode]);

  // 0ms instant client-side update & auto-fit whenever filters change!
  useEffect(() => {
    if (!map || !map.isStyleLoaded()) return;

    const filteredData = applyFiltersToGeoJSON(cachedHeatmapGeoJSON, filters);

    const clusterSrc = map.getSource(REPORTS_SOURCE_ID);
    const heatmapSrc = map.getSource(HEATMAP_SOURCE_ID);

    if (clusterSrc && heatmapSrc) {
      clusterSrc.setData(filteredData);
      heatmapSrc.setData(filteredData);
    } else {
      setupOrUpdateLayers(
        map,
        filteredData,
        sourceAddedRef,
        onSelectReportRef,
        viewMode
      );
    }

    // Check if filters changed to a narrower view -> auto-fit bounds to make difference executive & obvious
    const hasActiveFilters = Boolean(
      filters?.category || filters?.hours_back || filters?.affected_group
    );
    const hadActiveFilters = Boolean(
      prevFiltersRef.current?.category ||
      prevFiltersRef.current?.hours_back ||
      prevFiltersRef.current?.affected_group
    );
    prevFiltersRef.current = filters;

    if (hasActiveFilters && filteredData.features.length > 0 && filteredData.features.length < cachedHeatmapGeoJSON.features.length) {
      try {
        const bounds = new maplibregl.LngLatBounds();
        filteredData.features.forEach((f) => {
          bounds.extend(f.geometry.coordinates);
        });
        map.fitBounds(bounds, {
          padding: { top: 90, bottom: 90, left: 60, right: 60 },
          maxZoom: 13.5,
          duration: 800,
        });
      } catch (err) {
        // bounds calculation guard
      }
    } else if (!hasActiveFilters && hadActiveFilters) {
      // Returned to all-time default view
      map.flyTo({
        center: [80.22, 13.04],
        zoom: 11,
        duration: 700,
      });
    }
  }, [map, filters, viewMode]);

  useEffect(() => {
    if (!map) return;

    // Immediately render cached seed data without waiting for network!
    if (cachedHeatmapGeoJSON && map.isStyleLoaded()) {
      const displayData = applyFiltersToGeoJSON(cachedHeatmapGeoJSON, filters);
      if (!map.getSource(REPORTS_SOURCE_ID) || !map.getSource(HEATMAP_SOURCE_ID)) {
        setupOrUpdateLayers(map, displayData, sourceAddedRef, onSelectReportRef, viewMode);
      } else {
        map.getSource(REPORTS_SOURCE_ID).setData(displayData);
        map.getSource(HEATMAP_SOURCE_ID).setData(displayData);
      }
    }

    let isSubscribed = true;

    async function fetchAndRender(retryCount = 0) {
      // Build query string for active filters
      const params = new URLSearchParams();
      if (filters?.category) params.append("category", filters.category);
      if (filters?.hours_back) params.append("hours_back", String(filters.hours_back));
      if (filters?.affected_group) params.append("affected_group", filters.affected_group);
      const queryString = params.toString() ? `?${params.toString()}` : "";

      const endpointsToTry = [];

      // 1. First try relative /reports/heatmap (handled by Vite dev proxy or Vercel proxy)
      if (typeof window !== "undefined" && !apiBaseUrl) {
        endpointsToTry.push(`/reports/heatmap${queryString}`);
      }

      // 2. Absolute production backend URL (Render)
      const resolvedBaseUrl = (
        apiBaseUrl ||
        import.meta.env.VITE_API_BASE_URL ||
        import.meta.env.VITE_API_URL ||
        "https://adiona.onrender.com"
      ).replace(/\/+$/, "");
      endpointsToTry.push(`${resolvedBaseUrl}/reports/heatmap${queryString}`);

      let data = null;

      for (const url of endpointsToTry) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 20000);
          const res = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (res.ok) {
            data = await res.json();
            break;
          }
        } catch (err) {
          // Keep trying next endpoint
        }
      }

      if (!isSubscribed) return;

      if (!data || !Array.isArray(data)) {
        if (retryCount < 3) {
          setTimeout(() => {
            if (isSubscribed) fetchAndRender(retryCount + 1);
          }, 6000);
        }
        return;
      }

      const geojson = toGeoJSON(data);
      if (!filters?.category && !filters?.hours_back && !filters?.affected_group) {
        cachedHeatmapGeoJSON = geojson;
      }

      const displayData = applyFiltersToGeoJSON(geojson, filters);

      const applyLayers = () => {
        if (!isSubscribed) return;
        if (map.isStyleLoaded()) {
          setupOrUpdateLayers(map, displayData, sourceAddedRef, onSelectReportRef, viewMode);
        } else {
          map.once("styledata", applyLayers);
        }
      };

      if (!map.isStyleLoaded()) {
        map.once("styledata", applyLayers);
      } else {
        applyLayers();
      }
    }

    fetchAndRender();

    return () => {
      isSubscribed = false;
    };
  }, [map, apiBaseUrl, refreshTrigger, refreshKey, filters, viewMode]);

  return null; // manages map layers only
}

export { ReportMarkersLayer };

function setupOrUpdateLayers(map, geojson, sourceAddedRef, onSelectReportRef, viewMode = "both") {
  const clusterSourceId = REPORTS_SOURCE_ID;
  const heatmapSourceId = HEATMAP_SOURCE_ID;

  // 1. Update or create the Safety Density Heatmap Source (unclustered for pure smooth density)
  if (map.getSource(heatmapSourceId)) {
    map.getSource(heatmapSourceId).setData(geojson);
  } else {
    map.addSource(heatmapSourceId, {
      type: "geojson",
      data: geojson,
      cluster: false,
    });
  }

  // 2. Update or create the Clustered Reports Source
  if (map.getSource(clusterSourceId)) {
    map.getSource(clusterSourceId).setData(geojson);
    sourceAddedRef.current = true;
  } else {
    map.addSource(clusterSourceId, {
      type: "geojson",
      data: geojson,
      cluster: true,
      clusterMaxZoom: 13,
      clusterRadius: 35,
    });
    sourceAddedRef.current = true;
  }

  // 3. Safety Density Heatmap Layer (underneath clusters)
  if (!map.getLayer(HEATMAP_LAYER_ID)) {
    map.addLayer({
      id: HEATMAP_LAYER_ID,
      type: "heatmap",
      source: heatmapSourceId,
      maxzoom: 16,
      paint: {
        // Increase the heatmap weight based on report weight (1.0 to 5.0)
        "heatmap-weight": [
          "interpolate",
          ["linear"],
          ["get", "weight"],
          0, 0.2,
          1, 0.5,
          2, 0.8,
          4, 1.2,
        ],
        // Increase heatmap intensity based on zoom level
        "heatmap-intensity": [
          "interpolate",
          ["linear"],
          ["zoom"],
          9, 0.8,
          11, 1.4,
          13, 2.2,
          15, 3.0,
        ],
        // Color ramp matches the exact gradient in .legend-gradient:
        // linear-gradient(to right, rgb(65, 182, 196), rgb(254, 217, 118), rgb(254, 153, 41), rgb(227, 26, 28), rgb(128, 0, 38))
        "heatmap-color": [
          "interpolate",
          ["linear"],
          ["heatmap-density"],
          0, "rgba(65, 182, 196, 0)",
          0.15, "rgb(65, 182, 196)", // Low Concern cyan
          0.35, "rgb(254, 217, 118)", // yellow
          0.55, "rgb(254, 153, 41)",  // Moderate orange
          0.8, "rgb(227, 26, 28)",   // High Severity red
          1.0, "rgb(128, 0, 38)",    // Critical dark red
        ],
        // Heatmap blur radius expands as you zoom in
        "heatmap-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          9, 16,
          11, 24,
          13, 36,
          15, 48,
        ],
        "heatmap-opacity": viewMode === "clusters" ? 0 : 0.82,
      },
    });
  }

  // 4. Cluster circles, sized/colored by point count
  if (!map.getLayer(CLUSTERS_LAYER_ID)) {
    map.addLayer({
      id: CLUSTERS_LAYER_ID,
      type: "circle",
      source: clusterSourceId,
      filter: ["has", "point_count"],
      paint: {
        "circle-color": [
          "step",
          ["get", "point_count"],
          "#f1c40f", // < 10 points: yellow
          10,
          "#e67e22", // 10-30 points: orange
          30,
          "#e74c3c", // 30+ points: red
        ],
        "circle-radius": ["step", ["get", "point_count"], 15, 10, 20, 30, 25],
        "circle-opacity": viewMode === "heatmap" ? 0 : 0.88,
        "circle-stroke-width": 1.5,
        "circle-stroke-color": "#ffffff",
      },
    });
  }

  // 5. Cluster count labels
  if (!map.getLayer(CLUSTER_COUNT_LAYER_ID)) {
    map.addLayer({
      id: CLUSTER_COUNT_LAYER_ID,
      type: "symbol",
      source: clusterSourceId,
      filter: ["has", "point_count"],
      layout: {
        "text-field": ["get", "point_count_abbreviated"],
        "text-size": 13,
      },
      paint: {
        "text-color": "#ffffff",
        "text-opacity": viewMode === "heatmap" ? 0 : 1,
      },
    });
  }

  // 6. Individual unclustered points, colored by status
  if (!map.getLayer(UNCLUSTERED_LAYER_ID)) {
    map.addLayer({
      id: UNCLUSTERED_LAYER_ID,
      type: "circle",
      source: clusterSourceId,
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": [
          "match",
          ["get", "status"],
          "unsafe",
          "#e74c3c",
          "safe",
          "#2ecc71",
          "#95a5a6", // fallback color
        ],
        "circle-radius": 7,
        "circle-stroke-width": 1.5,
        "circle-stroke-color": "#ffffff",
        "circle-opacity": viewMode === "heatmap" ? 0.35 : 1,
      },
    });
  }

  // Click a cluster -> zoom directly into dots in one smooth step
  map.off("click", CLUSTERS_LAYER_ID);
  map.on("click", CLUSTERS_LAYER_ID, (e) => {
    const features = map.queryRenderedFeatures(e.point, { layers: [CLUSTERS_LAYER_ID] });
    if (!features || !features.length) return;
    const clusterId = features[0].properties.cluster_id;
    const src = map.getSource(clusterSourceId);
    if (!src || !src.getClusterExpansionZoom) return;
    src.getClusterExpansionZoom(clusterId, (err, zoom) => {
      if (err) return;
      const currentZoom = map.getZoom();
      const targetZoom = Math.min(18, Math.max(zoom || (currentZoom + 2.5), 14, currentZoom + 2.5));
      map.easeTo({ center: features[0].geometry.coordinates, zoom: targetZoom, duration: 350 });
    });
  });

  // Click an individual point -> trigger interactive confirm / report prompt
  map.off("click", UNCLUSTERED_LAYER_ID);
  map.on("click", UNCLUSTERED_LAYER_ID, (e) => {
    if (!e.features || !e.features.length) return;
    const props = e.features[0].properties;
    const coordinates = e.features[0].geometry.coordinates.slice();

    if (onSelectReportRef?.current) {
      onSelectReportRef.current({
        id: props.id,
        category: props.category,
        status: props.status,
        confirmations: props.confirmations,
        note: props.note,
        created_at: props.created_at,
        lat: coordinates[1],
        lng: coordinates[0],
      });
    }
  });

  map.on("mouseenter", CLUSTERS_LAYER_ID, () => {
    if (map.getCanvas()) map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", CLUSTERS_LAYER_ID, () => {
    if (map.getCanvas()) map.getCanvas().style.cursor = "";
  });
  map.on("mouseenter", UNCLUSTERED_LAYER_ID, () => {
    if (map.getCanvas()) map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", UNCLUSTERED_LAYER_ID, () => {
    if (map.getCanvas()) map.getCanvas().style.cursor = "";
  });
}
