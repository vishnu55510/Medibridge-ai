import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { MedicalRecord } from '../types';
import { X, Copy, Check, Link as LinkIcon, Loader2 } from 'lucide-react';
import { AuditLogger } from '../utils/AuditLogger';

interface ShareModalProps {
  user: User;
  profileId: string;
  records: MedicalRecord[];
  onClose: () => void;
}

export default function ShareModal({ user, profileId, records, onClose }: ShareModalProps) {
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [expiryDays, setExpiryDays] = useState(7);
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const toggleRecord = (id: string) => {
    const newSet = new Set(selectedRecords);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedRecords(newSet);
  };

  const selectAll = () => {
    if (selectedRecords.size === records.length) {
      setSelectedRecords(new Set());
    } else {
      setSelectedRecords(new Set(records.map(r => r.id)));
    }
  };

  const generateLink = async () => {
    if (selectedRecords.size === 0) return;
    
    setIsGenerating(true);
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiryDays);

      const selectedRecordsData = records.filter(r => selectedRecords.has(r.id));

      const shareDoc = await addDoc(collection(db, 'shares'), {
        userId: user.uid,
        profileId,
        records: selectedRecordsData,
        createdAt: serverTimestamp(),
        expiresAt: expiresAt,
      });
      
      // HIPAA Audit Log
      await AuditLogger.log(user.uid, 'SHARE_LINK_CREATE', { 
        profileId, 
        shareId: shareDoc.id, 
        recordCount: selectedRecords.size 
      });

      const url = `${window.location.origin}/share/${shareDoc.id}`;
      setShareLink(url);
    } catch (error) {
      console.error("Error generating share link:", error);
      handleFirestoreError(error, OperationType.WRITE, 'shares');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="share-modal-title"
        className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden"
      >
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 id="share-modal-title" className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-indigo-600" aria-hidden="true" />
            Share Medical Records
          </h2>
          <button 
            aria-label="Close share modal"
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {shareLink ? (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Link Generated!</h3>
                <p className="text-slate-500 mb-6">This link will expire in {expiryDays} days.</p>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <input 
                  type="text" 
                  readOnly 
                  value={shareLink} 
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-slate-700 truncate"
                />
                <button 
                  onClick={copyToClipboard}
                  className="p-2 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors flex-shrink-0"
                  aria-label="Copy link"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-slate-900">Select records to share</h3>
                  <button 
                    onClick={selectAll}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    {selectedRecords.size === records.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                
                {records.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4 bg-slate-50 rounded-lg border border-slate-200">
                    No records available to share.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {records.map(record => (
                      <label 
                        key={record.id} 
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedRecords.has(record.id) ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input 
                          type="checkbox" 
                          checked={selectedRecords.has(record.id)}
                          onChange={() => toggleRecord(record.id)}
                          className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        />
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{record.type}</p>
                          <p className="text-xs text-slate-500">{record.date} • {record.doctor}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Link Expiry</label>
                <select 
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value={1}>1 Day</option>
                  <option value={3}>3 Days</option>
                  <option value={7}>7 Days</option>
                  <option value={14}>14 Days</option>
                  <option value={30}>30 Days</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          {shareLink ? (
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium w-full"
            >
              Done
            </button>
          ) : (
            <>
              <button 
                onClick={onClose}
                className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={generateLink}
                disabled={selectedRecords.size === 0 || isGenerating}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
              >
                {isGenerating && <Loader2 className="w-4 h-4 animate-spin" />}
                Generate Link
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
