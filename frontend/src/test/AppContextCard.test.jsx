import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AppContextCard } from '../components/AppContextCard';

describe('AppContextCard Component', () => {
  it('renders context card in expanded state initially', () => {
    render(<AppContextCard />);
    expect(screen.getByText('About Adiona')).toBeInTheDocument();
    expect(screen.getByText(/A login-free, hyperlocal civic safety network/i)).toBeInTheDocument();
    expect(screen.getByText(/100% Anonymous:/i)).toBeInTheDocument();
    expect(screen.getByText(/~100m Privacy Grid:/i)).toBeInTheDocument();
  });

  it('collapses and expands on click', () => {
    render(<AppContextCard />);

    // Click collapse button
    const collapseBtn = screen.getByRole('button', { name: /Collapse About card/i });
    fireEvent.click(collapseBtn);

    // Expect collapsed toggle button to be rendered
    const expandBtn = screen.getByRole('button', { name: /Expand About Adiona context/i });
    expect(expandBtn).toBeInTheDocument();

    // Click expand button
    fireEvent.click(expandBtn);
    expect(screen.getByText(/A login-free, hyperlocal civic safety network/i)).toBeInTheDocument();
  });
});
