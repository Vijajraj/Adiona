import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModerationModal } from '../components/ModerationModal';
import * as api from '../utils/api';

// Mock API functions
vi.mock('../utils/api', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    fetchFlaggedReports: vi.fn(),
    approveFlaggedReport: vi.fn(),
    deleteFlaggedReport: vi.fn(),
    fetchModerationStats: vi.fn(),
  };
});

describe('ModerationModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders admin authorization prompt by default when no key is in localStorage', () => {
    render(<ModerationModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByPlaceholderText(/Enter Admin Secret Key.../i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Authenticate/i })).toBeInTheDocument();
  });

  it('verifies key, saves to localStorage, and renders stats and flagged reports on successful auth', async () => {
    const mockStats = {
      flagged_reports: 1,
      user_reports: 5,
      seed_reports: 10,
      total_reports: 15,
    };
    const mockReports = [
      {
        id: 'flagged-report-id-123',
        grid_lat: 13.0827,
        grid_lng: 80.2707,
        status: 'unsafe',
        category: 'poor_lighting',
        note: 'Stupid spam note flagged by filter',
        device_id: 'device-id-uuid',
        confirmations: 0,
        is_flagged: true,
        is_seed: false,
        created_at: new Date().toISOString(),
      },
    ];

    api.fetchModerationStats.mockResolvedValue(mockStats);
    api.fetchFlaggedReports.mockResolvedValue(mockReports);

    render(<ModerationModal isOpen={true} onClose={vi.fn()} />);

    const input = screen.getByPlaceholderText(/Enter Admin Secret Key.../i);
    const authBtn = screen.getByRole('button', { name: /Authenticate/i });

    fireEvent.change(input, { target: { value: 'chennai-safety-admin-key' } });
    fireEvent.click(authBtn);

    await waitFor(() => {
      expect(localStorage.getItem('adiona_admin_key')).toBe('chennai-safety-admin-key');
      expect(screen.queryByText('Queue is Empty')).not.toBeInTheDocument();
    });

    // Check stats dashboard
    expect(screen.getByText('Flagged Queue')).toBeInTheDocument();
    expect(screen.getByText('User Submissions')).toBeInTheDocument();
    expect(screen.getByText('Seed Points')).toBeInTheDocument();
    expect(screen.getByText('Total DB Items')).toBeInTheDocument();

    // Check flagged item card contents
    expect(screen.getByText('"Stupid spam note flagged by filter"')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Approve \(Unflag\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Delete Report/i })).toBeInTheDocument();
  });

  it('allows approving a flagged report which clears the item from the UI list', async () => {
    const mockStats = { flagged_reports: 1, user_reports: 5, seed_reports: 10, total_reports: 15 };
    const mockReports = [
      {
        id: 'flagged-report-id-123',
        grid_lat: 13.0827,
        grid_lng: 80.2707,
        status: 'unsafe',
        category: 'poor_lighting',
        note: 'Offensive word note',
        device_id: 'device-id-uuid',
        confirmations: 0,
        is_flagged: true,
        is_seed: false,
        created_at: new Date().toISOString(),
      },
    ];

    api.fetchModerationStats.mockResolvedValue(mockStats);
    api.fetchFlaggedReports.mockResolvedValue(mockReports);
    api.approveFlaggedReport.mockResolvedValue({ success: true, report_id: 'flagged-report-id-123' });

    // Set token in localStorage beforehand to simulate persistent login session
    localStorage.setItem('adiona_admin_key', 'chennai-safety-admin-key');

    render(<ModerationModal isOpen={true} onClose={vi.fn()} />);

    // Wait for the flagged report list to load
    await waitFor(() => {
      expect(screen.getByText('"Offensive word note"')).toBeInTheDocument();
    });

    const approveBtn = screen.getByRole('button', { name: /Approve \(Unflag\)/i });
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(screen.getByText(/Report approved and flag cleared successfully/i)).toBeInTheDocument();
      expect(screen.queryByText('"Offensive word note"')).not.toBeInTheDocument();
    });
  });
});
