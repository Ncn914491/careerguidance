import { useState } from 'react';

/**
 * FormattedText Component
 * 
 * Handles proper rendering of text content with preserved formatting.
 * Supports multiple paragraph formatting, line breaks, and whitespace preservation.
 * 
 * Features:
 * - Preserves line breaks and paragraphs
 * - Handles multiple consecutive newlines as paragraph breaks
 * - Maintains whitespace and indentation
 * - Responsive and mobile-friendly
 * 
 * Example inputs and outputs:
 * Input: "Line 1\n\nLine 2\nLine 3" 
 * Output: Renders as separate paragraphs with proper spacing
 * 
 * Input: "Word1    Word2\n\n  Indented text"
 * Output: Preserves spaces and indentation
 */

interface FormattedTextProps {
  text: string;
  className?: string;
  /** Whether to treat double newlines as paragraph breaks */
  paragraphs?: boolean;
  /** Maximum characters to display before truncating */
  maxLength?: number;
  /** Show "read more" link for truncated text */
  expandable?: boolean;
}

export function FormattedText({ 
  text, 
  className = '', 
  paragraphs = true,
  maxLength,
  expandable = false
}: FormattedTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!text || text.trim().length === 0) return null;

  // Clean up the text - normalize line endings and remove excessive whitespace
  const normalizedText = text
    .replace(/\r\n/g, '\n') // Convert Windows line endings
    .replace(/\r/g, '\n')   // Convert Mac line endings
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Limit consecutive newlines to max 2
    .trim();

  // Handle text truncation
  const shouldTruncate = maxLength && normalizedText.length > maxLength && !isExpanded;
  const displayText = shouldTruncate 
    ? normalizedText.slice(0, maxLength) + '...'
    : normalizedText;

  // Split text into paragraphs or lines based on the paragraphs prop
  const segments = paragraphs 
    ? displayText.split('\n\n').filter(segment => segment.trim().length > 0)
    : displayText.split('\n');

  const baseClassName = paragraphs 
    ? 'space-y-3' // Paragraph spacing
    : 'space-y-1'; // Line spacing

  return (
    <div className={`${baseClassName} ${className}`}>
      {segments.map((segment, index) => {
        if (paragraphs) {
          // Render as paragraphs - preserve line breaks within paragraphs
          const lines = segment.split('\n');
          return (
            <p key={index} className="whitespace-pre-wrap break-words">
              {lines.map((line, lineIndex) => (
                <span key={lineIndex}>
                  {line}
                  {lineIndex < lines.length - 1 && <br />}
                </span>
              ))}
            </p>
          );
        } else {
          // Render as simple lines
          return (
            <div key={index} className="whitespace-pre-wrap break-words">
              {segment || '\u00A0'} {/* Non-breaking space for empty lines */}
            </div>
          );
        }
      })}
      
      {/* Expandable functionality */}
      {expandable && maxLength && normalizedText.length > maxLength && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded"
          type="button"
        >
          {isExpanded ? 'Read less' : 'Read more'}
        </button>
      )}
    </div>
  );
}
