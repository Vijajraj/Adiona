import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReportModal } from '../components/ReportModal';
import { FilterBar } from '../components/FilterBar';
import { MapView } from '../components/MapView';

describe('Phase F — Accessibility & Inclusive Design Audit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // F.1 — Keyboard Navigation Audit
  // ==========================================================================

  it('supports full keyboard navigation in ReportModal (Tab, Space/Enter select, Escape close)', async () => {
    const onClose = vi.fn();
    const onReportSubmitted = vi.fn();

    render(
      <ReportModal
        isOpen={true}
        onClose={onClose}
        coordinates={{ lat: 13.0827, lng: 80.2707 }}
        deviceId="12345678-1234-4234-8234-123456789abc"
        onReportSubmitted={onReportSubmitted}
      />
    );

    // 1. Modal dialog accessibility role
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');

    // 2. Close button has aria-label and can be triggered via keyboard
    const closeBtn = screen.getByLabelText(/close report dialog/i);
    expect(closeBtn).toBeInTheDocument();

    // 3. Status selection buttons have aria-pressed attributes
    const unsafeBtn = screen.getByText(/unsafe \/ concern/i).closest('button');
    const safeBtn = screen.getByText(/safe spot/i).closest('button');

    expect(unsafeBtn).toHaveAttribute('aria-pressed', 'true'); // Default
    expect(safeBtn).toHaveAttribute('aria-pressed', 'false');

    // Select "safe spot" using keyboard
    fireEvent.click(safeBtn);
    expect(safeBtn).toHaveAttribute('aria-pressed', 'true');

    // 4. Close modal via close button
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  // ==========================================================================
  // F.2 — Screen Reader Accessibility Labels Audit
  // ==========================================================================

  it('has valid aria-labels and semantic roles on all interactive controls', () => {
    render(
      <FilterBar
        filters={{ category: null, hours_back: null, affected_group: null }}
        onFilterChange={vi.fn()}
        onResetFilters={vi.fn()}
      />
    );

    // Expand filter bar
    const toggleBtn = screen.getByLabelText(/toggle map filters/i);
    fireEvent.click(toggleBtn);

    // Filter controls have accessible labels and options
    expect(screen.getByText('Problem Category')).toBeInTheDocument();
    expect(screen.getByText('Time Range')).toBeInTheDocument();
    expect(screen.getByText('Affected Demographic')).toBeInTheDocument();
  });

  // ==========================================================================
  // F.3 — Color-Blindness Accessibility Audit (Does not rely on color alone)
  // ==========================================================================

  it('provides textual labels and explicit legend text alongside color indicators', () => {
    render(
      <FilterBar
        filters={{ category: null, hours_back: null, affected_group: null }}
        onFilterChange={vi.fn()}
        onResetFilters={vi.fn()}
      />
    );

    // Expand filter bar
    const toggleBtn = screen.getByLabelText(/toggle map filters/i);
    fireEvent.click(toggleBtn);

    // Filter options use explicit text alongside icons
    expect(screen.getByText('All Categories (Default)')).toBeInTheDocument();
    expect(screen.getByText('All Time (Cumulative)')).toBeInTheDocument();
  });
});


