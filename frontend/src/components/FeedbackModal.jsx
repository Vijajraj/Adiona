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
} from 'lucide-react';
import { submitFeedback } from '../utils/api';

const CATEGORIES = [
  { id: 'suggestion', label: 'Suggestion', icon: Lightbulb, color: 'text-amber-500' },
  { id: 'bug', label: 'Bug Report', icon: Bug, color: 'text-rose-500' },
  { id: 'safety', label: 'Safety Note', icon: ShieldAlert, color: 'text-indigo-500' },
  { id: 'general', label: 'General', icon: MessageCircle, color: 'text-teal-500' },
];

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
      setSuccessMessage('Thank you! Your feedback helps make Chennai safer.');
      // Clear form
      setMessage('');
      closeTimeoutRef.current = setTimeout(() => {
        onClose();
      }, 1600);
    } catch (err) {
      // Local storage fallback so user feedback is NEVER lost
      try {
        const stored = JSON.parse(localStorage.getItem('adiona_feedback_backup') || '[]');
        stored.push({ ...payload, timestamp: new Date().toISOString() });
        localStorage.setItem('adiona_feedback_backup', JSON.stringify(stored));
        setSuccessMessage('Feedback saved offline! Thank you for sharing your thoughts.');
        setMessage('');
        closeTimeoutRef.current = setTimeout(() => {
          onClose();
        }, 1600);
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
        <div className="modal-header">
          <div className="modal-title-row flex items-center gap-2">
            <MessageSquareHeart className="text-indigo-500" size={22} />
            <div>
              <h2 id="feedback-modal-title" className="modal-title font-bold text-lg">
                Community Feedback
              </h2>
              <p className="modal-subtitle text-xs text-slate-400">
                Help improve Adiona — Chennai's open safety map
              </p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close feedback modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="feedback-form flex flex-col gap-4 p-5">
          {errorMessage && (
            <div className="alert-banner alert-error flex items-center gap-2" role="alert">
              <AlertCircle size={18} className="flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="alert-banner alert-success flex items-center gap-2" role="status">
              <CheckCircle2 size={18} className="flex-shrink-0 text-emerald-500" />
              <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                {successMessage}
              </span>
            </div>
          )}

          {/* Feedback Type Category Chips */}
          <div className="form-group">
            <label className="form-label text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Topic
            </label>
            <div className="feedback-category-grid grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => {
                const IconComponent = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={`category-chip flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    onClick={() => setCategory(cat.id)}
                  >
                    <IconComponent size={14} className={cat.color} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rating */}
          <div className="form-group">
            <label className="form-label text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Rate your experience
            </label>
            <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Rating stars">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = (hoverRating || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    className="p-1 text-slate-300 hover:scale-110 transition-transform focus:outline-none"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    aria-label={`${star} star${star > 1 ? 's' : ''}`}
                  >
                    <Star
                      size={24}
                      className={
                        isFilled
                          ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                          : 'text-slate-300 dark:text-slate-700'
                      }
                    />
                  </button>
                );
              })}
              <span className="text-xs font-medium text-slate-400 ml-2">
                {rating === 5 && 'Outstanding'}
                {rating === 4 && 'Good'}
                {rating === 3 && 'Average'}
                {rating === 2 && 'Needs improvement'}
                {rating === 1 && 'Poor'}
              </span>
            </div>
          </div>

          {/* Message Textarea */}
          <div className="form-group">
            <div className="flex justify-between items-center mb-1.5">
              <label className="form-label text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Your Thoughts / Suggestions
              </label>
              <span className="text-xs text-slate-400">{message.length}/1000</span>
            </div>
            <textarea
              className="feedback-textarea w-full p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none transition-all"
              rows={4}
              maxLength={1000}
              placeholder="What features would you love to see? Found a bug? Or have safety ideas for Chennai?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>

          {/* Footer Submit */}
          <div className="modal-footer flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              className="btn btn-secondary px-4 py-2 text-sm font-semibold rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm disabled:opacity-60"
              disabled={submitting || message.trim().length < 3 || !!successMessage}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Submitting...</span>
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
