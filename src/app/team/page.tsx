'use client';

import { useState, useEffect } from 'react';
import { UserGroupIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

interface TeamMember {
  id: string;
  name: string;
  roll_number: string;
  position: string;
  created_at: string;
}

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch('/api/team');
      if (!response.ok) {
        throw new Error('Failed to fetch team members');
      }
      const data = await response.json();
      setTeamMembers(data);
    } catch (error) {
      console.error('Error fetching team members:', error);
      setError(error instanceof Error ? error.message : 'Failed to load team members');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-glass backdrop-blur-md rounded-xl p-6 border border-glass shadow-glass">
          <div className="animate-pulse">
            <div className="h-8 bg-glass rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-glass rounded w-2/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-glass rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-glass backdrop-blur-md rounded-xl p-6 border border-glass shadow-glass">
          <div className="text-center py-8">
            <div className="text-red-400 mb-4">
              <UserGroupIcon className="w-16 h-16 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Error Loading Team</h2>
            <p className="text-gray-300">{error}</p>
            <button
              onClick={fetchTeamMembers}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-glass backdrop-blur-md rounded-xl p-8 border border-glass shadow-glass animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <UserGroupIcon className="w-8 h-8 text-blue-400" />
          <h1 className="text-3xl font-bold text-white">Our Team</h1>
        </div>
        <p className="text-gray-300 mb-8 text-lg">
          Meet our dedicated team members working on the career guidance program.
        </p>

        {teamMembers.length === 0 ? (
          <div className="text-center py-12">
            <UserGroupIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Team Members Found</h3>
            <p className="text-gray-300">Team member information will be displayed here once available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {teamMembers.map((member, index) => (
              <div
                key={member.id}
                className="bg-glass-light backdrop-blur-md rounded-xl p-6 border border-glass shadow-glass hover:shadow-glass-lg transition-all duration-300 transform hover:scale-105 animate-slide-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <AcademicCapIcon className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {member.name}
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="inline-block px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm border border-blue-400/30">
                      {member.roll_number}
                    </div>
                    
                    <p className="text-gray-300 text-sm">
                      {member.position}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {teamMembers.length > 0 && (
          <div className="mt-8 p-4 bg-glass-light rounded-lg border border-glass">
            <div className="flex items-center justify-between text-sm text-gray-300">
              <span>Total Team Members: {teamMembers.length}</span>
              <span>Career Guidance Program 2024</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}