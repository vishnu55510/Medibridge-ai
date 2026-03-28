import { useState } from 'react';
import { User } from 'firebase/auth';
import { auth } from '../firebase';
import UploadRecord from './UploadRecord';
import RecordList from './RecordList';
import ChatInterface from './ChatInterface';
import { LogOut, Activity, FileText, MessageSquare } from 'lucide-react';

interface DashboardProps {
  user: User;
}

export default function Dashboard({ user }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'records' | 'chat'>('records');

  const handleSignOut = () => {
    auth.signOut();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-100 p-2 rounded-lg">
                <Activity className="h-6 w-6 text-indigo-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">MediBridge AI</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600 hidden sm:block">
                {user.displayName || user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                title="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-4 mb-8 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('records')}
            className={`pb-4 px-2 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'records'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <FileText className="h-4 w-4" />
            Medical Records
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`pb-4 px-2 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'chat'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            Health Assistant
          </button>
        </div>

        {activeTab === 'records' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <UploadRecord user={user} />
            </div>
            <div className="lg:col-span-2">
              <RecordList user={user} />
            </div>
          </div>
        ) : (
          <div className="h-[calc(100vh-16rem)] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <ChatInterface user={user} />
          </div>
        )}
      </main>
    </div>
  );
}
