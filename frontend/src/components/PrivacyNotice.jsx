import { ShieldCheck, X, Check, AlertCircle } from 'lucide-react';

export function PrivacyNoticeModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content privacy-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-modal-title"
      >
        <div className="modal-header">
          <div className="modal-title-row">
            <ShieldCheck className="text-emerald-500" size={24} />
            <h2 id="privacy-modal-title">Privacy & Anonymity Disclosure</h2>
          </div>
          <button className="close-button" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body space-y-4">
          <p className="intro-text">
            Chennai Safety Map is an open, login-free civic reporting tool built for public safety.
            We are committed to strict zero-knowledge anonymous reporting.
          </p>

          <div className="privacy-grid">
            <div className="privacy-card stored-card">
              <div className="card-header">
                <Check size={18} className="text-emerald-500" />
                <h3>What is stored</h3>
              </div>
              <ul>
                <li><strong>Anonymous Device ID:</strong> A randomly generated UUID stored in your browser for rate-limiting.</li>
                <li><strong>Snapped Location:</strong> Coordinates snapped to ~100m grid cells to protect your exact location.</li>
                <li><strong>Report Details:</strong> Selected category, status, optional note, and optional affected group.</li>
                <li><strong>Timestamp:</strong> Date and time of report submission.</li>
              </ul>
            </div>

            <div className="privacy-card not-stored-card">
              <div className="card-header">
                <AlertCircle size={18} className="text-rose-500" />
                <h3>What is NOT stored</h3>
              </div>
              <ul>
                <li><strong>No Personal Identity:</strong> No name, email, phone number, or social profiles.</li>
                <li><strong>No Accounts:</strong> No passwords or logins.</li>
                <li><strong>No Exact GPS:</strong> Precise lat/long coordinates are permanently discarded after ~100m grid snapping.</li>
                <li><strong>No Tracking Cookies:</strong> No ad trackers or third-party behavioral analytics.</li>
              </ul>
            </div>
          </div>

          <div className="privacy-why-box">
            <h4>Why do we store an anonymous Device ID?</h4>
            <p>
              To prevent automated bots and single-spot spam from overwhelming the map while keeping
              access completely frictionless and anonymous (maximum 5 reports per device per day).
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            Got it, thanks
          </button>
        </div>
      </div>
    </div>
  );
}

export function InlinePrivacyNotice({ onOpenFull, onLearnMore }) {
  const handleOpen = onOpenFull || onLearnMore;
  return (
    <div className="inline-privacy-banner">
      <ShieldCheck size={16} className="text-emerald-600 flex-shrink-0" />
      <span>
        <strong>Zero-login & Anonymous:</strong> Snapped to ~100m grid.{' '}
        {handleOpen && (
          <button type="button" className="privacy-link" onClick={handleOpen}>
            Privacy details
          </button>
        )}
      </span>
    </div>
  );
}
