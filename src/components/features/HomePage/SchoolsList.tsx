'use client';

import { useState, useEffect } from 'react';

interface School {
  id: string;
  name: string;
  location: string | null;
  visit_date: string | null;
  created_at: string;
}

export default function SchoolsList() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const response = await fetch('/api/schools');
        if (!response.ok) {
          throw new Error('Failed to fetch schools');
        }
        const data = await response.json();
        setSchools(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchSchools();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
        <span className="ml-3 text-gray-300">Loading schools...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-400 mb-2">Error loading schools</div>
        <div className="text-gray-400 text-sm">{error}</div>
      </div>
    );
  }

  if (schools.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div className="text-gray-300 mb-2">No schools visited yet</div>
        <div className="text-gray-400 text-sm">Schools will appear here once visits are recorded</div>
      </div>
    );
  }


  return (
    <div className="space-y-4">
      <div className="text-gray-300 mb-4">
        Total schools visited: <span className="font-semibold text-blue-400">{schools.length}</span>
      </div>
      
      <div className="space-y-3">
        {schools.map((school, index) => (
          <div
            key={school.id}
            className="bg-glass-light backdrop-blur-sm rounded-lg p-4 border border-glass hover:bg-glass-dark transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-white font-semibold text-sm">{index + 1}</span>
                </div>
                <h3 className="font-semibold text-white text-lg">
                  {school.name}
                </h3>
              </div>
              
              <div className="flex-shrink-0">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}