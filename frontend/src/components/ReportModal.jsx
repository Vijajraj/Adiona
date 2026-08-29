import { useState, useEffect, useRef } from 'react';
import {
  X,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Users,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import {
  GENERAL_SAFETY_CATEGORIES,
  WOMEN_SAFETY_CATEGORIES,
  SAFE_SPOT_CATEGORIES,
  AFFECTED_GROUPS,
} from '../utils/categories';
import { CategoryIcon } from './CategoryIcon';
import { InlinePrivacyNotice } from './PrivacyNotice';
import { submitReport } from '../utils/api';

export function ReportModal({
  isOpen,
  onClose,
  coordinates,
  deviceId,
  onReportSubmitted,
  onOpenPrivacy,
}) {
  const [status, setStatus] = useState('unsafe');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [note, setNote] = useState('');
  const [showAffectedGroup, setShowAffectedGroup] = useState(false);
  const [affectedGroup, setAffectedGroup] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const submitTimeoutRef = useRef(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
      }
    };
  }, []);

  // Reset errors when coordinates or modal visibility changes
  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [isOpen, coordinates]);

  if (!isOpen || !coordinates) return null;

  const { lat, lng } = coordinates;

  const handleStatusChange = (newStatus) => {
    if (newStatus !== status) {
      setStatus(newStatus);
      setSelectedCategory('');
      setErrorMessage('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!selectedCategory) {
      setErrorMessage('Please select a safety category.');
      return;
    }

    if (!deviceId) {
      setErrorMessage('Device identification error. Please refresh the page.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        lat,
        lng,
        status,
        category: selectedCategory,
        affected_group: showAffectedGroup && affectedGroup ? affectedGroup : null,
        note: note.trim() || null,
        device_id: deviceId,
      };

      const result = await submitReport(payload);
      setSuccessMessage('Report submitted successfully! Thank you for contributing.');
      submitTimeoutRef.current = setTimeout(() => {
        onReportSubmitted(result);
        handleResetAndClose();
      }, 1000);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current);
    }
    setSelectedCategory('');
    setNote('');
    setStatus('unsafe');
    setShowAffectedGroup(false);
    setAffectedGroup('');
    setErrorMessage('');
    setSuccessMessage('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleResetAndClose}>
      <div
        className="modal-content report-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-row">
            <MapPin className="text-indigo-600 flex-shrink-0" size={22} />
            <div>
              <h2 id="report-modal-title" className="modal-title">
                Report Safety Issue
              </h2>
              <p className="modal-subtitle">
                Snapped to ~100m grid ({lat.toFixed(4)}, {lng.toFixed(4)})
              </p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={handleResetAndClose}
            aria-label="Close report dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Form Container */}
        <form onSubmit={handleSubmit} className="report-form flex flex-col flex-1 overflow-hidden">
          {/* Scrollable Form Body */}
          <div className="modal-body space-y-5">
            {/* Status Selector */}
            <div className="form-group">
              <label className="form-label">Safety Status</label>
              <div className="status-toggle-group">
                <button
                  type="button"
                  className={`status-btn ${status === 'unsafe' ? 'active-unsafe' : ''}`}
                  onClick={() => handleStatusChange('unsafe')}
                  aria-pressed={status === 'unsafe'}
                >
                  <ShieldAlert size={18} />
                  <span>Unsafe / Concern</span>
                </button>
                <button
                  type="button"
                  className={`status-btn ${status === 'safe' ? 'active-safe' : ''}`}
                  onClick={() => handleStatusChange('safe')}
                  aria-pressed={status === 'safe'}
                >
                  <ShieldCheck size={18} />
                  <span>Safe Spot</span>
                </button>
              </div>
            </div>

            {/* Dynamic Category Sections based on Status */}
            {status === 'safe' ? (
              /* Safe Spot Categories */
              <div className="form-group">
                <div className="form-label flex justify-between items-center w-full mb-2">
                  <span className="font-semibold text-emerald-800 flex items-center gap-1.5">
                    Safe Spot Positive Indicators
                    <span className="required-star">*</span>
                  </span>
                  <span className="badge-safe-spot">Safe Haven</span>
                </div>
                <div className="category-grid" role="group" aria-label="Safe spot categories">
                  {SAFE_SPOT_CATEGORIES.map((cat) => {
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        className={`category-card safe-card ${isSelected ? 'selected-safe' : ''}`}
                        onClick={() => setSelectedCategory(cat.id)}
                        aria-pressed={isSelected}
                      >
                        <CategoryIcon name={cat.icon} size={20} className={isSelected ? 'text-emerald-600' : 'text-slate-500'} />
                        <div className="category-card-text">
                          <div className="category-label">{cat.label}</div>
                          <div className="category-desc">{cat.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Unsafe Categories: General Safety + Women Safety */
              <>
                {/* Category Section: General Safety */}
                <div className="form-group">
                  <label className="form-label">
                    <span>General Safety Categories</span>
                    <span className="required-star">*</span>
                  </label>
                  <div className="category-grid" role="group" aria-label="General safety categories">
                    {GENERAL_SAFETY_CATEGORIES.map((cat) => {
                      const isSelected = selectedCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          className={`category-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => setSelectedCategory(cat.id)}
                          aria-pressed={isSelected}
                        >
                          <CategoryIcon name={cat.icon} size={20} />
                          <div className="category-card-text">
                            <div className="category-label">{cat.label}</div>
                            <div className="category-desc">{cat.description}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Category Section: Women Safety */}
                <div className="form-group mt-4">
                  <div className="form-label flex justify-between items-center w-full mb-2">
                    <span className="font-semibold text-slate-800">Women Safety Categories</span>
                    <span className="badge-women-safety">Dedicated Concern</span>
                  </div>
                  <div className="category-grid" role="group" aria-label="Women safety categories">
                    {WOMEN_SAFETY_CATEGORIES.map((cat) => {
                      const isSelected = selectedCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          className={`category-card women-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => setSelectedCategory(cat.id)}
                          aria-pressed={isSelected}
                        >
                          <CategoryIcon name={cat.icon} size={20} />
                          <div className="category-card-text">
                            <div className="category-label">{cat.label}</div>
                            <div className="category-desc">{cat.description}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Optional Note Field */}
            <div className="form-group">
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="report-note" className="form-label mb-0">
                  Details / Landmark (Optional)
                </label>
                <span
                  className={`char-count text-xs ${
                    note.length > 200 ? 'text-amber-600 font-semibold' : 'text-slate-400'
                  }`}
                >
                  {note.length}/240
                </span>
              </div>
              <textarea
                id="report-note"
                className="form-textarea"
                rows="3"
                maxLength={240}
                placeholder={
                  status === 'safe'
                    ? 'Describe why this area feels safe or details about security/lighting...'
                    : selectedCategory.startsWith('other')
                    ? 'Please describe the safety issue or specific landmark...'
                    : 'Add brief context, nearby landmark, or specific hazard (no personal names)...'
                }
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            {/* Affected Group Opt-in Toggle */}
            <div className="affected-group-section">
              <button
                type="button"
                className="accordion-toggle"
                onClick={() => setShowAffectedGroup(!showAffectedGroup)}
                aria-expanded={showAffectedGroup}
              >
                <div className="flex items-center gap-2">
                  <Users size={16} />
                  <span>Specify who is most affected (Optional)</span>
                </div>
                {showAffectedGroup ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showAffectedGroup && (
                <div className="accordion-content">
                  <div className="radio-group-pills">
                    {AFFECTED_GROUPS.map((group) => (
                      <label
                        key={group.id}
                        className={`radio-pill ${affectedGroup === group.id ? 'active' : ''}`}
                      >
                        <input
                          type="radio"
                          name="affected_group"
                          value={group.id}
                          checked={affectedGroup === group.id}
                          onChange={(e) => setAffectedGroup(e.target.value)}
                        />
                        <span>{group.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Inline Privacy Notice (Mandatory per Spec §12) */}
            <InlinePrivacyNotice onLearnMore={onOpenPrivacy} />

            {/* Error Message Display */}
            {errorMessage && (
              <div className="error-banner flex items-center gap-2" role="alert">
                <AlertCircle size={18} className="flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Message Display */}
            {successMessage && (
              <div className="success-banner flex items-center gap-2" role="status">
                <CheckCircle2 size={18} className="flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}
          </div>

          {/* Sticky Modal Footer Actions */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleResetAndClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex items-center justify-center gap-2"
              disabled={submitting || !!successMessage}
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Safety Report</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
