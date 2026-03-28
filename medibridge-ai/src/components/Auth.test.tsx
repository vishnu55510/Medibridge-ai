import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Auth from './Auth';
import { signInWithPopup } from 'firebase/auth';

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
}));

vi.mock('../firebase', () => ({
  auth: {},
  db: {},
  handleFirestoreError: vi.fn(),
  OperationType: { WRITE: 'write' }
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(() => Promise.resolve({ exists: () => true })),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn(),
  serverTimestamp: vi.fn(),
}));

describe('Auth Component', () => {
  it('renders correctly', () => {
    render(<Auth />);
    expect(screen.getByText('MediBridge AI')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
  });

  it('calls signInWithPopup on button click', async () => {
    (signInWithPopup as any).mockResolvedValueOnce({
      user: { uid: '123', email: 'test@test.com', displayName: 'Test User' }
    });
    
    render(<Auth />);
    const button = screen.getByRole('button', { name: /sign in with google/i });
    fireEvent.click(button);
    
    expect(signInWithPopup).toHaveBeenCalled();
  });
});