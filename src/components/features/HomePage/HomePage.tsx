'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import InfoBox from '@/components/ui/InfoBox';
import Modal from '@/components/ui/Modal';
import SchoolsList from './SchoolsList';
import TeamPopup from './TeamPopup';

export default function HomePage() {
  const [showSchoolsModal, setShowSchoolsModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const router = useRouter();

  const handleSchoolsClick = () => {
    setShowSchoolsModal(true);
  };

  const handleTeamClick = () => {
    setShowTeamModal(true);
  };

  const handleStudentsClick = () => {
    // Static display - no action needed per requirements
  };

  const handleVisitsClick = () => {
    // Static display - no action needed per requirements
  };

  const handleViewLatestWeek = () => {
    router.push('/weeks');
  };

  const handleJoinGroupChat = () => {
    router.push('/groups');
  };

  const handleAskAI = () => {
    router.push('/ai-chat');
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-glass backdrop-blur-md rounded-xl p-6 sm:p-8 border border-glass shadow-glass animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">
          Welcome to Career Guidance Project
        </h1>
        <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
          A comprehensive platform showcasing our educational outreach activities, 
          facilitating team collaboration, and providing AI-powered assistance to students.
        </p>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 animate-slide-in">
        <InfoBox
          title="Schools Visited"
          value="4+"
          color="text-blue-400"
          onClick={handleSchoolsClick}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
        
        <InfoBox
          title="Team Members"
          value="11"
          color="text-green-400"
          onClick={handleTeamClick}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        
        <InfoBox
          title="Students Taught"
          value="500+"
          color="text-purple-400"
          onClick={handleStudentsClick}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          }
        />
        
        <InfoBox
          title="Total Visits"
          value="15+"
          color="text-orange-400"
          onClick={handleVisitsClick}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-glass backdrop-blur-md rounded-xl p-6 border border-glass shadow-glass animate-fade-in">
        <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={handleViewLatestWeek}
            className="p-4 bg-glass-light rounded-lg border border-glass hover:bg-glass-dark hover:shadow-glass-sm transition-all duration-300 text-left transform hover:scale-105 active:scale-95"
          >
            <h3 className="font-medium text-white">View Latest Week</h3>
            <p className="text-sm text-gray-400 mt-1">Check out the most recent program content</p>
          </button>
          
          <button 
            onClick={handleJoinGroupChat}
            className="p-4 bg-glass-light rounded-lg border border-glass hover:bg-glass-dark hover:shadow-glass-sm transition-all duration-300 text-left transform hover:scale-105 active:scale-95"
          >
            <h3 className="font-medium text-white">Join Group Chat</h3>
            <p className="text-sm text-gray-400 mt-1">Connect with other participants</p>
          </button>
          
          <button 
            onClick={handleAskAI}
            className="p-4 bg-glass-light rounded-lg border border-glass hover:bg-glass-dark hover:shadow-glass-sm transition-all duration-300 text-left transform hover:scale-105 active:scale-95"
          >
            <h3 className="font-medium text-white">Ask AI Assistant</h3>
            <p className="text-sm text-gray-400 mt-1">Get help with your questions</p>
          </button>
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={showSchoolsModal}
        onClose={() => setShowSchoolsModal(false)}
        title="Schools Visited"
        size="lg"
      >
        <SchoolsList />
      </Modal>

      <Modal
        isOpen={showTeamModal}
        onClose={() => setShowTeamModal(false)}
        title="Team Members"
        size="md"
      >
        <TeamPopup />
      </Modal>
    </div>
  );
}