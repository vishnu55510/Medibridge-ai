import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { FileText, Calendar, User as UserIcon, Activity } from 'lucide-react';

interface RecordListProps {
  user: User;
}

interface MedicalRecord {
  id: string;
  type: string;
  date: string;
  doctorName: string;
  summary: string;
  extractedData: string;
  createdAt: any;
}

export default function RecordList({ user }: RecordListProps) {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'users', user.uid, 'records'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const recordsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MedicalRecord[];
      setRecords(recordsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/records`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user.uid]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center">
        <div className="mx-auto h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <FileText className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-2">No records found</h3>
        <p className="text-slate-500">
          Upload your first medical record to start building your health profile.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
        <Activity className="h-5 w-5 text-indigo-600" />
        Your Health History
      </h2>
      
      <div className="space-y-4">
        {records.map((record) => (
          <div key={record.id} className="border border-slate-200 rounded-lg p-4 hover:border-indigo-300 transition-colors bg-slate-50">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 capitalize">
                  {record.type.replace('_', ' ')}
                </span>
                <span className="text-sm text-slate-500 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {record.date}
                </span>
              </div>
              <span className="text-sm text-slate-600 flex items-center gap-1">
                <UserIcon className="h-3 w-3" />
                {record.doctorName}
              </span>
            </div>
            
            <p className="text-slate-800 font-medium mb-2">{record.summary}</p>
            
            <div className="mt-3 bg-white p-3 rounded border border-slate-200 text-sm font-mono text-slate-600 overflow-x-auto">
              <pre>{JSON.stringify(JSON.parse(record.extractedData), null, 2)}</pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
