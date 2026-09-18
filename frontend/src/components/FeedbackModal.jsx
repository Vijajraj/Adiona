import { useState, useRef, useEffect } from 'react';
import {
  X,
  MessageSquareHeart,
  Star,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  Lightbulb,
  Bug,
  ShieldAlert,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react';
import { submitFeedback } from '../utils/api';

const CATEGORIES = [
  { id: 'suggestion', label: 'Suggestion', icon: Lightbulb, color: '#f59e0b' },
  { id: 'bug', label: 'Bug Report', icon: Bug, color: '#ef4444' },
  { id: 'safety', label: 'Safety Note', icon: ShieldAlert, color: '#4f46e5' },
  { id: 'general', label: 'General', icon: MessageCircle, color: '#0d9488' },
];

const CATEGORY_PLACEHOLDERS = {
  suggestion: 'What features or improvements would help you feel safer in Chennai?',
  bug: 'What went wrong? Please share steps to reproduce or details about your browser/device...',
  safety: 'Have observations about street lighting, patrol points, or safety trends in Chennai?',
  general: 'Share your thoughts, suggestions, or words of encouragement for the team...',
};

const RATING_LABELS = {
  5: '⭐⭐⭐⭐⭐ Outstanding',
  4: '⭐⭐⭐⭐ Great experience',
  3: '⭐⭐⭐ Good, can improve',
  2: '⭐⭐ Needs improvement',
  1: '⭐ Having issues',
};

export function FeedbackModal({ isOpen, onClose, deviceId }) {
  const [category, setCategory] = useState('suggestion');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const closeTimeoutRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || trimmed.length < 3) {
      setErrorMessage('Please enter at least 3 characters of feedback.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    const payload = {
      device_id: deviceId || 'anonymous-device-uuid',
      category,
      rating: rating > 0 ? rating : null,
      message: trimmed,
    };

    try {
      await submitFeedback(payload);
      setSuccessMessage('Thank you! Your feedback has been sent directly to the development team.');
      setMessage('');
      closeTimeoutRef.current = setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err) {
      // Offline fallback: save to localStorage
      try {
        const stored = JSON.parse(localStorage.getItem('adiona_feedback_backup') || '[]');
        stored.push({ ...payload, timestamp: new Date().toISOString() });
        localStorage.setItem('adiona_feedback_backup', JSON.stringify(stored));
        setSuccessMessage('Feedback saved offline! Thank you for sharing your thoughts.');
        setMessage('');
        closeTimeoutRef.current = setTimeout(() => {
          onClose();
        }, 1800);
      } catch {
        setErrorMessage(err.message || 'Failed to submit feedback. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content feedback-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-modal-title"
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-row">
            <div className="feedback-modal-header-icon">
              <MessageSquareHeart size={20} />
            </div>
            <div>
              <h2 id="feedback-modal-title" className="modal-title">
                Community Feedback
              </h2>
              <p className="modal-subtitle">
                Help improve Chennai's open safety map • Delivered directly to maintainers
              </p>
            </div>
          </div>
          <button
            type="button"
            className="close-button"
            onClick={onClose}
            aria-label="Close feedback modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="feedback-form">
          <div className="modal-body space-y-4">
            {/* Feedback Alerts */}
            {errorMessage && (
              <div className="alert-banner alert-error" role="alert">
                <AlertCircle size={18} className="flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="alert-banner alert-success" role="status">
                <CheckCircle2 size={18} className="flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Topic Selection */}
            <div className="form-group">
              <label className="section-label">Topic</label>
              <div className="feedback-topic-grid" role="radiogroup" aria-label="Feedback topics">
                {CATEGORIES.map((cat) => {
                  const IconComponent = cat.icon;
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      className={`feedback-topic-btn ${isSelected ? 'active' : ''}`}
                      onClick={() => setCategory(cat.id)}
                      role="radio"
                      aria-checked={isSelected}
                    >
                      <div className="topic-icon-badge">
                        <IconComponent size={16} style={{ color: cat.color }} />
                      </div>
                      <span className="feedback-topic-title">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Star Rating */}
            <div className="form-group">
              <label className="section-label">Rate your experience</label>
              <div className="feedback-rating-box">
                <div
                  className="feedback-stars-row"
                  role="radiogroup"
                  aria-label="Rating stars"
                >
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = (hoverRating || rating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        className="star-interactive-btn"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        aria-label={`${star} star${star > 1 ? 's' : ''}`}
                        role="radio"
                        aria-checked={rating === star}
                      >
                        <Star
                          className={`star-icon-svg ${isFilled ? 'star-filled' : 'star-empty'}`}
                        />
                      </button>
                    );
                  })}
                </div>
                <span className="feedback-rating-tag">
                  {RATING_LABELS[rating] || 'Select rating'}
                </span>
              </div>
            </div>

            {/* Feedback Message */}
            <div className="form-group">
              <div className="label-with-count mb-1">
                <label htmlFor="feedback-message" className="section-label mb-0">
                  Your Thoughts / Suggestions
                </label>
                <span
                  className={`char-count ${
                    message.length > 900 ? 'text-amber-600 font-semibold' : ''
                  }`}
                >
                  {message.length}/1000
                </span>
              </div>
              <textarea
                id="feedback-message"
                className="feedback-textarea"
                rows={4}
                maxLength={1000}
                placeholder={CATEGORY_PLACEHOLDERS[category]}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>

            {/* Privacy Guarantee Banner */}
            <div className="feedback-privacy-guarantee">
              <ShieldCheck size={16} className="flex-shrink-0 text-emerald-600" />
              <span>
                <strong>100% Anonymous:</strong> No email, accounts, or personal data stored. Delivered directly to the maintainers.
              </span>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="feedback-modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || message.trim().length < 3 || !!successMessage}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>Send Feedback</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
