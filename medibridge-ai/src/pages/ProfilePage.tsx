import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, deleteDoc, doc, getDocs, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useProfile } from '../contexts/ProfileContext';
import { UserProfile } from '../types';
import { AuditLogger } from '../utils/AuditLogger';
import { Trash2, Download, ShieldCheck, AlertTriangle } from 'lucide-react';

interface ProfilePageProps {
  user: User;
}

/**
 * ProfilePage Component
 * 
 * Manages health profiles for the user and their family members.
 * Supports creating new profiles and switching between active profiles
 * for context-specific data views. Includes HIPAA/GDPR compliance features.
 * 
 * @param {ProfilePageProps} props - Component props containing the authenticated user.
 */
export default function ProfilePage({ user }: ProfilePageProps) {
  const { profiles, activeProfile, setActiveProfile } = useProfile();
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    relationship: 'Self',
    dateOfBirth: '',
    bloodType: '',
    allergies: '',
    hipaaConsent: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.hipaaConsent) {
      alert("You must provide consent for data processing under HIPAA/GDPR guidelines.");
      return;
    }

    try {
      const allergiesList = formData.allergies
        .split(',')
        .map(a => a.trim())
        .filter(a => a.length > 0);

      const newProfile = {
        name: formData.name,
        relationship: formData.relationship,
        dateOfBirth: formData.dateOfBirth,
        bloodType: formData.bloodType,
        allergies: allergiesList,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'users', user.uid, 'profiles'), newProfile);
      
      // HIPAA Audit Log
      await AuditLogger.log(user.uid, 'PROFILE_CREATE', { 
        profileId: docRef.id, 
        relationship: formData.relationship 
      });

      setIsCreating(false);
      setFormData({ 
        name: '', 
        relationship: 'Self', 
        dateOfBirth: '', 
        bloodType: '', 
        allergies: '', 
        hipaaConsent: false 
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/profiles`);
    }
  };

  const handleExportData = async () => {
    try {
      const exportData: any = { 
        userEmail: user.email, 
        exportedAt: new Date().toISOString(), 
        profiles: [] 
      };
      
      for (const profile of profiles) {
        const recordsSnap = await getDocs(collection(db, 'users', user.uid, 'profiles', profile.id, 'records'));
        const medicationsSnap = await getDocs(collection(db, 'users', user.uid, 'profiles', profile.id, 'medications'));
        
        exportData.profiles.push({
          ...profile,
          records: recordsSnap.docs.map(d => d.data()),
          medications: medicationsSnap.docs.map(d => d.data())
        });
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `medbridge-data-export-${new Date().toISOString().split('T')[0]}.json`;
      link.click();

      await AuditLogger.log(user.uid, 'GDPR_DATA_EXPORT', { profileCount: profiles.length });
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export data. Please try again.");
    }
  };

  const handleDeleteAllData = async () => {
    if (!window.confirm("CRITICAL: This will permanently delete all your medical records and profiles for ALL family members. This cannot be undone. Proceed?")) return;
    
    setIsDeleting(true);
    try {
      const batch = writeBatch(db);
      
      // Delete user doc
      batch.delete(doc(db, 'users', user.uid));
      
      // Delete profiles and sub-collections (manual in Firestore)
      for (const profile of profiles) {
        const recordsSnap = await getDocs(collection(db, 'users', user.uid, 'profiles', profile.id, 'records'));
        recordsSnap.docs.forEach(d => batch.delete(d.ref));
        
        const medicationsSnap = await getDocs(collection(db, 'users', user.uid, 'profiles', profile.id, 'medications'));
        medicationsSnap.docs.forEach(d => batch.delete(d.ref));
        
        batch.delete(doc(db, 'users', user.uid, 'profiles', profile.id));
      }

      await batch.commit();
      await AuditLogger.log(user.uid, 'GDPR_RIGHT_TO_ERASURE', { profilesDeleted: profiles.length });
      
      alert("All data has been successfully deleted.");
      window.location.reload();
    } catch (error) {
      console.error("Deletion failed:", error);
      alert("Failed to delete all data. Some records may remain.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Profiles</h1>
          <p className="text-slate-500">Manage family health profiles</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Add Profile
        </button>
      </header>

      {isCreating && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold mb-4">Create New Profile</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Relationship *</label>
                <select 
                  required
                  value={formData.relationship}
                  onChange={e => setFormData({...formData, relationship: e.target.value})}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="Self">Self</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Child">Child</option>
                  <option value="Parent">Parent</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                <input 
                  type="date" 
                  value={formData.dateOfBirth}
                  onChange={e => setFormData({...formData, dateOfBirth: e.target.value})}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Blood Type</label>
                <select 
                  value={formData.bloodType}
                  onChange={e => setFormData({...formData, bloodType: e.target.value})}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Unknown</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Allergies (comma separated)</label>
                <input 
                  type="text" 
		  value={formData.allergies}
                  onChange={e => setFormData({...formData, allergies: e.target.value})}
                  placeholder="e.g. Peanuts, Penicillin"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-start gap-3 cursor-pointer p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <input 
                    type="checkbox"
                    required
                    checked={formData.hipaaConsent}
                    onChange={e => setFormData({...formData, hipaaConsent: e.target.checked})}
                    className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                  />
                  <span className="text-xs text-slate-600 leading-relaxed">
                    I acknowledge that MediBridge AI stores and processes medical data. I consent to the processing of this health information for the purpose of health tracking and AI analysis in accordance with HIPAA and GDPR guidelines.
                  </span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button 
                type="button" 
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Save Profile
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles.map(profile => (
          <div 
            key={profile.id} 
            className={`bg-white p-6 rounded-xl shadow-sm border-2 transition-colors cursor-pointer ${
              activeProfile?.id === profile.id ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-200 hover:border-indigo-300'
            }`}
            onClick={() => setActiveProfile(profile)}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{profile.name}</h3>
                <span className="inline-block px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full font-medium mt-1">
                  {profile.relationship}
                </span>
              </div>
              {activeProfile?.id === profile.id && (
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                </span>
              )}
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              <p><span className="font-medium">DOB:</span> {profile.dateOfBirth || 'Not set'}</p>
              <p><span className="font-medium">Blood:</span> {profile.bloodType || 'Not set'}</p>
              <p className="truncate"><span className="font-medium">Allergies:</span> {profile.allergies?.join(', ') || 'None'}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Compliance & Data Rights Section */}
      <section className="pt-8 border-t border-slate-200" aria-labelledby="data-rights-heading">
        <h2 id="data-rights-heading" className="text-lg font-bold text-slate-900 mb-4 flex items-center">
          <ShieldCheck className="w-5 h-5 mr-2 text-indigo-600" />
          Data Privacy & Compliance
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-2">GDPR Portability</h3>
            <p className="text-sm text-slate-600 mb-4">
              Download all your medical history, profiles, and medications in a structured JSON format.
            </p>
            <button 
              onClick={handleExportData}
              className="inline-flex items-center px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export My Data
            </button>
          </div>

          <div className="bg-red-50 p-5 rounded-xl border border-red-100 shadow-sm">
            <h3 className="font-semibold text-red-900 mb-2 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Right to Erasure
            </h3>
            <p className="text-sm text-red-700 mb-4">
              Permanently delete your account and all associated medical data across all health profiles.
            </p>
            <button 
              onClick={handleDeleteAllData}
              disabled={isDeleting}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isDeleting ? 'Deleting...' : 'Delete All Data'}
            </button>
          </div>
        </div>

        <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-100 italic">
          <p className="text-xs text-indigo-700 leading-relaxed">
            MediBridge AI is designed with **Privacy by Design** principles. Every access to your health records is logged in an immutable audit trail for your security. Your data is encrypted at rest and in transit using industry-standard AES-256 and TLS 1.3.
          </p>
        </div>
      </section>
    </div>
  );
}
