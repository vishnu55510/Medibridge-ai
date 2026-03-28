import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { signOut } from 'firebase/auth';
import { auth, requestNotificationPermission } from '../firebase';
import { 
  LayoutDashboard, 
  Clock, 
  Upload, 
  Pill, 
  MessageSquare, 
  AlertCircle, 
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Activity,
  Bell
} from 'lucide-react';
import { useProfile } from '../contexts/ProfileContext';
import NotificationsPopover from './NotificationsPopover';

interface LayoutProps {
  user: User;
}

export default function Layout({ user }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [showNotificationBanner, setShowNotificationBanner] = React.useState(false);
  const { activeProfile, profiles, setActiveProfile } = useProfile();
  const navigate = useNavigate();

  React.useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      setShowNotificationBanner(true);
    }
  }, []);

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setShowNotificationBanner(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/timeline', icon: Clock, label: 'Timeline' },
    { to: '/upload', icon: Upload, label: 'Upload Record' },
    { to: '/medications', icon: Pill, label: 'Medications' },
    { to: '/labs', icon: Activity, label: 'Lab Trends' },
    { to: '/chat', icon: MessageSquare, label: 'AI Assistant' },
    { to: '/emergency', icon: AlertCircle, label: 'Emergency Mode', className: 'text-red-600 hover:text-red-700 hover:bg-red-50' },
    { to: '/profile', icon: UserIcon, label: 'Profiles' },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Mobile sidebar backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 flex flex-col
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200">
          <span className="text-xl font-bold text-indigo-600">MediBridge AI</span>
          <button 
            className="lg:hidden text-slate-500 hover:text-slate-700"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Profile Selector */}
        <div className="p-4 border-b border-slate-200">
          <label htmlFor="profile-select" className="block text-xs font-medium text-slate-500 mb-1">
            Active Profile
          </label>
          <select
            id="profile-select"
            className="w-full text-sm border-slate-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={activeProfile?.id || ''}
            onChange={(e) => {
              const profile = profiles.find(p => p.id === e.target.value);
              if (profile) setActiveProfile(profile);
            }}
          >
            {profiles.length === 0 && <option value="">No profiles found</option>}
            {profiles.map(profile => (
              <option key={profile.id} value={profile.id}>
                {profile.name} ({profile.relationship})
              </option>
            ))}
          </select>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) => `
                flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors
                ${isActive 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : item.className || 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }
              `}
            >
              <item.icon className={`w-5 h-5 mr-3 ${item.className ? '' : 'text-slate-400'}`} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center mb-4">
            <img 
              src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email || 'User')}&background=random`} 
              alt="User" 
              className="w-8 h-8 rounded-full mr-3"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {user.displayName || user.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3 text-slate-400" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-slate-200 lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="text-slate-500 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="text-lg font-bold text-indigo-600">MediBridge AI</span>
            <NotificationsPopover user={user} />
          </div>
        </header>

        <header className="hidden lg:flex bg-white border-b border-slate-200 h-16 items-center justify-end px-8">
          <NotificationsPopover user={user} />
        </header>

        <main id="main-content" className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
          {showNotificationBanner && (
            <div className="mb-6 bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-100 p-2 rounded-full">
                  <Bell className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-indigo-900">Enable Notifications</h3>
                  <p className="text-sm text-indigo-700">Get alerts for medication reminders and new records.</p>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button 
                  onClick={() => setShowNotificationBanner(false)}
                  className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                >
                  Dismiss
                </button>
                <button 
                  onClick={handleEnableNotifications}
                  className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors"
                >
                  Enable
                </button>
              </div>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
