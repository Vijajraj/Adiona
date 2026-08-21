import React, { useState } from 'react';
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

  if (!isOpen || !coordinates) return null;

  const { lat, lng } = coordinates;

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
      setTimeout(() => {
        onReportSubmitted(result);
        handleResetAndClose();
      }, 1200);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
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
      <div className="modal-content report-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-row">
            <MapPin className="text-indigo-600" size={22} />
            <div>
              <h2>Submit Safety Report</h2>
              <p className="coords-text">
                Location: {lat.toFixed(5)}, {lng.toFixed(5)} (~100m grid cell)
              </p>
            </div>
          </div>
          <button className="close-button" onClick={handleResetAndClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body space-y-5">
          {errorMessage && (
            <div className="alert-banner alert-error">
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="alert-banner alert-success">
              <CheckCircle2 size={18} />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Safe / Unsafe Status Toggle */}
          <div className="form-group">
            <label className="section-label">Safety Status</label>
            <div className="status-toggle-group">
              <button
                type="button"
                className={`status-btn unsafe-btn ${status === 'unsafe' ? 'active' : ''}`}
                onClick={() => setStatus('unsafe')}
              >
                <ShieldAlert size={18} />
                <span>Unsafe / Issue</span>
              </button>
              <button
                type="button"
                className={`status-btn safe-btn ${status === 'safe' ? 'active' : ''}`}
                onClick={() => setStatus('safe')}
              >
                <ShieldCheck size={18} />
                <span>Safe Spot</span>
              </button>
            </div>
          </div>

          {/* Categories: Two separate lists */}
          <div className="form-group">
            <label className="section-label">Select Problem Category</label>
            
            {/* List 1: General Safety */}
            <div className="category-section">
              <div className="category-section-header">
                <span className="badge badge-general">General Safety (Affects Everyone)</span>
              </div>
              <div className="category-grid">
                {GENERAL_SAFETY_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`category-card ${selectedCategory === cat.id ? 'selected' : ''}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    <div className="cat-icon-wrap">
                      <CategoryIcon name={cat.icon} size={18} />
                    </div>
                    <div className="cat-text">
                      <div className="cat-title">{cat.label}</div>
                      <div className="cat-desc">{cat.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* List 2: Women Safety (Kept distinct, not merged) */}
            <div className="category-section mt-4">
              <div className="category-section-header">
                <span className="badge badge-women">Women Safety</span>
              </div>
              <div className="category-grid">
                {WOMEN_SAFETY_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`category-card ${selectedCategory === cat.id ? 'selected' : ''}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    <div className="cat-icon-wrap">
                      <CategoryIcon name={cat.icon} size={18} />
                    </div>
                    <div className="cat-text">
                      <div className="cat-title">{cat.label}</div>
                      <div className="cat-desc">{cat.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Optional Note Field (Max 240 Chars) */}
          <div className="form-group">
            <div className="label-with-count">
              <label htmlFor="report-note" className="section-label">
                Additional Details / Note {selectedCategory?.startsWith('other') ? '(Required for "Other")' : '(Optional)'}
              </label>
              <span className={`char-count ${note.length > 220 ? 'text-amber-600' : ''}`}>
                {note.length} / 240
              </span>
            </div>
            <textarea
              id="report-note"
              className="form-textarea"
              rows={3}
              maxLength={240}
              placeholder="Provide relevant details (e.g. broken streetlight near bus stand, deserted stretch after 9 PM)..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {/* User-controlled Affected Group Toggle (Opt-in, Hidden by Default) */}
          <div className="form-group affected-group-accordion">
            <button
              type="button"
              className="accordion-toggle"
              onClick={() => setShowAffectedGroup(!showAffectedGroup)}
            >
              <div className="flex items-center gap-2">
                <Users size={16} />
                <span>Specify Affected Demographic (Optional)</span>
              </div>
              {showAffectedGroup ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showAffectedGroup && (
              <div className="accordion-content">
                <p className="help-text">
                  Used for safety analysis and filtering. Not required to submit.
                </p>
                <div className="radio-pills">
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
                  {affectedGroup && (
                    <button
                      type="button"
                      className="clear-pill"
                      onClick={() => setAffectedGroup('')}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Inline Privacy Notice per Spec §12 */}
          <InlinePrivacyNotice onOpenFull={onOpenPrivacy} />

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
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                'Submit Safety Report'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
