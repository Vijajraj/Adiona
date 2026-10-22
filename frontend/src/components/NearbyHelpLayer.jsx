import { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import { fetchNearbyHelpPoints } from '../utils/api';
import { useTranslation } from '../i18n/LanguageContext';

export const HELP_POINTS_SOURCE_ID = 'help-points-source';
export const HELP_POINTS_LAYER_ID = 'help-points-circle';
export const HELP_POINTS_LABEL_LAYER_ID = 'help-points-label';

export function NearbyHelpLayer({ map, visible }) {
  const { t } = useTranslation();
  const popupRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    let isMounted = true;

    async function loadAndAddLayer() {
      try {
        const geojson = await fetchNearbyHelpPoints();
        if (!isMounted || !map) return;

        // Add source if not present
        if (!map.getSource(HELP_POINTS_SOURCE_ID)) {
          map.addSource(HELP_POINTS_SOURCE_ID, {
            type: 'geojson',
            data: geojson,
          });
        }

        // Add circle layer
        if (!map.getLayer(HELP_POINTS_LAYER_ID)) {
          map.addLayer({
            id: HELP_POINTS_LAYER_ID,
            type: 'circle',
            source: HELP_POINTS_SOURCE_ID,
            layout: {
              visibility: visible ? 'visible' : 'none',
            },
            paint: {
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                10, 6,
                14, 9,
                18, 14,
              ],
              'circle-color': [
                'match',
                ['get', 'type'],
                'police', '#2563eb',     // Blue
                'hospital', '#10b981',   // Emerald
                'pharmacy', '#9333ea',   // Purple
                'transit', '#0891b2',    // Cyan
                '#64748b',
              ],
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff',
              'circle-opacity': 0.95,
            },
          });
        }

        // Add text labels on higher zoom
        if (!map.getLayer(HELP_POINTS_LABEL_LAYER_ID)) {
          map.addLayer({
            id: HELP_POINTS_LABEL_LAYER_ID,
            type: 'symbol',
            source: HELP_POINTS_SOURCE_ID,
            minzoom: 13,
            layout: {
              visibility: visible ? 'visible' : 'none',
              'text-field': ['get', 'name'],
              'text-size': 11,
              'text-offset': [0, 1.2],
              'text-anchor': 'top',
              'text-optional': true,
            },
            paint: {
              'text-color': '#f8fafc',
              'text-halo-color': '#0f172a',
              'text-halo-width': 1.5,
            },
          });
        }

        // Click popup handler
        const handlePointClick = (e) => {
          if (!e.features || e.features.length === 0) return;
          const feature = e.features[0];
          const props = feature.properties || {};
          const coords = feature.geometry.coordinates;

          const typeName = t(`help_${props.type}`) || props.type;

          const popupHtml = `
            <div style="font-family: inherit; font-size: 13px; line-height: 1.4; color: #0f172a; padding: 4px;">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${
                  props.type === 'police' ? '#2563eb' : props.type === 'hospital' ? '#10b981' : props.type === 'pharmacy' ? '#9333ea' : '#0891b2'
                };"></span>
                <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #475569;">${typeName}</span>
              </div>
              <strong style="display: block; font-size: 14px; margin-bottom: 6px; color: #0f172a;">${props.name}</strong>
              <div style="margin-bottom: 4px; font-size: 12px; color: #334155;">
                📍 ${props.address || ''}
              </div>
              <div style="margin-bottom: 6px; font-size: 12px; color: #334155;">
                🕒 <strong>${props.open_hours || '24/7'}</strong>
              </div>
              ${
                props.emergency_phone
                  ? `<div style="margin-top: 8px;">
                      <a href="tel:${props.emergency_phone.split('/')[0].trim()}" style="display: inline-flex; align-items: center; gap: 4px; background: #0f172a; color: #ffffff; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; text-decoration: none;">
                        📞 ${props.emergency_phone}
                      </a>
                    </div>`
                  : ''
              }
            </div>
          `;

          if (popupRef.current) {
            popupRef.current.remove();
          }

          popupRef.current = new maplibregl.Popup({ closeButton: true, offset: 12 })
            .setLngLat(coords)
            .setHTML(popupHtml)
            .addTo(map);
        };

        map.on('click', HELP_POINTS_LAYER_ID, handlePointClick);

        // Hover cursor
        map.on('mouseenter', HELP_POINTS_LAYER_ID, () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', HELP_POINTS_LAYER_ID, () => {
          map.getCanvas().style.cursor = '';
        });
      } catch (err) {
        console.warn('Could not load nearby help points layer:', err);
      }
    }

    if (map.isStyleLoaded()) {
      loadAndAddLayer();
    } else {
      map.once('styledata', loadAndAddLayer);
    }

    return () => {
      isMounted = false;
      if (popupRef.current) {
        popupRef.current.remove();
      }
    };
  }, [map, t]);

  // Update visibility dynamically
  useEffect(() => {
    if (!map) return;
    const visibility = visible ? 'visible' : 'none';
    if (map.getLayer(HELP_POINTS_LAYER_ID)) {
      map.setLayoutProperty(HELP_POINTS_LAYER_ID, 'visibility', visibility);
    }
    if (map.getLayer(HELP_POINTS_LABEL_LAYER_ID)) {
      map.setLayoutProperty(HELP_POINTS_LABEL_LAYER_ID, 'visibility', visibility);
    }
  }, [map, visible]);

  return null;
}
