import { useState, useEffect, useRef } from 'react';
import { ShieldCheck, CheckCircle2, AlertCircle, Loader2, X, PlusCircle } from 'lucide-react';
import { confirmReport } from '../utils/api';
import { ALL_CATEGORIES } from '../utils/categories';

export function ConfirmPrompt({
  isOpen,
  onClose,
  existingReport,
  deviceId,
  onConfirmed,
  onProceedWithNewReport,
}) {
  const [confirming, setConfirming] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const confirmTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (confirmTimeoutRef.current) {
        clearTimeout(confirmTimeoutRef.current);
      }
    };
  }, []);

  // Reset errors when opened/changed
  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [isOpen, existingReport]);

  if (!isOpen || !existingReport) return null;

  const categoryMeta = ALL_CATEGORIES.find((c) => c.id === existingReport.category);
  const categoryLabel = categoryMeta ? categoryMeta.label : (existingReport.category?.replace(/_/g, ' ') || 'Safety Concern');

  const handleClose = () => {
    if (confirmTimeoutRef.current) {
      clearTimeout(confirmTimeoutRef.current);
    }
    setErrorMessage('');
    setSuccessMessage('');
    onClose();
  };

  const handleConfirm = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setConfirming(true);

    try {
      const result = await confirmReport(existingReport.id, deviceId);
      setSuccessMessage(`Report confirmed! Total confirmations: ${result.confirmations}`);
      confirmTimeoutRef.current = setTimeout(() => {
        onConfirmed(result);
        handleClose();
      }, 1000);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to confirm report.');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-content confirm-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <div className="modal-header">
          <div className="modal-title-row">
            <ShieldCheck className="text-amber-500" size={24} />
            <h2 id="confirm-modal-title">Existing Report Nearby</h2>
          </div>
          <button className="close-button" onClick={handleClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body space-y-4">
          <p className="intro-text">
            A safety report already exists in this ~100m grid cell. Confirming an existing report
            boosts its visibility and credibility on the city heatmap without cluttering the map with duplicates.
          </p>

          {errorMessage && (
            <div className="alert-banner alert-error flex items-center gap-2" role="alert">
              <AlertCircle size={18} className="flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="alert-banner alert-success flex items-center gap-2" role="status">
              <CheckCircle2 size={18} className="flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="existing-report-card">
            <div className="card-row">
              <span className="label">Category:</span>
              <span className="value font-medium">{categoryLabel}</span>
            </div>
            <div className="card-row">
              <span className="label">Status:</span>
              <span className={`status-tag ${existingReport.status || 'unsafe'}`}>
                {existingReport.status === 'safe' ? 'Safe Spot' : 'Unsafe / Issue'}
              </span>
            </div>
            {existingReport.confirmations !== undefined && (
              <div className="card-row">
                <span className="label">Current Confirmations:</span>
                <span className="font-semibold">{existingReport.confirmations}</span>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer flex-col sm:flex-row gap-2">
          <button
            type="button"
            className="btn btn-secondary flex items-center justify-center gap-2"
            onClick={onProceedWithNewReport}
          >
            <PlusCircle size={16} />
            <span>Report Different Issue</span>
          </button>

          <button
            type="button"
            className="btn btn-primary flex items-center justify-center gap-2"
            onClick={handleConfirm}
            disabled={confirming || !!successMessage}
          >
            {confirming ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Confirming...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={16} />
                <span>Confirm This Report (+1)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
