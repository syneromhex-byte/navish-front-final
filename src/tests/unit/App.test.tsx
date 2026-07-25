import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import App from '@app/App';

vi.mock('@services/authApi', () => ({
  authApi: {
    refresh: vi.fn().mockRejectedValue(new Error('no session')),
  },
}));

describe('App', () => {
  it('renders the home route through the router and layout', async () => {
    render(<App />);
    // Home is a lazy-loaded chunk — the default 1000ms findByText timeout isn't
    // reliably enough headroom as the module graph grows across the project.
    expect(await screen.findByText(/every space,/i, {}, { timeout: 10000 })).toBeInTheDocument();
    expect(screen.getAllByText('NAVISH ARC').length).toBeGreaterThan(0);
  });
});
