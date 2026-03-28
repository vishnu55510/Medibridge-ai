import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import DashboardPage from './DashboardPage';
import { useProfile } from '../contexts/ProfileContext';
import { BrowserRouter } from 'react-router-dom';
import * as firestore from 'firebase/firestore';

// Mock ProfileContext
vi.mock('../contexts/ProfileContext', () => ({
  useProfile: vi.fn()
}));

// Mock Firestore
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    collection: vi.fn(),
    query: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    where: vi.fn(),
    onSnapshot: vi.fn()
  };
});

describe('DashboardPage', () => {
  const mockUser = { uid: 'user123' } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state when profile is loading', () => {
    (useProfile as any).mockReturnValue({ isLoading: true, activeProfile: null });
    const { container } = render(<BrowserRouter><DashboardPage user={mockUser} /></BrowserRouter>);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders welcome screen when no active profile exists', () => {
    (useProfile as any).mockReturnValue({ isLoading: false, activeProfile: null });
    render(<BrowserRouter><DashboardPage user={mockUser} /></BrowserRouter>);
    
    expect(screen.getByText('Welcome to MediBridge AI')).toBeInTheDocument();
    expect(screen.getByText('Create Profile')).toBeInTheDocument();
  });

  it('renders empty states for records and meds when lists are empty', async () => {
    (useProfile as any).mockReturnValue({ 
      isLoading: false, 
      activeProfile: { id: 'prof1', name: 'John Doe' } 
    });

    // Mock onSnapshot to immediately return empty docs
    (firestore.onSnapshot as any).mockImplementation((queryArgs: any, callback: any) => {
      callback({ docs: [] });
      return vi.fn(); // unsubscribe function
    });

    render(<BrowserRouter><DashboardPage user={mockUser} /></BrowserRouter>);

    await waitFor(() => {
      expect(screen.getByText('No records found.')).toBeInTheDocument();
      expect(screen.getByText('No active medications.')).toBeInTheDocument();
    });
  });

  it('renders records and medications successfully', async () => {
    (useProfile as any).mockReturnValue({ 
      isLoading: false, 
      activeProfile: { id: 'prof1', name: 'John Doe' } 
    });

    // Mock onSnapshot to return dummy data
    let callCount = 0;
    (firestore.onSnapshot as any).mockImplementation((queryArgs: any, callback: any) => {
      callCount++;
      if (callCount === 1) {
        // Records
        callback({ docs: [{ id: 'rec1', data: () => ({ type: 'Lab Report', date: '2023-01-01', doctor: 'Dr. Smith' }) }] });
      } else {
        // Meds
        callback({ docs: [{ id: 'med1', data: () => ({ name: 'Aspirin', dosage: '100mg', frequency: 'Daily' }) }] });
      }
      return vi.fn();
    });

    render(<BrowserRouter><DashboardPage user={mockUser} /></BrowserRouter>);

    await waitFor(() => {
      expect(screen.getByText('Lab Report')).toBeInTheDocument();
      expect(screen.getByText('Aspirin')).toBeInTheDocument();
    });
  });
});
