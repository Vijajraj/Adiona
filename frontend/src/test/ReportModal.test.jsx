import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ReportModal } from '../components/ReportModal';

describe('ReportModal Component', () => {
  const mockCoords = { lat: 13.0827, lng: 80.2707 };
  const mockDeviceId = 'test-device-uuid-12345';
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    coordinates: mockCoords,
    deviceId: mockDeviceId,
    onReportSubmitted: vi.fn(),
    onOpenPrivacy: vi.fn(),
  };

  it('renders status buttons, both category lists, and note field', () => {
    render(<ReportModal {...defaultProps} />);

    // Status buttons
    expect(screen.getByText('Unsafe / Concern')).toBeInTheDocument();
    expect(screen.getByText('Safe Spot')).toBeInTheDocument();

    // Two distinct category section headers
    expect(screen.getByText(/General Safety Categories/i)).toBeInTheDocument();
    expect(screen.getByText(/Women Safety Categories/i)).toBeInTheDocument();

    // Categories in General list
    expect(screen.getByText('Poor / No Lighting')).toBeInTheDocument();
    expect(screen.getByText('Robbery / Theft-Prone')).toBeInTheDocument();

    // Categories in Women list
    expect(screen.getByText('Catcalling / Verbal Harassment')).toBeInTheDocument();
    expect(screen.getByText('Physical Harassment / Groping')).toBeInTheDocument();

    // Note textarea
    expect(screen.getByPlaceholderText(/Add brief context/i)).toBeInTheDocument();
    expect(screen.getByText('0/240')).toBeInTheDocument();
  });

  it('toggles user-controlled demographic accordion on click (collapsed by default)', () => {
    render(<ReportModal {...defaultProps} />);

    // Demographics should be collapsed initially
    expect(screen.queryByText('Woman')).not.toBeInTheDocument();

    // Click accordion toggle
    const toggleBtn = screen.getByText(/Specify who is most affected/i);
    fireEvent.click(toggleBtn);

    // Demographics should now be visible
    expect(screen.getByText('Woman')).toBeInTheDocument();
    expect(screen.getByText('Elderly')).toBeInTheDocument();
    expect(screen.getByText('Child')).toBeInTheDocument();
  });

  it('displays validation error if submitting without selecting a category', async () => {
    render(<ReportModal {...defaultProps} />);

    const submitBtn = screen.getByRole('button', { name: /Submit Safety Report/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText('Please select a safety category.')).toBeInTheDocument();
  });

  it('allows category selection and updates note character count', () => {
    render(<ReportModal {...defaultProps} />);

    // Select category
    const catBtn = screen.getByText('Poor / No Lighting');
    fireEvent.click(catBtn);

    // Type in note field
    const textarea = screen.getByPlaceholderText(/Add brief context/i);
    fireEvent.change(textarea, { target: { value: 'Broken light post near bus terminal' } });

    expect(screen.getByText('35/240')).toBeInTheDocument();
  });
});
