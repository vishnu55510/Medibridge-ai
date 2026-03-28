import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useProfile } from '../contexts/ProfileContext';
import { UserProfile } from '../types';

/**
 * ProfilePage Component
 * 
 * Manages health profiles for the user and their family members.
 * Supports creating new profiles and switching between active profiles
 * for context-specific data views.
 * 
 * @param {ProfilePageProps} props - Component props containing the authenticated user.
 */
export default function ProfilePage({ user }: ProfilePageProps) {
  const { profiles, activeProfile, setActiveProfile } = useProfile();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    relationship: 'Self',
    dateOfBirth: '',
    bloodType: '',
    allergies: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      await addDoc(collection(db, 'users', user.uid, 'profiles'), newProfile);
      
      setIsCreating(false);
      setFormData({ name: '', relationship: 'Self', dateOfBirth: '', bloodType: '', allergies: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/profiles`);
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
    </div>
  );
}
