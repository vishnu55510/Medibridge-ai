import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UploadRecord from './UploadRecord';

vi.mock('../firebase', () => ({
  auth: {},
  db: {},
  handleFirestoreError: vi.fn(),
  OperationType: { WRITE: 'write' }
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn(),
  serverTimestamp: vi.fn(),
}));

const { mockGenerateContent } = vi.hoisted(() => {
  return { mockGenerateContent: vi.fn(() => Promise.resolve({ text: '{"type": "prescription"}' })) };
});

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class {
      models = {
        generateContent: mockGenerateContent,
      };
    }
  };
});

describe('UploadRecord Component', () => {
  const mockUser = { uid: '123', email: 'test@test.com' } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateContent.mockReset();
    mockGenerateContent.mockImplementation(() => Promise.resolve({ text: '{"type": "prescription"}' }));
  });

  it('renders correctly', () => {
    render(<UploadRecord user={mockUser} profileId="profile1" />);
    expect(screen.getByText('Upload Medical Record')).toBeInTheDocument();
    expect(screen.getByText(/Drag & drop a file here/i)).toBeInTheDocument();
  });

  it('handles upload errors gracefully', async () => {
    mockGenerateContent.mockRejectedValueOnce(new Error('Gemini API Error'));

    render(<UploadRecord user={mockUser} profileId="profile1" />);
    
    const input = screen.getByLabelText('File upload input');
    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
    
    Object.defineProperty(input, 'files', { value: [file] });
    fireEvent.change(input);

    await waitFor(() => {
      const errorElement = screen.getByRole('alert');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveTextContent(/Failed to process document/i);
    });
  });
});