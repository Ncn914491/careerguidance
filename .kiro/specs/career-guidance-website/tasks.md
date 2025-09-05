# Implementation Plan

## Stage 1: Project Setup and Foundation

- [x] 1. Initialize Next.js application with TailwindCSS










  - Create new Next.js project with TypeScript support
  - Install and configure TailwindCSS with liquid glass styling
  - Set up project folder structure: /components, /pages, /lib, /tests
  - _Requirements: 9.2, 10.1, 10.2_

- [x] 2. Configure Supabase client integration



  - Install Supabase client library
  - Create lib/supabase.ts with client configuration
  - Set up environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
  - _Requirements: 8.1, 9.4_

- [x] 3. Set up testing infrastructure





  - Install Jest and React Testing Library
  - Configure test setup in /tests folder only
  - Create sample test to verify test setup works
  - _Requirements: 9.1, 9.2_

## Stage 2: Database Schema and Admin Bootstrap

- [x] 4. Create and deploy SQL schema





  - Write sql/init.sql with all table definitions
  - Implement Row-Level Security policies for all tables
  - Create database migration script or manual SQL execution guide
  - _Requirements: 9.4_

- [x] 5. Seed admin user and authentication setup





  - Create admin user with email "nchaitanyanaidu@yahoo.com" and password "adminncn@20"
  - Implement auth bypass for seeded admin user
  - Set up basic authentication utilities in lib/auth.ts
  - _Requirements: 8.1, 8.2_

- [x] 6. Write database and authentication tests





  - Test database connection and basic CRUD operations
  - Test admin user seeding and authentication bypass
  - Test RLS policies are properly enforced
  - _Requirements: 9.1, 9.4_

## Stage 3: Homepage and Navigation

- [x] 7. Build main layout with sidebar navigation





  - Create Layout component with collapsible sidebar
  - Implement navigation for: Home, Weeks, Groups, Team, Schools, Admin
  - Add responsive design with liquid glass styling
  - _Requirements: 2.1, 2.2, 2.3, 10.1, 10.2_

- [x] 8. Implement homepage with statistics boxes









  - Create InfoBox component for statistics display
  - Build homepage with 4 clickable info boxes: Schools (5+), Team (11), Students (500+), Visits (15+)
  - Implement click handlers for Schools list and Team popup
  - _Requirements: 1.1, 1.2, 1.3, 1.4_
- [x] 9. Add AskAI button placeholder


  - Create floating AskAI button in lower-right corner
  - Implement popup modal with blank chat UI
  - Add fullscreen toggle functionality
  - _Requirements: 6.1, 6.4_

- [x] 10. Write homepage and navigation tests





  - Test sidebar navigation and collapsible functionality
  - Test info box rendering and click interactions
  - Test AskAI popup opening and closing
  - _Requirements: 9.1_

## Stage 4: Weeks Management and Admin Panel

- [x] 11. Implement Weeks page with file viewing



  - Create API route to fetch weeks from database
  - Build WeeksPage component with week listing
  - Implement modal for displaying week files (photos, videos, PDFs)
  - Add PDF inline viewing with download option using react-pdf or iframe
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 12. Build Admin panel for content upload








  - Create AdminPage component with upload interface
  - Implement file upload to Supabase storage
  - Add form validation requiring week number, description, 1+ photo, 1 PDF
  - Store file metadata in week_files table
  - _Requirements: 4.1, 4.2, 4.3, 4.4_
- [x] 13. Write weeks and admin functionality tests


  - Test weeks API endpoints and data fetching
  - Test file upload workflow and validation
  - Test PDF viewing and download functionality
  - Test admin-only access controls
  - _Requirements: 9.1_

## Stage 5: Real-time Features and AI Integration
- [x] 14. Implement group chat with Supabase Realtime


  - Create GroupsPage with real-time messaging interface
  - Set up Supabase Realtime subscriptions for group_messages
  - Implement message sending and real-time message display
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 15. Integrate Gemini AI chatbot








  - Install @google/generative-ai package
  - Create /api/askai route to proxy requests to Gemini API
  - Implement AI chat functionality in AskAI component
  - Store chat history in ai_chats table with 30-day auto-expiry
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 16. Add admin request workflow





  - Create admin request form for students
  - Build admin dashboard to view and approve/deny requests
  - Implement role update functionality
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 17. Polish UI with liquid glass styling





  - Apply consistent liquid glass design across all components
  - Add smooth animations and transitions
  - Ensure responsive design works on all screen sizes
  - _Requirements: 10.1, 10.2, 10.3_

- [x] 18. Write comprehensive tests for final features





  - Test real-time group chat functionality
  - Test AI integration and chat storage
  - Test admin request workflow
  - Test complete user journeys end-to-end
  - _Requirements: 9.1, 9.2_

- [ ] 19. Prepare for Vercel deployment
  - Configure environment variables for production
  - Set up build scripts and deployment configuration
  - Test production build locally
  - Create deployment documentation
  - _Requirements: 9.3_