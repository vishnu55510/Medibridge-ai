import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { ShareLink, MedicalRecord } from '../types';
import { AuditLogger } from '../utils/AuditLogger';

export default function SharePage() {
  const { shareId } = useParams<{ shareId: string }>();
  const [shareData, setShareData] = useState<ShareLink | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSharedData = async () => {
      if (!shareId) return;
      
      try {
        const shareDoc = await getDoc(doc(db, 'shares', shareId));
        
        if (!shareDoc.exists()) {
          setError('Share link not found or has expired.');
          setLoading(false);
          return;
        }

        const data = shareDoc.data() as ShareLink;
        
        // Check expiry client-side as well
        const expiryDate = data.expiresAt?.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);
        if (expiryDate < new Date()) {
          setError('This share link has expired.');
          setLoading(false);
          return;
        }

        setShareData(data);
        
        // HIPAA Audit Log: Log access to shared data
        await AuditLogger.log(data.userId || 'anonymous_provider', 'SHARE_LINK_ACCESS', { 
          shareId, 
          profileId: data.profileId 
        });

        // Use the records embedded in the share document
        if (data.records) {
          setRecords(data.records);
        } else {
          setRecords([]);
        }
      } catch (err) {
        console.error("Error fetching shared data:", err);
        setError('Failed to load shared records.');
        handleFirestoreError(err, OperationType.GET, `shares/${shareId}`);
      } finally {
        setLoading(false);
      }
    };

    fetchSharedData();
  }, [shareId]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading shared records...</div>;
  }

  if (error || !shareData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h1 className="text-2xl font-bold text-slate-900">Shared Medical Records</h1>
          <p className="text-slate-500">This link will expire on {shareData.expiresAt?.toDate ? shareData.expiresAt.toDate().toLocaleString() : new Date(shareData.expiresAt).toLocaleString()}</p>
        </header>

        <div className="space-y-6">
          {records.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No records found.</p>
          ) : (
            records.map(record => (
              <div key={record.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{record.type}</h3>
                    <p className="text-sm text-slate-500">{record.date} • {record.doctor} • {record.hospital}</p>
                  </div>
                </div>
                <div className="prose prose-sm max-w-none">
                  <p className="font-medium text-slate-700">{record.summary}</p>
                  <div className="mt-4 p-4 bg-slate-50 rounded-lg overflow-x-auto text-xs font-mono text-slate-600">
                    <pre>{JSON.stringify(JSON.parse(record.extractedData || '{}'), null, 2)}</pre>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
