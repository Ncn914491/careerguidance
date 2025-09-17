import { WeekContentDisplay } from './WeekContentDisplay';

/**
 * WeekContentExample Component
 * 
 * Demonstrates how to use the WeekContentDisplay component with sample data.
 * This shows both the proper display order (media first, then text) and 
 * the correct text formatting with preserved line breaks and paragraphs.
 */

// Sample week data demonstrating proper formatting
const sampleWeekData = {
  id: '1',
  week_number: 5,
  title: 'Career Exploration Workshop',
  description: `This week we had an amazing career exploration workshop!

The session covered several key topics:
- Resume writing best practices
- Interview techniques and tips
- Networking strategies for students

Participants learned how to:
1. Structure their resumes effectively
2. Answer common interview questions
3. Build professional networks

We also had guest speakers from various industries who shared their experiences and provided valuable insights into career development.

The workshop was highly interactive with role-playing exercises and group discussions. Students practiced mock interviews and received personalized feedback.

Next week we'll continue with advanced topics including salary negotiation and career planning.`,
  created_at: '2024-03-15T10:00:00Z',
  week_files: [
    {
      id: '1',
      file_name: 'workshop_photo_1.jpg',
      file_type: 'photo' as const,
      file_url: 'https://example.com/photo1.jpg',
      file_size: 2048000,
    },
    {
      id: '2', 
      file_name: 'workshop_photo_2.jpg',
      file_type: 'photo' as const,
      file_url: 'https://example.com/photo2.jpg',
      file_size: 1536000,
    },
    {
      id: '3',
      file_name: 'presentation_video.mp4',
      file_type: 'video' as const,
      file_url: 'https://example.com/video.mp4',
      file_size: 15728640,
    },
    {
      id: '4',
      file_name: 'workshop_materials.pdf',
      file_type: 'pdf' as const,
      file_url: 'https://example.com/materials.pdf',
      file_size: 512000,
    }
  ]
};

export function WeekContentExample() {
  const handleFileSelect = (file: { id: string; file_name: string; file_type: string; file_url: string; file_size: number }) => {
    console.log('File selected:', file);
    // In a real app, this would open a file viewer modal
  };

  const handleEdit = (week: { id: string; week_number: number; title: string; description: string | null; created_at: string }) => {
    console.log('Edit week:', week);
    // In a real app, this would open an edit modal
  };

  const handleDelete = (weekId: string) => {
    console.log('Delete week:', weekId);
    // In a real app, this would show a confirmation dialog
  };

  return (
    <div className="space-y-8">
      <div className="bg-gray-900 p-6 rounded-lg">
        <h1 className="text-2xl font-bold text-white mb-4">
          Week Content Display Examples
        </h1>
        <p className="text-gray-300 mb-6">
          These examples show the proper ordering and formatting:
        </p>
        
        <div className="space-y-8">
          {/* Example 1: Full expanded view with admin controls */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">
              1. Full Display with Admin Controls
            </h2>
            <WeekContentDisplay
              week={sampleWeekData}
              expanded={true}
              showAdminControls={true}
              onFileSelect={handleFileSelect}
              onEdit={handleEdit}
              onDelete={handleDelete}
              className="bg-gray-800/50 rounded-lg p-6"
            />
          </div>

          {/* Example 2: Compact view */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">
              2. Compact View
            </h2>
            <WeekContentDisplay
              week={sampleWeekData}
              expanded={false}
              onFileSelect={handleFileSelect}
              className="bg-gray-800/50 rounded-lg p-6"
            />
          </div>

          {/* Example 3: Text-only content */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">
              3. Text-Only Content
            </h2>
            <WeekContentDisplay
              week={{
                ...sampleWeekData,
                week_files: [] // No media files
              }}
              expanded={true}
              onFileSelect={handleFileSelect}
              className="bg-gray-800/50 rounded-lg p-6"
            />
          </div>

          {/* Example 4: Loading state */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">
              4. Loading State
            </h2>
            <WeekContentDisplay
              week={sampleWeekData}
              isLoading={true}
              className="bg-gray-800/50 rounded-lg p-6"
            />
          </div>
        </div>
      </div>

      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-200 mb-3">
          Key Features Demonstrated
        </h2>
        <ul className="space-y-2 text-blue-100 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">✓</span>
            <span><strong>Proper Display Order:</strong> Media content (photos, videos, PDFs) appears above text content</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">✓</span>
            <span><strong>Enhanced Text Formatting:</strong> Preserves paragraphs, line breaks, and whitespace</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">✓</span>
            <span><strong>Responsive Design:</strong> Works well on all screen sizes</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">✓</span>
            <span><strong>Modular Components:</strong> Clean separation of media and text sections</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">✓</span>
            <span><strong>Multiple Display Modes:</strong> Expanded, compact, and loading states</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">✓</span>
            <span><strong>Admin Controls:</strong> Optional edit/delete functionality</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">✓</span>
            <span><strong>Error Handling:</strong> Graceful fallbacks for missing content</span>
          </li>
        </ul>
      </div>
    </div>
  );
}