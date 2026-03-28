import React from 'react';
import { User } from 'firebase/auth';
import ChatInterface from '../components/ChatInterface';
import { useProfile } from '../contexts/ProfileContext';

interface ChatPageProps {
  user: User;
}

export default function ChatPage({ user }: ChatPageProps) {
  const { activeProfile } = useProfile();

  if (!activeProfile) return <div>Please select a profile.</div>;

  return (
    <div className="h-[calc(100vh-8rem)] max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <ChatInterface user={user} profileId={activeProfile.id} />
    </div>
  );
}
