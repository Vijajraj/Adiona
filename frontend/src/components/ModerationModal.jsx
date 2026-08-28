import { useState, useEffect, useRef } from 'react';
import {
  X,
  Shield,
  ShieldCheck,
  Trash2,
  Lock,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Info,
  Calendar,
} from 'lucide-react';
import {
  fetchFlaggedReports,
  approveFlaggedReport,
  deleteFlaggedReport,
  fetchModerationStats,
} from '../utils/api';
import { ALL_CATEGORIES } from '../utils/categories';

export function ModerationModal({ isOpen, onClose, onRefreshMap }) {
  const [adminKey, setAdminKey] = useState(() => localStorage.getItem('adiona_admin_key') || '');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [flaggedReports, setFlaggedReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [authError, setAuthError] = useState('');

  const abortControllerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Try to load auto-login if key exists on mount / open
  useEffect(() => {
    if (isOpen && adminKey) {
      handleAuthCheck(adminKey);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAuthCheck = async (keyToCheck) => {
    if (!keyToCheck.trim()) {
      setAuthError('Please enter a key.');
      return;
    }
    setLoading(true);
    setAuthError('');
    try {
      // Fetch stats to verify the key
      const verifiedStats = await fetchModerationStats(keyToCheck.trim());
      setStats(verifiedStats);
      setIsAuthorized(true);
      localStorage.setItem('adiona_admin_key', keyToCheck.trim());
      // Fetch flagged reports immediately
      await loadQueue(keyToCheck.trim());
    } catch (err) {
      setAuthError(err.message || 'Verification failed. Invalid admin key.');
      setIsAuthorized(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adiona_admin_key');
    setAdminKey('');
    setIsAuthorized(false);
    setFlaggedReports([]);
    setStats(null);
    setAuthError('');
  };

  const loadQueue = async (key = adminKey) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await fetchFlaggedReports(key);
      setFlaggedReports(data);
      const verifiedStats = await fetchModerationStats(key);
      setStats(verifiedStats);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load flagged queue.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reportId) => {
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await approveFlaggedReport(reportId, adminKey);
      setSuccessMessage('Report approved and flag cleared successfully.');
      setFlaggedReports((prev) => prev.filter((r) => r.id !== reportId));
      // Refresh stats and map
      const verifiedStats = await fetchModerationStats(adminKey);
      setStats(verifiedStats);
      if (onRefreshMap) onRefreshMap();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to approve report.');
    }
  };

  const handleDelete = async (reportId) => {
    if (!window.confirm('Are you sure you want to permanently delete this report? This action cannot be undone.')) {
      return;
    }
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await deleteFlaggedReport(reportId, adminKey);
      setSuccessMessage('Report permanently deleted.');
      setFlaggedReports((prev) => prev.filter((r) => r.id !== reportId));
      // Refresh stats and map
      const verifiedStats = await fetchModerationStats(adminKey);
      setStats(verifiedStats);
      if (onRefreshMap) onRefreshMap();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to delete report.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content moderation-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mod-modal-title"
      >
        <div className="modal-header">
          <div className="modal-title-row">
            <Shield className="text-indigo-600 animate-pulse" size={24} />
            <h2 id="mod-modal-title">Moderation Queue</h2>
          </div>
          <button className="close-button" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {!isAuthorized ? (
          /* Login View */
          <div className="modal-body space-y-4 text-center">
            <div className="flex justify-center py-4">
              <Lock size={48} className="text-slate-400" />
            </div>
            <p className="intro-text">
              Enter your Chennai Safety Map administrator key to inspect flagged reports and manage content.
            </p>
            <div className="form-group max-w-sm mx-auto">
              <input
                type="password"
                className="form-textarea"
                style={{ height: '42px', padding: '0 12px' }}
                placeholder="Enter Admin Secret Key..."
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAuthCheck(adminKey);
                }}
              />
              {authError && (
                <div className="error-banner flex items-center gap-2 mt-2" role="alert">
                  <AlertTriangle size={16} />
                  <span>{authError}</span>
                </div>
              )}
            </div>
            <div className="modal-footer justify-center">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleAuthCheck(adminKey)}
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Authenticate'}
              </button>
            </div>
          </div>
        ) : (
          /* Queue View */
          <>
            <div className="modal-body space-y-4">
              {/* Stats Banner */}
              {stats && (
                <div className="moderation-stats-banner">
                  <div className="stat-card">
                    <span className="stat-num">{stats.flagged_reports}</span>
                    <span className="stat-label">Flagged Queue</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-num">{stats.user_reports}</span>
                    <span className="stat-label">User Submissions</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-num">{stats.seed_reports}</span>
                    <span className="stat-label">Seed Points</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-num">{stats.total_reports}</span>
                    <span className="stat-label">Total DB Items</span>
                  </div>
                </div>
              )}

              {/* Status Messages */}
              {errorMessage && (
                <div className="error-banner flex items-center gap-2" role="alert">
                  <AlertTriangle size={18} className="flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
              {successMessage && (
                <div className="success-banner flex items-center gap-2" role="status">
                  <ShieldCheck size={18} className="flex-shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Queue List */}
              <div className="flagged-list-container">
                {loading && flaggedReports.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin text-indigo-600" size={36} />
                  </div>
                ) : flaggedReports.length === 0 ? (
                  <div className="empty-queue-message py-12 text-center text-slate-400 space-y-2">
                    <ShieldCheck size={48} className="text-emerald-500 mx-auto" />
                    <h4>Queue is Empty</h4>
                    <p className="text-sm">All flagged safety reports have been moderated.</p>
                  </div>
                ) : (
                  <div className="flagged-cards-stack">
                    {flaggedReports.map((report) => {
                      const categoryMeta = ALL_CATEGORIES.find((c) => c.id === report.category);
                      const catLabel = categoryMeta ? categoryMeta.label : report.category;
                      return (
                        <div key={report.id} className="flagged-item-card">
                          <div className="flagged-card-header">
                            <div className="badge-flagged">Flagged Content</div>
                            <span className="report-time-stamp">
                              <Calendar size={12} />
                              {new Date(report.created_at).toLocaleString()}
                            </span>
                          </div>

                          <div className="flagged-card-body">
                            {report.note ? (
                              <blockquote className="flagged-note">
                                "{report.note}"
                              </blockquote>
                            ) : (
                              <span className="text-slate-500 italic text-sm">No description provided</span>
                            )}

                            <div className="flagged-metadata-row">
                              <span className="meta-tag">
                                <strong>Category:</strong> {catLabel}
                              </span>
                              <span className="meta-tag">
                                <strong>Status:</strong> {report.status}
                              </span>
                              <span className="meta-tag">
                                <strong>Grid Cell:</strong> {report.grid_lat.toFixed(4)}, {report.grid_lng.toFixed(4)}
                              </span>
                              <span className="meta-tag">
                                <strong>Device ID:</strong> <code className="text-xs">{report.device_id.substring(0, 8)}...</code>
                              </span>
                            </div>
                          </div>

                          <div className="flagged-card-actions">
                            <button
                              type="button"
                              className="btn btn-secondary action-approve flex items-center gap-1"
                              onClick={() => handleApprove(report.id)}
                            >
                              <ShieldCheck size={16} className="text-emerald-500" />
                              <span>Approve (Unflag)</span>
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary action-delete flex items-center gap-1"
                              onClick={() => handleDelete(report.id)}
                            >
                              <Trash2 size={16} className="text-rose-500" />
                              <span>Delete Report</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer justify-between">
              <button type="button" className="btn btn-secondary text-xs" onClick={handleLogout}>
                Reset Admin Token
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-secondary flex items-center gap-1"
                  onClick={() => loadQueue()}
                  disabled={loading}
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                  <span>Refresh Queue</span>
                </button>
                <button type="button" className="btn btn-primary" onClick={onClose}>
                  Close
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
