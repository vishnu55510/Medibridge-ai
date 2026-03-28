/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';
import { ProfileProvider } from './contexts/ProfileContext';

// Lazy load components
const Auth = React.lazy(() => import('./components/Auth'));
const Layout = React.lazy(() => import('./components/Layout'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const TimelinePage = React.lazy(() => import('./pages/TimelinePage'));
const UploadPage = React.lazy(() => import('./pages/UploadPage'));
const MedicationsPage = React.lazy(() => import('./pages/MedicationsPage'));
const ChatPage = React.lazy(() => import('./pages/ChatPage'));
const EmergencyPage = React.lazy(() => import('./pages/EmergencyPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const SharePage = React.lazy(() => import('./pages/SharePage'));
const LabTrendsPage = React.lazy(() => import('./pages/LabTrendsPage'));

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <ProfileProvider user={user}>
        <Suspense fallback={
          <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        }>
          <Routes>
            <Route path="/share/:shareId" element={<SharePage />} />
            
            {user ? (
              <Route path="/" element={<Layout user={user} />}>
                <Route index element={<DashboardPage user={user} />} />
                <Route path="timeline" element={<TimelinePage user={user} />} />
                <Route path="upload" element={<UploadPage user={user} />} />
                <Route path="medications" element={<MedicationsPage user={user} />} />
                <Route path="chat" element={<ChatPage user={user} />} />
                <Route path="emergency" element={<EmergencyPage user={user} />} />
                <Route path="profile" element={<ProfilePage user={user} />} />
                <Route path="labs" element={<LabTrendsPage user={user} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            ) : (
              <>
                <Route path="/auth" element={<Auth />} />
                <Route path="*" element={<Navigate to="/auth" replace />} />
              </>
            )}
          </Routes>
        </Suspense>
      </ProfileProvider>
    </BrowserRouter>
  );
}

export default App;
