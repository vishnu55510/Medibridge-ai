import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuditLogger } from './AuditLogger';
import { addDoc, collection } from 'firebase/firestore';

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({ id: 'mock-coll' })),
  addDoc: vi.fn(),
  serverTimestamp: vi.fn(() => 'mock-timestamp'),
  getFirestore: vi.fn()
}));

vi.mock('../firebase', () => ({
  db: {}
}));

describe('AuditLogger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call addDoc with correct log data', async () => {
    const userId = 'user123';
    const action = 'TEST_ACTION';
    const details = { foo: 'bar' };

    await AuditLogger.log(userId, action, details);

    expect(collection).toHaveBeenCalled();
    expect(addDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      action,
      details,
      timestamp: 'mock-timestamp'
    }));
  });

  it('should not throw if Firestore fails', async () => {
    (addDoc as any).mockRejectedValueOnce(new Error('Firestore error'));
    
    await expect(AuditLogger.log('u', 'a')).resolves.not.toThrow();
  });
});
