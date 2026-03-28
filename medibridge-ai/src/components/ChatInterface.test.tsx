import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ChatInterface from './ChatInterface';

vi.mock('../firebase', () => ({
  auth: {},
  db: {},
  handleFirestoreError: vi.fn(),
  OperationType: { GET: 'get' }
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  getDocs: vi.fn(() => Promise.resolve({ docs: [] })),
}));

const { mockGenerateContent } = vi.hoisted(() => {
  return { mockGenerateContent: vi.fn(() => Promise.resolve({ text: 'AI response' })) };
});

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class {
      models = {
        generateContent: mockGenerateContent,
      };
      chats = {
        create: vi.fn(),
      };
    }
  };
});

describe('ChatInterface Component', () => {
  const mockUser = { uid: '123', email: 'test@test.com' } as any;

  beforeEach(() => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    vi.clearAllMocks();
    mockGenerateContent.mockReset();
    mockGenerateContent.mockImplementation(() => Promise.resolve({ text: 'AI response' }));
  });

  it('renders correctly', async () => {
    render(<ChatInterface user={mockUser} profileId="profile1" />);
    await waitFor(() => {
      expect(screen.getByText('Health Assistant')).toBeInTheDocument();
      expect(screen.getByText(/Hello! I'm your personal health assistant/i)).toBeInTheDocument();
    });
  });

  it('allows sending a message', async () => {
    render(<ChatInterface user={mockUser} profileId="profile1" />);
    
    const input = screen.getByPlaceholderText(/Ask about your medical records/i);
    fireEvent.change(input, { target: { value: 'What is my blood pressure?' } });
    
    const sendButton = screen.getByRole('button', { name: /Send message/i });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(screen.getByText('What is my blood pressure?')).toBeInTheDocument();
    });
  });

  it('disables send button when input is empty', async () => {
    render(<ChatInterface user={mockUser} profileId="profile1" />);
    await waitFor(() => {
      const sendButton = screen.getByRole('button', { name: /Send message/i });
      expect(sendButton).toBeDisabled();
    });
  });

  it('handles API errors gracefully', async () => {
    mockGenerateContent.mockRejectedValueOnce(new Error('API Error'));

    render(<ChatInterface user={mockUser} profileId="profile1" />);
    
    await waitFor(() => {
      expect(screen.getByText(/Hello! I'm your personal health assistant/i)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/Ask about your medical records/i);
    fireEvent.change(input, { target: { value: 'Test error' } });
    fireEvent.click(screen.getByRole('button', { name: /Send message/i }));

    await waitFor(() => {
      expect(screen.getByText(/I encountered an error while trying to process your request/i)).toBeInTheDocument();
    });
  });
});