import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useProfile } from '../contexts/ProfileContext';
import { MedicalRecord } from '../types';
import { FileText, Activity, Pill, Calendar, Filter, Share2 } from 'lucide-react';
import ShareModal from '../components/ShareModal';

interface TimelinePageProps {
  user: User;
}

export default function TimelinePage({ user }: TimelinePageProps) {
  const { activeProfile } = useProfile();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    if (!activeProfile) {
      setRecords([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'users', user.uid, 'profiles', activeProfile.id, 'records'),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedRecords = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MedicalRecord[];
      setRecords(fetchedRecords);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/profiles/${activeProfile.id}/records`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user.uid, activeProfile]);

  if (!activeProfile) return <div>Please select a profile.</div>;

  const filteredRecords = records.filter(record => {
    if (filter === 'all') return true;
    return record.type.toLowerCase() === filter.toLowerCase();
  });

  const getIconForType = (type: string) => {
    switch (type.toLowerCase()) {
      case 'lab report': return <Activity className="w-5 h-5 text-blue-500" />;
      case 'prescription': return <Pill className="w-5 h-5 text-green-500" />;
      case 'visit summary': return <Calendar className="w-5 h-5 text-purple-500" />;
      default: return <FileText className="w-5 h-5 text-indigo-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Health Timeline</h1>
          <p className="text-slate-500">Chronological history for {activeProfile.name}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors font-medium text-sm border border-indigo-200"
          >
            <Share2 className="w-4 h-4" />
            Share Records
          </button>
          <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
            <Filter className="w-4 h-4 text-slate-400 ml-2" />
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border-none text-sm focus:ring-0 bg-transparent py-1.5 pl-2 pr-8 text-slate-700 font-medium cursor-pointer"
            >
              <option value="all">All Records</option>
              <option value="lab report">Lab Reports</option>
              <option value="prescription">Prescriptions</option>
              <option value="visit summary">Visit Summaries</option>
            </select>
          </div>
        </div>
      </header>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No records found</h3>
          <p className="text-slate-500">
            {filter === 'all' 
              ? "You haven't uploaded any medical records yet." 
              : `No records match the "${filter}" filter.`}
          </p>
        </div>
      ) : (
        <div className="relative border-l-2 border-slate-200 ml-4 md:ml-6 space-y-8 pb-8">
          {filteredRecords.map((record, index) => (
            <div key={record.id} className="relative pl-8 md:pl-10">
              {/* Timeline dot */}
              <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-indigo-500 shadow-sm"></div>
              
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 rounded-lg">
                      {getIconForType(record.type)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{record.type}</h3>
                      <p className="text-sm font-medium text-indigo-600">{record.date}</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 mb-4 text-sm">
                  {record.doctor && (
                    <div className="flex items-center text-slate-600">
                      <span className="font-medium mr-2">Doctor:</span> {record.doctor}
                    </div>
                  )}
                  {record.hospital && (
                    <div className="flex items-center text-slate-600">
                      <span className="font-medium mr-2">Facility:</span> {record.hospital}
                    </div>
                  )}
                </div>
                
                <div className="prose prose-sm max-w-none text-slate-700 bg-slate-50 p-4 rounded-lg">
                  <p>{record.summary}</p>
                </div>
                
                {record.extractedData && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <details className="group">
                      <summary className="text-sm font-medium text-indigo-600 cursor-pointer hover:text-indigo-700 list-none flex items-center">
                        <span className="mr-2">View Extracted Data</span>
                        <svg className="w-4 h-4 transform group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="mt-3 p-4 bg-slate-900 rounded-lg overflow-x-auto">
                        <pre className="text-xs text-green-400 font-mono">
                          {JSON.stringify(JSON.parse(record.extractedData), null, 2)}
                        </pre>
                      </div>
                    </details>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isShareModalOpen && (
        <ShareModal 
          user={user} 
          profileId={activeProfile.id} 
          records={records} 
          onClose={() => setIsShareModalOpen(false)} 
        />
      )}
    </div>
  );
}
