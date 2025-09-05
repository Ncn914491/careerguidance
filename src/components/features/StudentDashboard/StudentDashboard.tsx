'use client';

import { useState, lazy } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { 
  CalendarDaysIcon, 
  UserGroupIcon, 
  ChartBarIcon,
  HomeIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { LazyWrapper } from '@/components/ui/LazyWrapper';

// Lazy load heavy components
const ViewGroups = lazy(() => import('./ViewGroups').then(m => ({ default: m.ViewGroups })));
const ViewWeeksData = lazy(() => import('./ViewWeeksData').then(m => ({ default: m.ViewWeeksData })));
const StudentStats = lazy(() => import('./StudentStats').then(m => ({ default: m.StudentStats })));

type TabType = 'overview' | 'groups' | 'weeks' | 'stats';

export function StudentDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-2 border-purple-500/30 border-t-purple-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: HomeIcon },
    { id: 'groups' as TabType, label: 'Study Groups', icon: UserGroupIcon },
    { id: 'weeks' as TabType, label: 'Weekly Content', icon: CalendarDaysIcon },
    { id: 'stats' as TabType, label: 'My Progress', icon: ChartBarIcon }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'groups':
        return (
          <LazyWrapper>
            <ViewGroups />
          </LazyWrapper>
        );
      case 'weeks':
        return (
          <LazyWrapper>
            <ViewWeeksData />
          </LazyWrapper>
        );
      case 'stats':
        return (
          <LazyWrapper>
            <StudentStats />
          </LazyWrapper>
        );
      default:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white mb-4">
                Student Dashboard
              </h1>
              <p className="text-gray-300 text-lg">
                Welcome back! Continue your career guidance journey.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {tabs.slice(1).map((tab) => (
                <div
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="bg-glass backdrop-blur-md rounded-xl border border-glass p-6 hover:bg-glass-light transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-glass-lg"
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center mb-4">
                    <tab.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {tab.label}
                  </h3>
                  <p className="text-gray-300 text-sm">
                    {tab.id === 'groups' && 'Join study groups and participate in discussions'}
                    {tab.id === 'weeks' && 'Explore weekly activities, photos, and documents'}
                    {tab.id === 'stats' && 'Track your learning progress and achievements'}
                  </p>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-glass backdrop-blur-md rounded-xl border border-glass p-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-400" />
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() => router.push('/schools')}
                    className="w-full text-left p-3 bg-glass-light hover:bg-glass rounded-lg transition-all duration-300"
                  >
                    <div className="text-white font-medium">Explore Schools</div>
                    <div className="text-gray-300 text-sm">Discover career opportunities</div>
                  </button>
                  <button
                    onClick={() => router.push('/#askai')}
                    className="w-full text-left p-3 bg-glass-light hover:bg-glass rounded-lg transition-all duration-300"
                  >
                    <div className="text-white font-medium">Ask AI Assistant</div>
                    <div className="text-gray-300 text-sm">Get career guidance help</div>
                  </button>
                </div>
              </div>

              <div className="bg-glass backdrop-blur-md rounded-xl border border-glass p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Getting Started</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-gray-300">Join study groups to connect with peers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="text-gray-300">Explore weekly activities and resources</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-gray-300">Track your progress and achievements</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                    <span className="text-gray-300">Use the AI assistant for guidance</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-glass backdrop-blur-md rounded-xl border border-glass p-2">
        <div className="flex flex-wrap gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-glass'
                  : 'text-gray-300 hover:text-white hover:bg-glass'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-glass backdrop-blur-md rounded-xl border border-glass p-8 animate-fade-in">
        {renderTabContent()}
      </div>
    </div>
  );
}