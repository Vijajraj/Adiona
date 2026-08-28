import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SearchBar } from '../components/SearchBar';

describe('SearchBar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input with placeholder text', () => {
    render(<SearchBar onSelectLocation={vi.fn()} />);

    expect(
      screen.getByPlaceholderText(/Search Chennai locality/i)
    ).toBeInTheDocument();
  });

  it('queries Nominatim and renders matching Chennai locality suggestions', async () => {
    const mockNominatimResponse = [
      {
        place_id: 101,
        display_name: 'T. Nagar, Chennai, Tamil Nadu, India',
        lat: '13.0418',
        lon: '80.2341',
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockNominatimResponse,
    });

    const onSelect = vi.fn();
    render(<SearchBar onSelectLocation={onSelect} />);

    const input = screen.getByPlaceholderText(/Search Chennai locality/i);
    fireEvent.change(input, { target: { value: 'T. Nagar' } });

    await waitFor(() => {
      expect(screen.getByText('T. Nagar')).toBeInTheDocument();
    });

    const suggestion = screen.getByText('T. Nagar');
    fireEvent.click(suggestion);

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        shortName: 'T. Nagar',
        lat: 13.0418,
        lng: 80.2341,
      })
    );
  });
});
