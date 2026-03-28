import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';

// Mock Firebase
vi.mock('./firebase', () => ({
  auth: {
    onAuthStateChanged: vi.fn((cb) => {
      cb({ uid: '123', email: 'test@test.com', displayName: 'Test User' });
      return vi.fn();
    }),
    signOut: vi.fn(),
  },
  db: {},
  handleFirestoreError: vi.fn(),
  OperationType: { GET: 'get', LIST: 'list', WRITE: 'write' }
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn((q, cb) => {
    cb({ docs: [] });
    return vi.fn();
  }),
  getDocs: vi.fn(() => Promise.resolve({ docs: [] })),
  addDoc: vi.fn(),
  serverTimestamp: vi.fn(),
}));

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class {
      models = {
        generateContent: vi.fn(() => Promise.resolve({ text: 'AI response' })),
      };
      chats = {
        create: vi.fn(),
      };
    }
  };
});

describe('Integration Flow', () => {
  it('navigates through the main application flow', async () => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    render(<App />);
    
    // Wait for Dashboard to load (since we mocked auth to be logged in)
    await waitFor(() => {
      expect(screen.getByText('MediBridge AI')).toBeInTheDocument();
    });

    // Verify Records tab is active
    expect(screen.getByRole('tab', { name: /Medical Records/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Upload Medical Record')).toBeInTheDocument();

    // Switch to Chat tab
    fireEvent.click(screen.getByRole('tab', { name: /Health Assistant/i }));
    
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /Health Assistant/i })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByText('MediBridge Assistant')).toBeInTheDocument();
    });

    // Send a message
    const input = screen.getByPlaceholderText(/Ask about your medications/i);
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(screen.getByRole('button', { name: /Send message/i }));

    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    // Navigate to Timeline (simulated via sidebar click if possible, or direct route)
    // Since we are mocking Layout, we can look for the Timeline link
    const timelineLink = screen.getByRole('link', { name: /Timeline/i });
    fireEvent.click(timelineLink);

    await waitFor(() => {
      expect(screen.getByText('Health Timeline')).toBeInTheDocument();
    });

    // Open Share Modal
    const shareBtn = screen.getByRole('button', { name: /Share Records/i });
    fireEvent.click(shareBtn);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Share Medical Records')).toBeInTheDocument();
    });
  });
});
