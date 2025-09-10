'use client';

import { useState, useEffect } from 'react';
import { BuildingOfficeIcon, CalendarIcon, MapPinIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface School {
  id: string;
  name: string;
  location: string;
  visit_date: string;
  created_at: string;
}

interface Week {
  id: string;
  week_number: number;
  title: string;
  description: string;
  created_at: string;
}

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Add timeout to prevent infinite loading
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)
      
      const [schoolsResponse, weeksResponse] = await Promise.all([
        fetch('/api/schools', { signal: controller.signal }),
        fetch('/api/weeks', { signal: controller.signal })
      ]);

      clearTimeout(timeoutId)

      if (!schoolsResponse.ok || !weeksResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const [schoolsData, weeksData] = await Promise.all([
        schoolsResponse.json(),
        weeksResponse.json()
      ]);

      setSchools(schoolsData || []);
      setWeeks(weeksData?.weeks || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
      setSchools([]);
      setWeeks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const extractSchoolsFromPDFs = async () => {
    setIsExtracting(true);
    try {
      const response = await fetch('/api/schools/extract', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to extract schools from PDFs');
      }

      const result = await response.json();
      
      // Refresh schools list
      await fetchData();
      
      alert(`Successfully extracted ${result.extracted} school names from PDFs!`);
    } catch (error) {
      console.error('Error extracting schools:', error);
      alert('Failed to extract schools from PDFs. Please try again.');
    } finally {
      setIsExtracting(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Date not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
                <div key={i} className="h-40 bg-glass rounded-lg"></div>
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
              <BuildingOfficeIcon className="w-16 h-16 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Error Loading Schools</h2>
            <p className="text-gray-300">{error}</p>
            <button
              onClick={fetchData}
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BuildingOfficeIcon className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">Schools Visited</h1>
          </div>
          
          <button
            onClick={extractSchoolsFromPDFs}
            disabled={isExtracting}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
              isExtracting
                ? 'bg-gray-500/50 cursor-not-allowed text-gray-300'
                : 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white shadow-glass hover:shadow-glass-lg transform hover:scale-105'
            }`}
          >
            {isExtracting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Extracting...
              </>
            ) : (
              <>
                <DocumentTextIcon className="w-4 h-4" />
                Extract from PDFs
              </>
            )}
          </button>
        </div>

        <p className="text-gray-300 mb-8 text-lg">
          Schools visited during our career guidance program across different weeks.
        </p>

        {schools.length === 0 ? (
          <div className="text-center py-12">
            <BuildingOfficeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Schools Found</h3>
            <p className="text-gray-300 mb-4">
              No schools have been recorded yet. Upload PDFs with school information and click &quot;Extract from PDFs&quot; to populate this list.
            </p>
            {weeks.length > 0 && (
              <p className="text-sm text-gray-400">
                Found {weeks.length} weeks with uploaded content available for extraction.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schools.map((school, index) => (
              <div
                key={school.id}
                className="bg-glass-light backdrop-blur-md rounded-xl p-6 border border-glass shadow-glass hover:shadow-glass-lg transition-all duration-300 transform hover:scale-105 animate-slide-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
                    <BuildingOfficeIcon className="w-6 h-6 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white mb-2 truncate">
                      {school.name}
                    </h3>
                    
                    {school.location && (
                      <div className="flex items-center gap-2 text-gray-300 mb-2">
                        <MapPinIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm truncate">{school.location}</span>
                      </div>
                    )}
                    
                    {school.visit_date && (
                      <div className="flex items-center gap-2 text-gray-300">
                        <CalendarIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{formatDate(school.visit_date)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {schools.length > 0 && (
          <div className="mt-8 p-4 bg-glass-light rounded-lg border border-glass">
            <div className="flex items-center justify-between text-sm text-gray-300">
              <span>Total Schools Visited: {schools.length}</span>
              <span>Career Guidance Program 2024</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}