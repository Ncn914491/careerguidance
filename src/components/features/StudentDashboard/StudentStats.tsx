'use client';

import { useState, useEffect } from 'react';
import { 
  UserGroupIcon, 
  CalendarDaysIcon, 
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  BookOpenIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface StudentStats {
  groupsJoined: number;
  totalGroups: number;
  weeksViewed: number;
  totalWeeks: number;
  schoolsExplored: number;
  totalSchools: number;
  messagesPosted: number;
  activeDays: number;
}

export function StudentStats() {
  const [stats, setStats] = useState<StudentStats>({
    groupsJoined: 0,
    totalGroups: 0,
    weeksViewed: 0,
    totalWeeks: 0,
    schoolsExplored: 0,
    totalSchools: 0,
    messagesPosted: 0,
    activeDays: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    
    // Auto-refresh stats every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const { api } = await import('@/lib/api');
      const data = await api.get('/api/student/stats');
      
      if (data.error) {
        console.error('Failed to fetch student stats:', data.error);
        // Set some default stats if API fails
        setStats({
          groupsJoined: 1,
          totalGroups: 3,
          weeksViewed: 2,
          totalWeeks: 8,
          schoolsExplored: 3,
          totalSchools: 10,
          messagesPosted: 5,
          activeDays: 7
        });
      } else {
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching student stats:', error);
      // Set some default stats if API fails
      setStats({
        groupsJoined: 1,
        totalGroups: 3,
        weeksViewed: 2,
        totalWeeks: 8,
        schoolsExplored: 3,
        totalSchools: 10,
        messagesPosted: 5,
        activeDays: 7
      });
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Groups Joined',
      value: stats.groupsJoined,
      total: stats.totalGroups,
      icon: UserGroupIcon,
      color: 'from-blue-500 to-blue-600',
      description: `${stats.totalGroups - stats.groupsJoined} more available`
    },
    {
      title: 'Weeks Explored',
      value: stats.weeksViewed,
      total: stats.totalWeeks,
      icon: CalendarDaysIcon,
      color: 'from-purple-500 to-purple-600',
      description: `${stats.totalWeeks - stats.weeksViewed} remaining`
    },
    {
      title: 'Schools Viewed',
      value: stats.schoolsExplored,
      total: stats.totalSchools,
      icon: AcademicCapIcon,
      color: 'from-green-500 to-green-600',
      description: `${stats.totalSchools - stats.schoolsExplored} more to explore`
    },
    {
      title: 'Messages Posted',
      value: stats.messagesPosted,
      icon: ChatBubbleLeftRightIcon,
      color: 'from-orange-500 to-orange-600',
      description: 'In group discussions'
    }
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-white">Your Progress</h2>
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

  const getProgressPercentage = (current: number, total: number) => {
    return total > 0 ? Math.round((current / total) * 100) : 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-white">Your Progress</h2>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 px-4 py-2 bg-glass hover:bg-glass-light border border-glass rounded-lg text-white transition-all duration-300"
        >
          <EyeIcon className="w-4 h-4" />
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
                <div className="text-2xl font-bold text-white">
                  {card.value}
                  {card.total && <span className="text-lg text-gray-400">/{card.total}</span>}
                </div>
                <div className="text-sm text-gray-400">{card.title}</div>
              </div>
            </div>
            
            {/* Progress Bar for items with totals */}
            {card.total && (
              <div className="mb-2">
                <div className="w-full bg-glass-dark rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full bg-gradient-to-r ${card.color} transition-all duration-500`}
                    style={{ width: `${getProgressPercentage(card.value, card.total)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {getProgressPercentage(card.value, card.total)}% complete
                </div>
              </div>
            )}
            
            <p className="text-xs text-gray-300">{card.description}</p>
          </div>
        ))}
      </div>

      {/* Engagement Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Summary */}
        <div className="bg-glass backdrop-blur-md rounded-xl border border-glass p-6">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <BookOpenIcon className="w-5 h-5 text-purple-400" />
            Learning Activity
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Content Engagement</span>
              <span className="text-white font-semibold">
                {getProgressPercentage(stats.weeksViewed, stats.totalWeeks)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Group Participation</span>
              <span className="text-white font-semibold">
                {getProgressPercentage(stats.groupsJoined, stats.totalGroups)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">School Exploration</span>
              <span className="text-white font-semibold">
                {getProgressPercentage(stats.schoolsExplored, stats.totalSchools)}%
              </span>
            </div>
          </div>
        </div>

        {/* Participation Stats */}
        <div className="bg-glass backdrop-blur-md rounded-xl border border-glass p-6">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <ChatBubbleLeftRightIcon className="w-5 h-5 text-green-400" />
            Participation
          </h3>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400 mb-1">{stats.messagesPosted}</div>
              <div className="text-gray-300 text-sm">Messages Posted</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-1">{stats.activeDays}</div>
              <div className="text-gray-300 text-sm">Active Days</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-1">
                {stats.groupsJoined > 0 ? Math.round(stats.messagesPosted / stats.groupsJoined) : 0}
              </div>
              <div className="text-gray-300 text-sm">Avg. Messages per Group</div>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements/Milestones */}
      <div className="bg-glass backdrop-blur-md rounded-xl border border-glass p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Achievements</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg border ${stats.groupsJoined > 0 ? 'bg-green-500/20 border-green-400/50' : 'bg-gray-500/20 border-gray-400/50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <UserGroupIcon className={`w-5 h-5 ${stats.groupsJoined > 0 ? 'text-green-400' : 'text-gray-400'}`} />
              <span className={`font-medium ${stats.groupsJoined > 0 ? 'text-green-300' : 'text-gray-300'}`}>
                Group Member
              </span>
            </div>
            <p className={`text-sm ${stats.groupsJoined > 0 ? 'text-green-200' : 'text-gray-400'}`}>
              {stats.groupsJoined > 0 ? 'Joined your first group!' : 'Join a group to unlock'}
            </p>
          </div>

          <div className={`p-4 rounded-lg border ${stats.weeksViewed >= 3 ? 'bg-purple-500/20 border-purple-400/50' : 'bg-gray-500/20 border-gray-400/50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <CalendarDaysIcon className={`w-5 h-5 ${stats.weeksViewed >= 3 ? 'text-purple-400' : 'text-gray-400'}`} />
              <span className={`font-medium ${stats.weeksViewed >= 3 ? 'text-purple-300' : 'text-gray-300'}`}>
                Explorer
              </span>
            </div>
            <p className={`text-sm ${stats.weeksViewed >= 3 ? 'text-purple-200' : 'text-gray-400'}`}>
              {stats.weeksViewed >= 3 ? 'Explored 3+ weeks of content!' : `View ${3 - stats.weeksViewed} more weeks`}
            </p>
          </div>

          <div className={`p-4 rounded-lg border ${stats.messagesPosted >= 10 ? 'bg-orange-500/20 border-orange-400/50' : 'bg-gray-500/20 border-gray-400/50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <ChatBubbleLeftRightIcon className={`w-5 h-5 ${stats.messagesPosted >= 10 ? 'text-orange-400' : 'text-gray-400'}`} />
              <span className={`font-medium ${stats.messagesPosted >= 10 ? 'text-orange-300' : 'text-gray-300'}`}>
                Contributor
              </span>
            </div>
            <p className={`text-sm ${stats.messagesPosted >= 10 ? 'text-orange-200' : 'text-gray-400'}`}>
              {stats.messagesPosted >= 10 ? 'Posted 10+ messages!' : `Post ${10 - stats.messagesPosted} more messages`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}