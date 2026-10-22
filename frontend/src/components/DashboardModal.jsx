import React, { useState, useEffect } from 'react';
import {
  Building2,
  Download,
  ShieldCheck,
  Lock,
  AlertCircle,
  BarChart3,
  Layers,
  Clock,
  ExternalLink,
  X,
  FileSpreadsheet,
  FileCode,
} from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { fetchDashboardSummary, fetchDashboardTopZones, exportOpenDataCells } from '../utils/api';

export function DashboardModal({ isOpen, onClose }) {
  const { t, language } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'opendata'
  const [adminKey, setAdminKey] = useState(() => {
    try {
      return localStorage.getItem('adiona_admin_key') || '';
    } catch {
      return '';
    }
  });
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [topZones, setTopZones] = useState([]);
  const [daysBack, setDaysBack] = useState(90);

  useEffect(() => {
    if (isOpen && adminKey) {
      loadDashboardData(adminKey, daysBack);
    }
  }, [isOpen, daysBack]);

  const loadDashboardData = async (keyToUse, days) => {
    if (!keyToUse) return;
    setLoading(true);
    setError(null);
    try {
      const [sumData, zonesData] = await Promise.all([
        fetchDashboardSummary(keyToUse, days),
        fetchDashboardTopZones(keyToUse, null, 10, days),
      ]);
      setSummary(sumData);
      setTopZones(zonesData);
      setIsAuthorized(true);
      try {
        localStorage.setItem('adiona_admin_key', keyToUse);
      } catch {}
    } catch (err) {
      setError(err.message || 'Unauthorized or connection failure.');
      setIsAuthorized(false);
    } finally {
      setLoading(false);
    }
  };

  const handleKeySubmit = (e) => {
    e.preventDefault();
    if (!adminKey.trim()) return;
    loadDashboardData(adminKey.trim(), daysBack);
  };

  const handleExportCsv = () => {
    exportOpenDataCells('csv');
  };

  const handleExportJson = async () => {
    try {
      const data = await exportOpenDataCells('json');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chennai_safety_cells_cc_by_4_0_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export data: ' + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dashboard-title"
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 id="dashboard-title" className="text-base font-bold text-slate-100">
                {language === 'ta' ? 'சென்னை பொது நிர்வாக டாஷ்போர்டு & திறந்த தரவு' : 'Institutional Safety Dashboard & Open Data'}
              </h2>
              <p className="text-xs text-slate-400">
                {language === 'ta' ? 'கட்டம் 2 விவரக்குறிப்பு §3.5 & §3.6' : 'Aggregated, Privacy-Preserving Civic Analytics'}
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

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'dashboard'
                ? 'border-indigo-500 text-indigo-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>{language === 'ta' ? 'நிர்வாக டாஷ்போர்டு' : 'Institutional Analytics'}</span>
          </button>
          <button
            onClick={() => setActiveTab('opendata')}
            className={`py-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'opendata'
                ? 'border-indigo-500 text-indigo-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>{language === 'ta' ? 'திறந்த தரவு ஏற்றுமதி (CC BY 4.0)' : 'Open Data Export (CC BY 4.0)'}</span>
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'dashboard' ? (
            !isAuthorized ? (
              <div className="max-w-md mx-auto py-8 text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-slate-200">
                  {language === 'ta' ? 'அங்கீகரிக்கப்பட்ட அணுகல் தேவை' : 'Restricted Institutional Access'}
                </h3>
                <p className="text-xs text-slate-400">
                  {language === 'ta'
                    ? 'பொது அமைப்புகள், கல்லூரிகள் அல்லது குடியிருப்போர் சங்க நிர்வாகிகளுக்கான ரகசிய கடவுச்சொல் தேவை.'
                    : 'Enter institutional admin authentication key (X-Admin-Key) to inspect aggregated civic data.'}
                </p>
                <form onSubmit={handleKeySubmit} className="space-y-3">
                  <input
                    type="password"
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    placeholder="Enter Admin Secret..."
                    className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
                  />
                  {error && (
                    <div className="text-xs text-rose-400 flex items-center justify-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{error}</span>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs rounded-lg transition-colors shadow-sm"
                  >
                    {loading ? 'Authenticating...' : 'Access Dashboard'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Suppression Privacy Banner */}
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-indigo-300 text-xs">
                  <ShieldCheck className="w-5 h-5 flex-shrink-0 text-indigo-400 mt-0.5" />
                  <div>
                    <strong>{language === 'ta' ? 'தனியுரிமை உத்தரவாதம் (K ≥ 5):' : 'Privacy Protection (K ≥ 5 Suppression):'}</strong>{' '}
                    {language === 'ta'
                      ? 'தனிநபர்களை அடையாளம் காண முடியாதவாறு 5-க்கும் குறைவான பதிவுகள் உள்ள பகுதிகள் தானாக மறைக்கப்படுகின்றன. எந்தவொரு சாதனம் அல்லது இருப்பிடப் பதிவுகளும் பகிரப்படுவதில்லை.'
                      : 'Small-number suppression active: cells with fewer than 5 reports are masked to prevent identifying individuals. No device IDs, personal identifiers, or raw tracks are exposed.'}
                  </div>
                </div>

                {/* Key Metrics */}
                {summary && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Reports</div>
                      <div className="text-2xl font-bold text-slate-100 mt-1">{summary.total_reports}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Across Chennai</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Unique Devices</div>
                      <div className="text-2xl font-bold text-indigo-400 mt-1">{summary.unique_devices}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Distinct Citizens</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Verified Zones</div>
                      <div className="text-2xl font-bold text-amber-400 mt-1">{summary.active_cells_count}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">K ≥ 5 Reports</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Suppressed Cells</div>
                      <div className="text-2xl font-bold text-slate-400 mt-1">{summary.suppressed_cells_count}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Masked (&lt; 5 Reports)</div>
                    </div>
                  </div>
                )}

                {/* Top Flagged Zones Table */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{language === 'ta' ? 'அதிக புகார்கள் பதிவான பகுதிகள் (K ≥ 5)' : 'Top Priority Action Zones (K ≥ 5 Reports)'}</span>
                  </h4>
                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900 border-b border-slate-800 text-slate-400">
                        <tr>
                          <th className="p-3">Grid Coordinates</th>
                          <th className="p-3">Reports</th>
                          <th className="p-3">Unique Devices</th>
                          <th className="p-3">Dominant Concern</th>
                          <th className="p-3">Unsafe Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {topZones.map((z, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                            <td className="p-3 font-mono text-[11px] text-indigo-300">
                              {z.grid_lat.toFixed(4)}, {z.grid_lng.toFixed(4)}
                            </td>
                            <td className="p-3 font-semibold text-slate-100">{z.report_count}</td>
                            <td className="p-3">{z.unique_devices}</td>
                            <td className="p-3 capitalize text-amber-300">{z.dominant_category.replace(/_/g, ' ')}</td>
                            <td className="p-3 font-semibold text-rose-400">{z.score_unsafe}</td>
                          </tr>
                        ))}
                        {topZones.length === 0 && (
                          <tr>
                            <td colSpan="5" className="p-4 text-center text-slate-500">
                              No zones currently meet the K ≥ 5 threshold.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )
          ) : (
            /* Open Data Tab */
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                  <Download className="w-4 h-4" />
                  <span>Creative Commons Attribution 4.0 International (CC BY 4.0)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {language === 'ta'
                    ? 'சென்னையின் பொதுப் பாதுகாப்புத் தரவுகள் குடிமக்கள், தன்னார்வலர்கள், கல்லூரி ஆய்வாளர்கள் மற்றும் நகர்ப்புற திட்டமிடுபவர்களுக்கு இலவசமாகக் கிடைக்கிறது. தனிநபர் தகவல் பாதுகாப்புக்காக K ≥ 5 கட்டுப்பாட்டுடன் தரவுகள் தொகுக்கப்பட்டுள்ளன.'
                    : 'The aggregated Chennai safety dataset is freely accessible for researchers, civic technologists, journalists, and public administrators under the CC BY 4.0 license. Individual reports are protected with K ≥ 5 suppression.'}
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={handleExportCsv}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Download CSV Dataset</span>
                  </button>
                  <button
                    onClick={handleExportJson}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
                  >
                    <FileCode className="w-4 h-4" />
                    <span>Download JSON Dataset</span>
                  </button>
                </div>
              </div>

              {/* Data Schema Specs */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                  Export Data Schema
                </h4>
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40 p-4 text-xs font-mono text-slate-300 space-y-1.5">
                  <div><strong>grid_lat, grid_lng</strong>: ~100m snapped centroid coordinates</div>
                  <div><strong>report_count</strong>: Total aggregated reports (min 5)</div>
                  <div><strong>unique_devices</strong>: Distinct confirming device count</div>
                  <div><strong>score_unsafe, score_safe</strong>: Decayed safety intensity scores</div>
                  <div><strong>category_breakdown</strong>: Key-value map of problem types</div>
                  <div><strong>last_updated_date</strong>: Date formatted as YYYY-MM-DD</div>
                  <div><strong>license</strong>: "CC BY 4.0"</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
