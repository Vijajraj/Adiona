import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FilterBar } from '../components/FilterBar';
import { ConfirmPrompt } from '../components/ConfirmPrompt';
import { PrivacyNoticeModal, InlinePrivacyNotice } from '../components/PrivacyNotice';

describe('FilterBar Component', () => {
  const defaultFilters = { category: null, hours_back: null, affected_group: null };
  const mockOnFilterChange = vi.fn();
  const mockOnReset = vi.fn();

  it('toggles filter panel open and closed', () => {
    render(
      <FilterBar
        filters={defaultFilters}
        onFilterChange={mockOnFilterChange}
        onResetFilters={mockOnReset}
      />
    );

    const toggleBtn = screen.getByRole('button', { name: /Toggle map filters/i });
    fireEvent.click(toggleBtn);

    expect(screen.getByText('Heatmap Filters')).toBeInTheDocument();
    expect(screen.getByText('Problem Category')).toBeInTheDocument();
    expect(screen.getByText('Time Range')).toBeInTheDocument();
    expect(screen.getByText('Affected Demographic')).toBeInTheDocument();
  });
});

describe('ConfirmPrompt Component', () => {
  const mockReport = {
    id: 'report-uuid-1',
    category: 'poor_lighting',
    status: 'unsafe',
    confirmations: 2,
  };
  const mockOnClose = vi.fn();
  const mockOnConfirmed = vi.fn();
  const mockOnProceedWithNew = vi.fn();

  it('renders existing report category and confirmation buttons', () => {
    render(
      <ConfirmPrompt
        isOpen={true}
        onClose={mockOnClose}
        existingReport={mockReport}
        deviceId="test-device-uuid"
        onConfirmed={mockOnConfirmed}
        onProceedWithNewReport={mockOnProceedWithNew}
      />
    );

    expect(screen.getByText('Existing Report Nearby')).toBeInTheDocument();
    expect(screen.getByText('Poor / No Lighting')).toBeInTheDocument();
    expect(screen.getByText('Confirm This Report (+1)')).toBeInTheDocument();
    expect(screen.getByText('Report Different Issue')).toBeInTheDocument();
  });

  it('triggers onProceedWithNewReport when clicking "Report Different Issue"', () => {
    render(
      <ConfirmPrompt
        isOpen={true}
        onClose={mockOnClose}
        existingReport={mockReport}
        deviceId="test-device-uuid"
        onConfirmed={mockOnConfirmed}
        onProceedWithNewReport={mockOnProceedWithNew}
      />
    );

    const diffBtn = screen.getByText('Report Different Issue');
    fireEvent.click(diffBtn);
    expect(mockOnProceedWithNew).toHaveBeenCalledTimes(1);
  });
});

describe('PrivacyNotice Component', () => {
  it('renders "What is stored" and "What is NOT stored" per spec §12', () => {
    render(<PrivacyNoticeModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('Privacy & Anonymity Disclosure')).toBeInTheDocument();
    expect(screen.getByText('What is stored')).toBeInTheDocument();
    expect(screen.getByText('What is NOT stored')).toBeInTheDocument();
    expect(screen.getAllByText(/Anonymous Device ID/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/No Personal Identity/i)).toBeInTheDocument();
  });

  it('renders inline privacy notice badge', () => {
    const mockOpen = vi.fn();
    render(<InlinePrivacyNotice onOpenFull={mockOpen} />);

    expect(screen.getByText(/Zero-login & Anonymous/i)).toBeInTheDocument();
    const link = screen.getByText('Privacy details');
    fireEvent.click(link);
    expect(mockOpen).toHaveBeenCalledTimes(1);
  });
});
