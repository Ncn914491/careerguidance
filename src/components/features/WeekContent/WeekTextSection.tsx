/**
 * WeekTextSection Component
 * 
 * Handles display of text content for a week with proper formatting.
 * Preserves line breaks, paragraphs, and whitespace from the original text.
 */

import { FormattedText } from '@/components/ui/FormattedText';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

interface WeekTextSectionProps {
  title: string;
  description: string;
  weekNumber: number;
  publishedDate: string;
}

export function WeekTextSection({ 
  title, 
  description, 
  weekNumber, 
  publishedDate 
}: WeekTextSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <DocumentTextIcon className="w-6 h-6 text-purple-400 mt-1 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-white mb-2">
            Week {weekNumber} Content
          </h4>
          <div className="bg-glass-light rounded-lg p-4 border border-glass">
            <h5 className="text-white font-medium mb-3">{title}</h5>
            {description ? (
              <FormattedText 
                text={description} 
                className="text-gray-300 leading-relaxed"
                paragraphs={true}
                maxLength={500}
                expandable={true}
              />
            ) : (
              <p className="text-gray-400 italic">No description available</p>
            )}
            <div className="mt-4 pt-3 border-t border-glass">
              <p className="text-xs text-gray-400">
                Published on {new Date(publishedDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}