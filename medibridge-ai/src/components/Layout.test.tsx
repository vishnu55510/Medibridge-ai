import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import Layout from './Layout';
import { useProfile } from '../contexts/ProfileContext';
import { BrowserRouter } from 'react-router-dom';
import * as auth from 'firebase/auth';

vi.mock('../contexts/ProfileContext', () => ({
  useProfile: vi.fn()
}));

vi.mock('firebase/auth', async () => {
  const actual = await vi.importActual('firebase/auth');
  return { ...actual, signOut: vi.fn() };
});

vi.mock('./NotificationsPopover', () => ({
  default: () => <div data-testid="notifications-popover">Mock Popover</div>
}));

describe('Layout', () => {
  const mockUser = {
    uid: 'user123',
    email: 'test@example.com',
    displayName: 'Test User'
  } as any;

  beforeEach(() => {
    (useProfile as any).mockReturnValue({
      activeProfile: { id: 'p1', name: 'Test User Profile' },
      profiles: [{ id: 'p1', name: 'Test User Profile', relationship: 'Self' }],
      setActiveProfile: vi.fn()
    });
    vi.clearAllMocks();
  });

  it('renders main navigation links', () => {
    render(<BrowserRouter><Layout user={mockUser} /></BrowserRouter>);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Timeline')).toBeInTheDocument();
    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
  });

  it('calls signOut when Sign Out button is clicked', async () => {
    const user = userEvent.setup();
    render(<BrowserRouter><Layout user={mockUser} /></BrowserRouter>);
    
    const signOutBtn = screen.getByRole('button', { name: /Sign Out/i });
    await user.click(signOutBtn);
    
    expect(auth.signOut).toHaveBeenCalled();
  });
  
  it('opens and closes the mobile menu', async () => {
    const user = userEvent.setup();
    render(<BrowserRouter><Layout user={mockUser} /></BrowserRouter>);
    
    const openBtn = screen.getByLabelText('Open mobile menu');
    expect(openBtn.getAttribute('aria-expanded')).toBe('false');
    
    await user.click(openBtn);
    expect(openBtn.getAttribute('aria-expanded')).toBe('true');
    
    const closeBtn = screen.getByLabelText('Close mobile menu');
    await user.click(closeBtn);
    
    expect(openBtn.getAttribute('aria-expanded')).toBe('false');
  });
});
