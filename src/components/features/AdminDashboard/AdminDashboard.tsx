'use client';

import { useState, lazy } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { 
  DocumentArrowUpIcon,
  UserGroupIcon,
  ChartBarIcon,
  UserPlusIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { LazyWrapper } from '@/components/ui/LazyWrapper';

// Lazy load heavy components
const UploadWeekData = lazy(() => import('./UploadWeekData').then(m => ({ default: m.UploadWeekData })));
const ManageGroups = lazy(() => import('./ManageGroups').then(m => ({ default: m.ManageGroups })));
const AdminStats = lazy(() => import('./AdminStats').then(m => ({ default: m.AdminStats })));
const AdminRequestDashboard = lazy(() => import('@/components/AdminRequestDashboard'));

type TabType = 'overview' | 'upload' | 'groups' | 'requests' | 'stats';

export function AdminDashboard() {
  const { user, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      router.push('/login');
    }
  }, [user, isAdmin, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-2 border-purple-500/30 border-t-purple-500"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: ChartBarIcon },
    { id: 'upload' as TabType, label: 'Upload Week Data', icon: DocumentArrowUpIcon },
    { id: 'groups' as TabType, label: 'Manage Groups', icon: UserGroupIcon },
    { id: 'requests' as TabType, label: 'Admin Requests', icon: UserPlusIcon },
    { id: 'stats' as TabType, label: 'Statistics', icon: ChartBarIcon }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'upload':
        return (
          <LazyWrapper>
            <UploadWeekData />
          </LazyWrapper>
        );
      case 'groups':
        return (
          <LazyWrapper>
            <ManageGroups />
          </LazyWrapper>
        );
      case 'requests':
        return (
          <LazyWrapper>
            <AdminRequestDashboard />
          </LazyWrapper>
        );
      case 'stats':
        return (
          <LazyWrapper>
            <AdminStats />
          </LazyWrapper>
        );
      default:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white mb-4">
                Admin Dashboard
              </h1>
              <p className="text-gray-300 text-lg">
                Welcome back, {user.email}. Manage your career guidance platform.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {tabs.slice(1).map((tab) => (
                <div
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="bg-glass backdrop-blur-md rounded-xl border border-glass p-6 hover:bg-glass-light transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-glass-lg"
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center mb-4">
                    <tab.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {tab.label}
                  </h3>
                  <p className="text-gray-300 text-sm">
                    {tab.id === 'upload' && 'Upload weekly content with photos and PDFs'}
                    {tab.id === 'groups' && 'Create and manage student discussion groups'}
                    {tab.id === 'requests' && 'Review and approve admin access requests'}
                    {tab.id === 'stats' && 'View detailed platform analytics and reports'}
                  </p>
                </div>
              ))}
            </div>

            <LazyWrapper>
              <AdminStats />
            </LazyWrapper>
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
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-glass'
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