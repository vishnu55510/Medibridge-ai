import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useProfile } from '../contexts/ProfileContext';
import { Medication } from '../types';
import { AlertTriangle, Pill, Phone, User as UserIcon } from 'lucide-react';

/**
 * EmergencyPage Component
 * 
 * Provides a high-visibility, read-only summary of critical patient information
 * (Blood Type, Allergies, Medications) designed for emergency first responders.
 * 
 * @param {EmergencyPageProps} props - Component props containing the authenticated user.
 */
export default function EmergencyPage({ user }: EmergencyPageProps) {
  const { activeProfile } = useProfile();
  const [activeMeds, setActiveMeds] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeProfile) return;

    const fetchActiveMeds = async () => {
      try {
        const q = query(
          collection(db, 'users', user.uid, 'profiles', activeProfile.id, 'medications'),
          where('active', '==', true)
        );
        const snapshot = await getDocs(q);
        const meds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Medication[];
        setActiveMeds(meds);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/profiles/${activeProfile.id}/medications`);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveMeds();
  }, [user.uid, activeProfile]);

  if (!activeProfile) return <div>Please select a profile.</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <header className="bg-red-600 text-white p-6 rounded-2xl shadow-lg flex items-center gap-4">
        <div className="bg-white/20 p-3 rounded-full">
          <AlertTriangle className="w-10 h-10 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-1">MEDICAL EMERGENCY</h1>
          <p className="text-red-100 font-medium text-lg">Patient: {activeProfile.name}</p>
        </div>
      </header>
      
      <div className="bg-white rounded-2xl shadow-sm border-2 border-red-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-slate-500" />
            Vital Information
          </h2>
        </div>
        <div className="p-6 grid grid-cols-2 gap-6">
          <div className="bg-red-50 p-4 rounded-xl border border-red-100">
            <span className="text-red-800 font-semibold block mb-1 text-sm uppercase tracking-wider">Blood Type</span>
            <span className="text-3xl font-bold text-red-600">{activeProfile.bloodType || 'Unknown'}</span>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-semibold block mb-1 text-sm uppercase tracking-wider">Date of Birth</span>
            <span className="text-xl font-bold text-slate-800">{activeProfile.dateOfBirth || 'Unknown'}</span>
          </div>
        </div>
        
        <div className="p-6 border-t border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Allergies & Alerts
          </h2>
          {activeProfile.allergies && activeProfile.allergies.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {activeProfile.allergies.map((allergy, i) => (
                <span key={i} className="px-4 py-2 bg-red-100 text-red-800 font-bold rounded-lg border border-red-200">
                  {allergy}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 italic bg-slate-50 p-4 rounded-xl">No known allergies recorded.</p>
          )}
        </div>

        <div className="p-6 border-t border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Pill className="w-5 h-5 text-indigo-500" />
            Current Medications
          </h2>
          {loading ? (
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              </div>
            </div>
          ) : activeMeds.length > 0 ? (
            <ul className="space-y-3">
              {activeMeds.map((med) => (
                <li key={med.id} className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-indigo-900">{med.name}</p>
                    <p className="text-sm text-indigo-700">{med.dosage} • {med.frequency}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 italic bg-slate-50 p-4 rounded-xl">No active medications recorded.</p>
          )}
        </div>
      </div>
    </div>
  );
}
