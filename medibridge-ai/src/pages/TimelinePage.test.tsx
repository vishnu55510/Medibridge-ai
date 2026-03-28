import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TimelinePage from './TimelinePage';
import { useProfile } from '../contexts/ProfileContext';
import * as firestore from 'firebase/firestore';
import React from 'react';

// Mock the context
vi.mock('../contexts/ProfileContext', () => ({
  useProfile: vi.fn()
}));

// Mock firestore to prevent real DB calls
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    collection: vi.fn(),
    query: vi.fn(),
    orderBy: vi.fn(),
    where: vi.fn(),
    limit: vi.fn(),
    doc: vi.fn(),
    updateDoc: vi.fn(),
    onSnapshot: vi.fn(),
  };
});

describe('TimelinePage', () => {
  const mockUser = { uid: 'test-user-123' } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "Please select a profile" when no active profile', () => {
    (useProfile as any).mockReturnValue({ activeProfile: null });
    
    render(<TimelinePage user={mockUser} />);
    expect(screen.getByText('Please select a profile.')).toBeInTheDocument();
  });

  it('renders loading state initially when profile exists', () => {
    (useProfile as any).mockReturnValue({ 
      activeProfile: { id: 'profile-123', name: 'John Doe' } 
    });
    // Mock onSnapshot so it doesn't immediately call the callback
    (firestore.onSnapshot as any).mockImplementation(() => vi.fn());

    render(<TimelinePage user={mockUser} />);
    
    // We expect "Health Timeline" header to show up while loading
    expect(screen.getByText('Health Timeline')).toBeInTheDocument();
    expect(screen.getByText('Chronological history for John Doe')).toBeInTheDocument();
  });

  it('renders empty state when no records are returned', async () => {
    (useProfile as any).mockReturnValue({ 
      activeProfile: { id: 'profile-123', name: 'John Doe' } 
    });
    
    // Mock onSnapshot to immediately return empty docs
    (firestore.onSnapshot as any).mockImplementation((query, callback) => {
      callback({ docs: [] });
      return vi.fn(); // return mock unsubscribe fn
    });

    render(<TimelinePage user={mockUser} />);
    
    await waitFor(() => {
      expect(screen.getByText('No records found')).toBeInTheDocument();
    });
  });
});
