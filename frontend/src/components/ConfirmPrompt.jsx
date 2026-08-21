import React, { useState } from 'react';
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

  if (!isOpen || !existingReport) return null;

  const categoryMeta = ALL_CATEGORIES.find((c) => c.id === existingReport.category);
  const categoryLabel = categoryMeta ? categoryMeta.label : (existingReport.category?.replace(/_/g, ' ') || 'Safety Concern');

  const handleConfirm = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setConfirming(true);

    try {
      const result = await confirmReport(existingReport.id, deviceId);
      setSuccessMessage(`Report confirmed! Total confirmations: ${result.confirmations}`);
      setTimeout(() => {
        onConfirmed(result);
        onClose();
      }, 1000);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to confirm report.');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-row">
            <ShieldCheck className="text-amber-500" size={24} />
            <h2>Existing Report Nearby</h2>
          </div>
          <button className="close-button" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body space-y-4">
          <p className="intro-text">
            A safety report already exists in this ~100m grid cell. Confirming an existing report
            boosts its visibility and credibility on the city heatmap without cluttering the map with duplicates.
          </p>

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
            disabled={confirming}
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
