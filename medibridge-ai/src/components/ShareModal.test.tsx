import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ShareModal from './ShareModal';
import * as firestore from 'firebase/firestore';

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    addDoc: vi.fn(),
    collection: vi.fn(),
    serverTimestamp: vi.fn()
  };
});

describe('ShareModal', () => {
  const mockUser = { uid: 'user123' } as any;
  const mockRecords: any[] = [
    { id: '1', type: 'Lab Report', date: '2023-01-01', doctor: 'Dr. A' },
    { id: '2', type: 'Prescription', date: '2023-02-01', doctor: 'Dr. B' }
  ];
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with no records available', () => {
    render(
      <ShareModal user={mockUser} profileId="prof1" records={[]} onClose={mockOnClose} />
    );
    expect(screen.getByText('No records available to share.')).toBeInTheDocument();
  });

  it('disables "Generate Link" button when no records are selected', () => {
    render(
      <ShareModal user={mockUser} profileId="prof1" records={mockRecords} onClose={mockOnClose} />
    );
    const generateBtn = screen.getByRole('button', { name: /Generate Link/i });
    expect(generateBtn).toBeDisabled();
  });

  it('enables "Generate Link" when at least one record is selected', async () => {
    const user = userEvent.setup();
    render(
      <ShareModal user={mockUser} profileId="prof1" records={mockRecords} onClose={mockOnClose} />
    );
    
    // Select first record
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);
    
    const generateBtn = screen.getByRole('button', { name: /Generate Link/i });
    expect(generateBtn).not.toBeDisabled();
  });

  it('selects and deselects all records', async () => {
    const user = userEvent.setup();
    render(
      <ShareModal user={mockUser} profileId="prof1" records={mockRecords} onClose={mockOnClose} />
    );
    
    const selectAllBtn = screen.getByText('Select All');
    await user.click(selectAllBtn);
    
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach(cb => expect(cb).toBeChecked());
    
    await user.click(screen.getByText('Deselect All'));
    checkboxes.forEach(cb => expect(cb).not.toBeChecked());
  });
});
