import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';

// Mock Firebase
vi.mock('./firebase', () => ({
  auth: {
    onAuthStateChanged: vi.fn((cb) => {
      // Simulate unauthenticated state
      cb(null);
      return vi.fn(); // unsubscribe function
    }),
  },
  db: {},
  handleFirestoreError: vi.fn(),
  OperationType: {
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete',
    LIST: 'list',
    GET: 'get',
    WRITE: 'write',
  }
}));

describe('App Component', () => {
  it('renders the Auth component when unauthenticated', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText(/MediBridge AI/i)).toBeInTheDocument();
      expect(screen.getByText(/Sign in with Google/i)).toBeInTheDocument();
    });
  });
});