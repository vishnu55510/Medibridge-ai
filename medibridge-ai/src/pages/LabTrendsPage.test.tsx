import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LabTrendsPage from './LabTrendsPage';
import { useProfile } from '../contexts/ProfileContext';
import * as firestore from 'firebase/firestore';

vi.mock('../contexts/ProfileContext', () => ({
  useProfile: vi.fn()
}));

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    doc: vi.fn(),
    updateDoc: vi.fn(),
    onSnapshot: vi.fn()
  };
});

// Mock Recharts to avoid issues in test environment
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  LineChart: ({ children }: any) => <div>{children}</div>,
  Line: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />
}));

describe('LabTrendsPage', () => {
  const mockUser = { uid: 'u1' } as any;

  it('renders insights generation button when records exist', async () => {
    (useProfile as any).mockReturnValue({
      activeProfile: { id: 'p1', name: 'John Doe' }
    });

    (firestore.onSnapshot as any).mockImplementation((q: any, cb: any) => {
      cb({ docs: [{ id: '1', data: () => ({ type: 'Lab Report', date: '2023-01-01', summary: 'Normal' }) }] });
      return vi.fn();
    });

    render(<LabTrendsPage user={mockUser} />);
    
    expect(screen.getByText('Generate Insights')).toBeInTheDocument();
  });

  it('shows empty state when no lab reports are found', async () => {
    (useProfile as any).mockReturnValue({
      activeProfile: { id: 'p1', name: 'John Doe' }
    });

    (firestore.onSnapshot as any).mockImplementation((q: any, cb: any) => {
      cb({ docs: [] });
      return vi.fn();
    });

    render(<LabTrendsPage user={mockUser} />);
    
    await waitFor(() => {
      expect(screen.getByText('No lab reports found')).toBeInTheDocument();
    });
  });
});
