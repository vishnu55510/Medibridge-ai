import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useProfile } from '../contexts/ProfileContext';
import { MedicalRecord, Medication } from '../types';
import { Link } from 'react-router-dom';
import { Activity, Pill, Clock, FileText, ChevronRight } from 'lucide-react';

/**
 * DashboardPage Component
 * 
 * The primary entry point for the application. Displays a high-level summary
 * of recent medical records, active medications, and quick actions.
 * Optimized with real-time listeners and skeleton loading states.
 * 
 * @param {DashboardPageProps} props - Component props containing the authenticated user.
 */
export default function DashboardPage({ user }: DashboardPageProps) {
  const { activeProfile, isLoading } = useProfile();
  const [recentRecords, setRecentRecords] = useState<MedicalRecord[]>([]);
  const [activeMeds, setActiveMeds] = useState<Medication[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!activeProfile) {
      setRecentRecords([]);
      setActiveMeds([]);
      setLoadingData(false);
      return;
    }

    setLoadingData(true);

    // Fetch recent records
    const recordsQuery = query(
      collection(db, 'users', user.uid, 'profiles', activeProfile.id, 'records'),
      orderBy('date', 'desc'),
      limit(3)
    );

    const unsubscribeRecords = onSnapshot(recordsQuery, (snapshot) => {
      const fetchedRecords = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MedicalRecord[];
      setRecentRecords(fetchedRecords);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/profiles/${activeProfile.id}/records`);
    });

    // Fetch active medications
    const medsQuery = query(
      collection(db, 'users', user.uid, 'profiles', activeProfile.id, 'medications'),
      where('active', '==', true),
      limit(3)
    );

    const unsubscribeMeds = onSnapshot(medsQuery, (snapshot) => {
      const fetchedMeds = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Medication[];
      setActiveMeds(fetchedMeds);
      setLoadingData(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/profiles/${activeProfile.id}/medications`);
      setLoadingData(false);
    });

    return () => {
      unsubscribeRecords();
      unsubscribeMeds();
    };
  }, [user.uid, activeProfile]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!activeProfile) {
    return (
      <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Activity className="w-8 h-8 text-indigo-600" aria-hidden="true" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Welcome to MediBridge AI</h2>
        <p className="text-slate-600 mb-8 max-w-md mx-auto">
          Your intelligent health companion. Create a profile to start managing your medical records, tracking medications, and getting AI-powered insights.
        </p>
        <Link 
          to="/profile" 
          className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-600"
        >
          Create Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Overview for {activeProfile.name}</p>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Records */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-indigo-500" aria-hidden="true" />
              Recent Records
            </h3>
            <Link to="/timeline" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-sm">
              View all <ChevronRight className="w-4 h-4 ml-1" aria-hidden="true" />
            </Link>
          </div>
          
          {loadingData ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-slate-100 rounded-lg"></div>
              ))}
            </div>
          ) : recentRecords.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-300">
              <p className="text-sm text-slate-500 mb-3">No records found.</p>
              <Link to="/upload" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                Upload your first record
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentRecords.map(record => (
                <div key={record.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-200">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center mr-3">
                      <FileText className="w-5 h-5 text-indigo-600" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{record.type}</p>
                      <p className="text-xs text-slate-500">{record.date} • {record.doctor || record.hospital || 'Unknown facility'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Active Medications */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 flex items-center">
                <Pill className="w-5 h-5 mr-2 text-green-500" aria-hidden="true" />
                Active Meds
              </h3>
              <Link to="/medications" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-sm">
                Manage <ChevronRight className="w-4 h-4 ml-1" aria-hidden="true" />
              </Link>
            </div>
            
            {loadingData ? (
              <div className="animate-pulse space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="h-12 bg-slate-100 rounded-lg"></div>
                ))}
              </div>
            ) : activeMeds.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No active medications.</p>
            ) : (
              <div className="space-y-3">
                {activeMeds.map(med => (
                  <div key={med.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{med.name}</p>
                      <p className="text-xs text-slate-500">{med.dosage}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-indigo-600 flex items-center">
                        <Clock className="w-3 h-3 mr-1" aria-hidden="true" />
                        {med.frequency}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link 
                to="/upload" 
                className="block w-full text-center px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-600"
              >
                Upload New Record
              </Link>
              <Link 
                to="/chat" 
                className="block w-full text-center px-4 py-2.5 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-600"
              >
                Ask AI Assistant
              </Link>
              <Link 
                to="/emergency" 
                className="block w-full text-center px-4 py-2.5 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors mt-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-600"
              >
                Emergency Info
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
