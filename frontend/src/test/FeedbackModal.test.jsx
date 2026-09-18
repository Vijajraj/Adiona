import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeedbackModal } from '../components/FeedbackModal';
import * as api from '../utils/api';

describe('FeedbackModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly when open and displays category options and star ratings', () => {
    render(
      <FeedbackModal
        isOpen={true}
        onClose={vi.fn()}
        deviceId="test-device-uuid"
      />
    );

    expect(screen.getByText('Community Feedback')).toBeInTheDocument();
    expect(screen.getByText('Suggestion')).toBeInTheDocument();
    expect(screen.getByText('Bug Report')).toBeInTheDocument();
    expect(screen.getByText('Safety Note')).toBeInTheDocument();
    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send Feedback/i })).toBeInTheDocument();
  });

  it('submits feedback successfully when message is entered', async () => {
    const mockSubmit = vi.spyOn(api, 'submitFeedback').mockResolvedValue({
      id: 'feedback-123',
      message: 'Thank you!',
      created_at: new Date().toISOString(),
    });

    const onClose = vi.fn();
    render(
      <FeedbackModal
        isOpen={true}
        onClose={onClose}
        deviceId="test-device-uuid"
      />
    );

    const textarea = screen.getByPlaceholderText(/What features or improvements/i);
    fireEvent.change(textarea, {
      target: { value: 'Please add more details about street lighting.' },
    });

    const submitBtn = screen.getByRole('button', { name: /Send Feedback/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          device_id: 'test-device-uuid',
          category: 'suggestion',
          message: 'Please add more details about street lighting.',
        })
      );
    });

    expect(screen.getByText(/Thank you! Your feedback/i)).toBeInTheDocument();
  });

  it('submits feedback successfully without entering message (optional thoughts)', async () => {
    const mockSubmit = vi.spyOn(api, 'submitFeedback').mockResolvedValue({
      id: 'feedback-124',
      message: 'Thank you!',
      created_at: new Date().toISOString(),
    });

    render(
      <FeedbackModal
        isOpen={true}
        onClose={vi.fn()}
        deviceId="test-device-uuid"
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Send Feedback/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          device_id: 'test-device-uuid',
          category: 'suggestion',
          rating: 5,
          message: null,
        })
      );
    });

    expect(screen.getByText(/Thank you! Your feedback/i)).toBeInTheDocument();
  });
});
