import React, { useState } from 'react';
import { Route, Navigation, ShieldCheck, AlertTriangle, ArrowRight, X, Loader2, Sparkles } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { scoreRouteGeometry } from '../utils/api';
import { CHENNAI_LOCALITIES } from '../utils/chennaiLocalities';

export function RouteSafetyModal({ isOpen, onClose, onShowRouteOnMap }) {
  const { t, language } = useTranslation();

  const [originIndex, setOriginIndex] = useState(0); // T Nagar
  const [destIndex, setDestIndex] = useState(1);   // Velachery
  const [loading, setLoading] = useState(false);
  const [routeResult, setRouteResult] = useState(null);
  const [error, setError] = useState(null);

  const popularPlaces = [
    { name: 'T. Nagar (Panagal Park)', lat: 13.0418, lng: 80.2335 },
    { name: 'Velachery (Vijayanagar)', lat: 12.9782, lng: 80.2238 },
    { name: 'Chennai Central Station', lat: 13.0818, lng: 80.2755 },
    { name: 'Koyambedu (CMBT)', lat: 13.0694, lng: 80.2052 },
    { name: 'Adyar (Shastri Nagar)', lat: 13.0064, lng: 80.2568 },
    { name: 'Guindy (Kathipara)', lat: 13.0076, lng: 80.2133 },
    { name: 'Anna Nagar (Roundtana)', lat: 13.0850, lng: 80.2155 },
    { name: 'Mylapore (Luz Corner)', lat: 13.0335, lng: 80.2678 },
  ];

  const handleEvaluateRoute = async () => {
    setLoading(true);
    setError(null);
    try {
      const p1 = popularPlaces[originIndex];
      const p2 = popularPlaces[destIndex];

      // Interpolate 12 corridor points between Origin and Destination
      const steps = 12;
      const coords = [];
      for (let i = 0; i <= steps; i++) {
        const factor = i / steps;
        const lat = p1.lat + (p2.lat - p1.lat) * factor;
        const lng = p1.lng + (p2.lng - p1.lng) * factor;
        coords.push([lng, lat]);
      }

      const summary = await scoreRouteGeometry(coords);
      setRouteResult({
        summary,
        origin: p1,
        dest: p2,
        geometry: coords,
      });

      if (onShowRouteOnMap) {
        onShowRouteOnMap(coords);
      }
    } catch (err) {
      setError(err.message || 'Could not evaluate route.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="route-modal-title"
    >
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Route className="w-5 h-5" />
            </div>
            <div>
              <h2 id="route-modal-title" className="text-base font-bold text-slate-100">
                {language === 'ta' ? 'வழித்தடப் பாதுகாப்பு சோதனை (Phase 2)' : 'Lower-Reported-Risk Route Check'}
              </h2>
              <p className="text-xs text-slate-400">
                {language === 'ta'
                  ? 'சமூகப் பதிவுகளின் அடிப்படையில் பாதுகாப்பான பாதையைத் தேர்ந்தெடுக்கவும்'
                  : 'Evaluate transit corridors against community lighting & incident data'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            aria-label={t('close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* Important Terminology Disclaimer (Spec §3.7) */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
            <div>
              <strong>{language === 'ta' ? 'முக்கிய அறிவிப்பு:' : 'Advisory Notice:'}</strong>{' '}
              {language === 'ta'
                ? 'இது "குறைவான ஆபத்துகள் பதிவாகியுள்ள வழித்தடம்" (Lower-reported-risk route) மட்டுமே. எந்தப் பாதையும் முழுமையான பாதுகாப்புக்கு உத்தரவாதம் அளிக்க முடியாது.'
                : 'Results represent a lower-reported-risk corridor based on citizen reports. No routing engine can guarantee absolute safety.'}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {language === 'ta' ? 'புறப்படும் இடம் (Origin)' : 'Origin Point'}
              </label>
              <select
                value={originIndex}
                onChange={(e) => setOriginIndex(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {popularPlaces.map((p, idx) => (
                  <option key={idx} value={idx} disabled={idx === destIndex}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {language === 'ta' ? 'சென்றடையும் இடம் (Destination)' : 'Destination Point'}
              </label>
              <select
                value={destIndex}
                onChange={(e) => setDestIndex(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {popularPlaces.map((p, idx) => (
                  <option key={idx} value={idx} disabled={idx === originIndex}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleEvaluateRoute}
              disabled={loading || originIndex === destIndex}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Evaluating Corridor...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4" />
                  <span>{language === 'ta' ? 'வழித்தடப் பாதுகாப்பை மதிப்பிடுக' : 'Evaluate Route Corridor'}</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="text-xs text-rose-400 p-3 bg-rose-950/30 border border-rose-500/20 rounded-xl">
              {error}
            </div>
          )}

          {routeResult && (
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>Lower-Reported-Risk Evaluation Complete</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                {routeResult.summary.plain_language_summary}
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Cells Checked</div>
                  <div className="text-sm font-bold text-slate-100">{routeResult.summary.cells_traversed}</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Dark Spots</div>
                  <div className="text-sm font-bold text-amber-400">{routeResult.summary.lighting_flags_after_dark}</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Reported Issues</div>
                  <div className="text-sm font-bold text-rose-400">{routeResult.summary.unsafe_cells_count}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
