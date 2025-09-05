'use client';

import { useState, useEffect } from 'react';

interface TeamMember {
  id: string;
  name: string;
  roll_number: string | null;
  position: string | null;
  created_at: string;
}

export default function TeamPopup() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const response = await fetch('/api/team');
        if (!response.ok) {
          throw new Error('Failed to fetch team members');
        }
        const data = await response.json();
        setTeamMembers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamMembers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
        <span className="ml-3 text-gray-300">Loading team members...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-400 mb-2">Error loading team members</div>
        <div className="text-gray-400 text-sm">{error}</div>
      </div>
    );
  }

  if (teamMembers.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div className="text-gray-300 mb-2">No team members found</div>
        <div className="text-gray-400 text-sm">Team members will appear here once they are added</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-gray-300 mb-4">
        Total team members: <span className="font-semibold text-green-400">{teamMembers.length}</span>
      </div>
      
      <div className="grid gap-3">
        {teamMembers.map((member, index) => (
          <div
            key={member.id}
            className="bg-glass-light backdrop-blur-sm rounded-lg p-4 border border-glass hover:bg-glass-dark transition-all duration-200"
          >
            <div className="flex items-center space-x-3">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {member.name.charAt(0).toUpperCase()}
                </div>
              </div>
              
              {/* Member Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-white truncate">
                    {member.name}
                  </h3>
                  <span className="text-xs text-gray-400 bg-glass px-2 py-1 rounded">
                    #{index + 1}
                  </span>
                </div>
                
                <div className="mt-1 space-y-1">
                  {member.roll_number && (
                    <div className="flex items-center text-sm text-gray-400">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a.997.997 0 01-1.414 0l-7-7A1.997 1.997 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      Roll: {member.roll_number}
                    </div>
                  )}
                  
                  {member.position && (
                    <div className="flex items-center text-sm text-gray-400">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0H8m8 0v6a2 2 0 01-2 2H10a2 2 0 01-2-2V6m8 0V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                      </svg>
                      {member.position}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}