'use client';

import { useState, useEffect } from 'react';
import { 
  UsersIcon, 
  AcademicCapIcon, 
  CalendarDaysIcon, 
  UserGroupIcon,
  ChartBarIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface Stats {
  totalUsers: number;
  totalStudents: number;
  totalAdmins: number;
  totalGroups: number;
  totalSchools: number;
  totalWeeks: number;
  totalVisits: number;
  studentsInGroups: number;
}

export function AdminStats() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalStudents: 0,
    totalAdmins: 0,
    totalGroups: 0,
    totalSchools: 0,
    totalWeeks: 0,
    totalVisits: 0,
    studentsInGroups: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: UsersIcon,
      color: 'from-blue-500 to-blue-600',
      description: `${stats.totalStudents} students, ${stats.totalAdmins} admins`
    },
    {
      title: 'Active Groups',
      value: stats.totalGroups,
      icon: UserGroupIcon,
      color: 'from-purple-500 to-purple-600',
      description: `${stats.studentsInGroups} students participating`
    },
    {
      title: 'Schools Visited',
      value: stats.totalSchools,
      icon: AcademicCapIcon,
      color: 'from-green-500 to-green-600',
      description: `${stats.totalVisits} total visits recorded`
    },
    {
      title: 'Weekly Activities',
      value: stats.totalWeeks,
      icon: CalendarDaysIcon,
      color: 'from-orange-500 to-orange-600',
      description: 'Content weeks published'
    }
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-white">Platform Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-glass backdrop-blur-md rounded-xl border border-glass p-6 animate-pulse">
              <div className="h-12 w-12 bg-glass rounded-lg mb-4"></div>
              <div className="h-8 bg-glass rounded w-16 mb-2"></div>
              <div className="h-4 bg-glass rounded w-24 mb-2"></div>
              <div className="h-3 bg-glass rounded w-32"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-white">Platform Statistics</h2>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 px-4 py-2 bg-glass hover:bg-glass-light border border-glass rounded-lg text-white transition-all duration-300"
        >
          <ChartBarIcon className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <div key={card.title} className="bg-glass backdrop-blur-md rounded-xl border border-glass p-6 hover:bg-glass-light transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${card.color} flex items-center justify-center`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{card.value}</div>
                <div className="text-sm text-gray-400">{card.title}</div>
              </div>
            </div>
            <p className="text-xs text-gray-300">{card.description}</p>
          </div>
        ))}
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Breakdown */}
        <div className="bg-glass backdrop-blur-md rounded-xl border border-glass p-6">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-blue-400" />
            User Breakdown
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Students</span>
              <span className="text-white font-semibold">{stats.totalStudents}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Administrators</span>
              <span className="text-white font-semibold">{stats.totalAdmins}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-glass">
              <span className="text-gray-300 font-medium">Total Users</span>
              <span className="text-white font-bold">{stats.totalUsers}</span>
            </div>
          </div>
        </div>

        {/* Engagement Stats */}
        <div className="bg-glass backdrop-blur-md rounded-xl border border-glass p-6">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <EyeIcon className="w-5 h-5 text-green-400" />
            Engagement
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Students in Groups</span>
              <span className="text-white font-semibold">{stats.studentsInGroups}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Group Participation Rate</span>
              <span className="text-white font-semibold">
                {stats.totalStudents > 0 ? Math.round((stats.studentsInGroups / stats.totalStudents) * 100) : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Avg. Students per Group</span>
              <span className="text-white font-semibold">
                {stats.totalGroups > 0 ? Math.round(stats.studentsInGroups / stats.totalGroups) : 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Overview */}
      <div className="bg-glass backdrop-blur-md rounded-xl border border-glass p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <CalendarDaysIcon className="w-5 h-5 text-purple-400" />
          Content Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400 mb-1">{stats.totalWeeks}</div>
            <div className="text-gray-300 text-sm">Weekly Activities</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-1">{stats.totalSchools}</div>
            <div className="text-gray-300 text-sm">Schools Documented</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-400 mb-1">{stats.totalVisits}</div>
            <div className="text-gray-300 text-sm">Total School Visits</div>
          </div>
        </div>
      </div>
    </div>
  );
}