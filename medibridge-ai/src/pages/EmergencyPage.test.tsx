import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import EmergencyPage from './EmergencyPage';
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
    getDocs: vi.fn()
  };
});

describe('EmergencyPage', () => {
  const mockUser = { uid: 'u1' } as any;

  it('renders critical patient information from profile', async () => {
    (useProfile as any).mockReturnValue({
      activeProfile: { 
        id: 'p1', 
        name: 'John Doe', 
        bloodType: 'O+', 
        allergies: ['Peanuts'] 
      }
    });

    (firestore.getDocs as any).mockResolvedValue({
      docs: [{ id: 'm1', data: () => ({ name: 'EpiPen', active: true, dosage: '0.3mg', frequency: 'Emergency' }) }]
    });

    render(<EmergencyPage user={mockUser} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('O+')).toBeInTheDocument();
    expect(screen.getByText('Peanuts')).toBeInTheDocument();
    expect(screen.getByText('EpiPen')).toBeInTheDocument();
  });
});
