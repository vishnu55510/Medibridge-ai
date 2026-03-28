import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MedicationsPage from './MedicationsPage';
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
    orderBy: vi.fn(),
    where: vi.fn(),
    limit: vi.fn(),
    doc: vi.fn(),
    updateDoc: vi.fn(),
    onSnapshot: vi.fn(),
    addDoc: vi.fn(),
    serverTimestamp: vi.fn()
  };
});

describe('MedicationsPage', () => {
  const mockUser = { uid: 'u1' } as any;

  beforeEach(() => {
    (useProfile as any).mockReturnValue({
      activeProfile: { id: 'p1', name: 'John Doe' }
    });
  });

  it('shows active medications list', async () => {
    (firestore.onSnapshot as any).mockImplementation((q: any, cb: any) => {
      cb({ docs: [{ id: 'm1', data: () => ({ name: 'Advil', active: true, dosage: '200mg' }) }] });
      return vi.fn();
    });

    render(<MedicationsPage user={mockUser} />);
    
    await waitFor(() => {
      expect(screen.getByText('Advil')).toBeInTheDocument();
      expect(screen.getByText('Active Medications (1)')).toBeInTheDocument();
    });
  });

  it('opens add medication form', async () => {
    (firestore.onSnapshot as any).mockImplementation((q: any, cb: any) => {
      cb({ docs: [] });
      return vi.fn();
    });

    render(<MedicationsPage user={mockUser} />);
    
    const addBtn = screen.getByText('Add Medication');
    fireEvent.click(addBtn);
    
    expect(screen.getByText('Add New Medication')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. Lisinopril')).toBeInTheDocument();
  });
});
