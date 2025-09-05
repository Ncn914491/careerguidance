'use client';

import { ReactNode } from 'react';

interface InfoBoxProps {
  title: string;
  value: string;
  color: string;
  icon?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export default function InfoBox({ 
  title, 
  value, 
  color, 
  icon, 
  onClick, 
  className = '' 
}: InfoBoxProps) {
  const isClickable = !!onClick;

  return (
    <div
      className={`
        bg-glass backdrop-blur-md rounded-xl p-4 sm:p-6 border border-glass shadow-glass
        transition-all duration-300
        ${isClickable ? 'cursor-pointer hover:shadow-glass-lg hover:bg-glass-dark transform hover:scale-105 active:scale-95 hover:border-blue-400/50' : ''}
        ${className}
      `}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      } : undefined}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base sm:text-lg font-semibold text-white">{title}</h3>
        {icon && (
          <div className="text-gray-400 transition-colors duration-300 group-hover:text-blue-400">
            {icon}
          </div>
        )}
      </div>
      <p className={`text-2xl sm:text-3xl font-bold ${color} transition-colors duration-300`}>{value}</p>
      {isClickable && (
        <div className="mt-3 text-xs sm:text-sm text-gray-400 transition-colors duration-300 group-hover:text-gray-300">
          Click to view details
        </div>
      )}
    </div>
  );
}