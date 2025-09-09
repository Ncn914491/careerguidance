# Implementation Plan

- [ ] 1. Verify and fix Supabase database schema
  - Pull current database schema using `supabase db pull`
  - Compare current schema against expected schema in `sql/init.sql`
  - Generate SQL migration script for any schema mismatches
  - Apply schema fixes to align database structure with frontend expectations
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 2. Clean up Row-Level Security policies
  - Query existing RLS policies for all tables using SQL
  - Identify and remove duplicate or conflicting policies
  - Apply clean, minimal RLS policy set from design document
  - Test policy effectiveness with different user roles
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 3. Restore weeks data from local csp folder
  - Check if weeks table is empty or missing expected data
  - Write script to upload photos and PDFs from `csp/Week1-Week5` to Supabase storage
  - Create week records in database with proper file references
  - Verify uploaded files are accessible and have correct permissions
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 4. Simplify AuthProvider implementation
  - Remove Zustand store dependency from AuthProvider
  - Rewrite AuthProvider using only React useState and useEffect
  - Eliminate refs, complex callbacks, and dependency chains that cause loops
  - Implement single initialization useEffect with no dependencies
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 5. Fix auth state management and context
  - Create simplified auth context interface with user, role, isLoading
  - Implement clean role checking function without infinite loops
  - Remove auth store persistence that causes hydration issues
  - Test auth state changes work correctly without re-render loops
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 6. Remove debug components and invisible windows
  - Search codebase for any test auth components or debug interfaces
  - Remove or disable any development-only auth testing components
  - Clean up any invisible windows or popup debug tools
  - Verify no background auth testing processes are running
  - _Requirements: 2.4_

- [ ] 7. Fix page loading states and navigation
  - Update all page components to use simplified auth context
  - Remove complex loading logic that causes infinite loading states
  - Fix Groups page authentication check to prevent login loops
  - Ensure dashboard pages resolve user roles properly without hanging
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 8. Fix button responsiveness and UI interactions
  - Remove auth loading state blocking from button click handlers
  - Implement proper error handling for user actions
  - Add optimistic UI updates where appropriate
  - Test all interactive elements respond immediately to user input
  - _Requirements: 5.4_

- [ ] 9. Test and fix student user flow
  - Implement test for student login process
  - Verify weeks page displays gallery and PDF viewing works
  - Test group joining and real-time chat functionality
  - Ensure student can access all intended features without errors
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 10. Test and fix admin user flow
  - Implement test for admin login and dashboard access
  - Verify admin can create, edit, and delete weeks with file uploads
  - Test admin group management and user role management
  - Ensure all admin features work without authentication errors
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 11. Fix and test AskAI chatbot functionality
  - Verify AskAI button opens chat interface without errors
  - Test Gemini API integration and response handling
  - Ensure chat conversations are private to each user
  - Implement and test 1-month auto-deletion of chat history
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 12. Run comprehensive end-to-end testing
  - Test complete student flow: login → view weeks → join group → chat
  - Test complete admin flow: login → create week → manage groups
  - Verify no infinite loading, invisible windows, or authentication errors
  - Validate all features work as intended in original specification
  - _Requirements: 9.1, 9.2, 9.3, 9.4_