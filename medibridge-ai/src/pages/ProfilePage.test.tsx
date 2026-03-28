import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import ProfilePage from './ProfilePage';
import { useProfile } from '../contexts/ProfileContext';

vi.mock('../contexts/ProfileContext', () => ({
  useProfile: vi.fn()
}));

describe('ProfilePage', () => {
  const mockUser = { uid: 'u1' } as any;

  it('renders existing profiles', () => {
    (useProfile as any).mockReturnValue({
      profiles: [{ id: 'p1', name: 'John Doe', relationship: 'Self' }],
      activeProfile: { id: 'p1' },
      setActiveProfile: vi.fn()
    });

    render(<ProfilePage user={mockUser} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Self')).toBeInTheDocument();
  });

  it('opens "Add Profile" form when button clicked', () => {
    (useProfile as any).mockReturnValue({
      profiles: [],
      activeProfile: null,
      setActiveProfile: vi.fn()
    });

    render(<ProfilePage user={mockUser} />);
    
    const addBtn = screen.getByText('Add Profile');
    fireEvent.click(addBtn);
    
    expect(screen.getByText('Create New Profile')).toBeInTheDocument();
    expect(screen.getByLabelText('Name *')).toBeInTheDocument();
  });
});
