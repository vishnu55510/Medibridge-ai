import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * AuditLogger Utility
 * 
 * Provides centralized logging for sensitive security and compliance actions.
 * Requirements: HIPAA/GDPR Audit Trails.
 */
export const AuditLogger = {
  /**
   * Logs a security or data access event to Firestore.
   * 
   * @param userId - The ID of the user performing the action.
   * @param action - A descriptive name of the action (e.g., 'RECORD_VIEW', 'DATA_EXPORT').
   * @param details - Additional context or metadata about the event.
   */
  log: async (userId: string, action: string, details: Record<string, any> = {}) => {
    try {
      const auditRef = collection(db, 'users', userId, 'audit_logs');
      await addDoc(auditRef, {
        action,
        details,
        timestamp: serverTimestamp(),
        userAgent: navigator.userAgent,
        platform: navigator.platform
      });
    } catch (error) {
      // We don't throw here to avoid blocking the main UI flow if logging fails,
      // but in a production app, you might want to retry or alert.
      console.error('Audit Log failed:', error);
    }
  }
};
