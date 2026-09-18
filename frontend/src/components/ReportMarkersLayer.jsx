import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";

import seedReports from "../data/seedReports.json";

export const REPORTS_SOURCE_ID = "reports";
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
        weight: point.weight,
        status: point.status,
        category: point.category,
        confirmations: point.confirmations,
        note: point.note,
        created_at: point.created_at,
      },
    })),
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
}) {
  const sourceAddedRef = useRef(false);
  const onSelectReportRef = useRef(onSelectReport);

  useEffect(() => {
    onSelectReportRef.current = onSelectReport;
  }, [onSelectReport]);

  // Immediately re-attach clusters as soon as the map style finishes loading or swapping
  useEffect(() => {
    if (!map) return;

    const handleStyleData = () => {
      if (map.isStyleLoaded() && cachedHeatmapGeoJSON) {
        if (!map.getSource(REPORTS_SOURCE_ID)) {
          setupOrUpdateLayers(map, cachedHeatmapGeoJSON, sourceAddedRef, onSelectReportRef);
        }
      }
    };

    map.on("styledata", handleStyleData);
    return () => map.off("styledata", handleStyleData);
  }, [map]);

  useEffect(() => {
    if (!map) return;

    // Immediately render cached seed data without waiting for network!
    if (cachedHeatmapGeoJSON && map.isStyleLoaded()) {
      if (!map.getSource(REPORTS_SOURCE_ID)) {
        setupOrUpdateLayers(map, cachedHeatmapGeoJSON, sourceAddedRef, onSelectReportRef);
      } else {
        map.getSource(REPORTS_SOURCE_ID).setData(cachedHeatmapGeoJSON);
      }
    }

    let isSubscribed = true;

    async function fetchAndRender(retryCount = 0) {
      const endpointsToTry = [];

      // 1. First try relative /reports/heatmap (handled by Vite dev proxy or Vercel proxy)
      if (typeof window !== "undefined" && !apiBaseUrl) {
        endpointsToTry.push("/reports/heatmap");
      }

      // 2. Absolute production backend URL (Render)
      const resolvedBaseUrl = (
        apiBaseUrl ||
        import.meta.env.VITE_API_BASE_URL ||
        import.meta.env.VITE_API_URL ||
        "https://adiona.onrender.com"
      ).replace(/\/+$/, "");
      endpointsToTry.push(`${resolvedBaseUrl}/reports/heatmap`);

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
        // If server is cold-starting, retry up to 3 times with a 6-second interval
        if (retryCount < 3) {
          setTimeout(() => {
            if (isSubscribed) fetchAndRender(retryCount + 1);
          }, 6000);
        }
        return;
      }

      const geojson = toGeoJSON(data);
      cachedHeatmapGeoJSON = geojson;

      const applyLayers = () => {
        if (!isSubscribed) return;
        if (map.isStyleLoaded()) {
          setupOrUpdateLayers(map, geojson, sourceAddedRef, onSelectReportRef);
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
  }, [map, apiBaseUrl, refreshTrigger, refreshKey]);

  return null; // this component only manages map layers, renders nothing itself
}

export { ReportMarkersLayer };

function setupOrUpdateLayers(map, geojson, sourceAddedRef, onSelectReportRef) {
  const sourceId = "reports";

  if (sourceAddedRef.current && map.getSource(sourceId)) {
    // Source already exists — just update its data (e.g. after a new report submission).
    map.getSource(sourceId).setData(geojson);
    return;
  }
  sourceAddedRef.current = false; // source was wiped (e.g. style change) — rebuild below

  map.addSource(sourceId, {
    type: "geojson",
    data: geojson,
    cluster: true,
    clusterMaxZoom: 13,
    clusterRadius: 35,
  });

  // Cluster circles, sized/colored by point count
  map.addLayer({
    id: "clusters",
    type: "circle",
    source: sourceId,
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
      "circle-opacity": 0.85,
    },
  });

  // Cluster count labels
  map.addLayer({
    id: "cluster-count",
    type: "symbol",
    source: sourceId,
    filter: ["has", "point_count"],
    layout: {
      "text-field": ["get", "point_count_abbreviated"],
      "text-size": 13,
    },
    paint: {
      "text-color": "#ffffff",
    },
  });

  // Individual unclustered points, colored by status
  map.addLayer({
    id: "unclustered-point",
    type: "circle",
    source: sourceId,
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
      "circle-radius": 8,
      "circle-stroke-width": 1,
      "circle-stroke-color": "#ffffff",
    },
  });

  // Click a cluster -> zoom directly into dots in one smooth step
  map.on("click", "clusters", (e) => {
    const features = map.queryRenderedFeatures(e.point, { layers: ["clusters"] });
    if (!features || !features.length) return;
    const clusterId = features[0].properties.cluster_id;
    const src = map.getSource(sourceId);
    if (!src || !src.getClusterExpansionZoom) return;
    src.getClusterExpansionZoom(clusterId, (err, zoom) => {
      if (err) return;
      const currentZoom = map.getZoom();
      // Jump directly past clusterMaxZoom (>= 14) or at least +2.5 zoom levels
      const targetZoom = Math.min(18, Math.max(zoom || (currentZoom + 2.5), 14, currentZoom + 2.5));
      map.easeTo({ center: features[0].geometry.coordinates, zoom: targetZoom, duration: 350 });
    });
  });

  // Click an individual point -> trigger interactive confirm / report prompt
  map.on("click", "unclustered-point", (e) => {
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

  map.on("mouseenter", "clusters", () => {
    if (map.getCanvas()) map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", "clusters", () => {
    if (map.getCanvas()) map.getCanvas().style.cursor = "";
  });
  map.on("mouseenter", "unclustered-point", () => {
    if (map.getCanvas()) map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", "unclustered-point", () => {
    if (map.getCanvas()) map.getCanvas().style.cursor = "";
  });

  sourceAddedRef.current = true;
}
