import React from 'react';
import { User } from 'firebase/auth';
import UploadRecord from '../components/UploadRecord';
import { useProfile } from '../contexts/ProfileContext';

interface UploadPageProps {
  user: User;
}

export default function UploadPage({ user }: UploadPageProps) {
  const { activeProfile } = useProfile();

  if (!activeProfile) return <div>Please select a profile.</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Upload Record</h1>
        <p className="text-slate-500">Add new medical documents for {activeProfile.name}</p>
      </header>
      
      <UploadRecord user={user} profileId={activeProfile.id} />
    </div>
  );
}
