import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useProfile } from '../contexts/ProfileContext';
import { Medication } from '../types';
import { Pill, Clock, Calendar, Check, X, Plus, Trash2 } from 'lucide-react';

interface MedicationsPageProps {
  user: User;
}

export default function MedicationsPage({ user }: MedicationsPageProps) {
  const { activeProfile } = useProfile();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    frequency: '',
    schedule: ''
  });

  useEffect(() => {
    if (!activeProfile) {
      setMedications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'users', user.uid, 'profiles', activeProfile.id, 'medications')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMeds = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Medication[];
      setMedications(fetchedMeds);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/profiles/${activeProfile.id}/medications`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user.uid, activeProfile]);

  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProfile) return;

    try {
      await addDoc(collection(db, 'users', user.uid, 'profiles', activeProfile.id, 'medications'), {
        ...formData,
        active: true,
        createdAt: serverTimestamp()
      });
      
      // Add notification
      await addDoc(collection(db, 'users', user.uid, 'notifications'), {
        userId: user.uid,
        title: 'Medication Added',
        body: `Added ${formData.name} to your medications list.`,
        read: false,
        createdAt: serverTimestamp(),
        type: 'medication'
      });

      setIsAdding(false);
      setFormData({ name: '', dosage: '', frequency: '', schedule: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/profiles/${activeProfile.id}/medications`);
    }
  };

  const toggleMedicationStatus = async (medId: string, currentStatus: boolean) => {
    if (!activeProfile) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'profiles', activeProfile.id, 'medications', medId), {
        active: !currentStatus
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/profiles/${activeProfile.id}/medications/${medId}`);
    }
  };

  const deleteMedication = async (medId: string) => {
    if (!activeProfile) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'profiles', activeProfile.id, 'medications', medId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/profiles/${activeProfile.id}/medications/${medId}`);
    }
  };

  if (!activeProfile) return <div>Please select a profile.</div>;

  const activeMeds = medications.filter(m => m.active);
  const inactiveMeds = medications.filter(m => !m.active);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Medications</h1>
          <p className="text-slate-500">Track prescriptions for {activeProfile.name}</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Medication
        </button>
      </header>
      
      {isAdding && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
          <h2 className="text-lg font-semibold mb-4">Add New Medication</h2>
          <form onSubmit={handleAddMedication} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Medication Name *</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Lisinopril"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Dosage *</label>
                <input 
                  required
                  type="text" 
                  value={formData.dosage}
                  onChange={e => setFormData({...formData, dosage: e.target.value})}
                  placeholder="e.g. 10mg"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Frequency *</label>
                <input 
                  required
                  type="text" 
                  value={formData.frequency}
                  onChange={e => setFormData({...formData, frequency: e.target.value})}
                  placeholder="e.g. Twice daily"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Schedule/Time</label>
                <input 
                  type="text" 
                  value={formData.schedule}
                  onChange={e => setFormData({...formData, schedule: e.target.value})}
                  placeholder="e.g. 8:00 AM, 8:00 PM"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button 
                type="button" 
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Save Medication
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active Medications */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
              Active Medications ({activeMeds.length})
            </h2>
            
            {activeMeds.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
                <p className="text-slate-500">No active medications.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeMeds.map(med => (
                  <div key={med.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:border-indigo-300 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center">
                        <div className="p-2 bg-indigo-50 rounded-lg mr-3">
                          <Pill className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">{med.name}</h3>
                          <p className="text-sm font-medium text-indigo-600">{med.dosage}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => toggleMedicationStatus(med.id, med.active)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                          title="Mark as inactive"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => deleteMedication(med.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mt-4 pt-4 border-t border-slate-100 text-sm text-slate-600">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-slate-400" />
                        <span>{med.frequency}</span>
                      </div>
                      {med.schedule && (
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                          <span>{med.schedule}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Inactive Medications */}
          {inactiveMeds.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                <span className="w-2 h-2 rounded-full bg-slate-400 mr-2"></span>
                Past Medications ({inactiveMeds.length})
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-75">
                {inactiveMeds.map(med => (
                  <div key={med.id} className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center">
                        <div className="p-2 bg-slate-200 rounded-lg mr-3">
                          <Pill className="w-5 h-5 text-slate-500" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-700 line-through">{med.name}</h3>
                          <p className="text-sm font-medium text-slate-500">{med.dosage}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => toggleMedicationStatus(med.id, med.active)}
                          className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                          title="Mark as active"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => deleteMedication(med.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
