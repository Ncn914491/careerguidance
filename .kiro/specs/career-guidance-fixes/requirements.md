# Requirements Document

## Introduction

The Career Guidance Project is currently experiencing critical system failures that prevent normal operation. The application suffers from infinite loading states, authentication loops, broken role-based access control, and data propagation issues. This spec addresses the systematic fixes needed to restore full functionality to the existing Next.js 14 + Supabase application.

## Requirements

### Requirement 1

**User Story:** As a developer, I want to verify and fix the Supabase database schema, so that the frontend queries work correctly without authentication errors.

#### Acceptance Criteria

1. WHEN the system checks the current database schema THEN it SHALL match the expected schema for profiles, weeks, groups, and related tables
2. WHEN schema mismatches are found THEN the system SHALL generate and apply SQL migrations to correct the structure
3. WHEN the schema is corrected THEN all frontend queries SHALL execute without "Authentication required" errors
4. WHEN the database is properly configured THEN Row-Level Security policies SHALL allow appropriate access based on user roles

### Requirement 2

**User Story:** As a developer, I want to fix the AuthProvider component, so that authentication state is properly managed without infinite loops.

#### Acceptance Criteria

1. WHEN the AuthProvider initializes THEN it SHALL establish Supabase auth state exactly once using useEffect
2. WHEN user authentication state changes THEN the context SHALL provide accurate user, role, and isLoading values
3. WHEN role checking occurs THEN it SHALL NOT create infinite loops or recursive calls
4. WHEN the auth system is working THEN there SHALL be no invisible "auth test" windows or debug components

### Requirement 3

**User Story:** As a developer, I want to fix Row-Level Security policies, so that authenticated users can access appropriate data based on their roles.

#### Acceptance Criteria

1. WHEN a student user is authenticated THEN they SHALL be able to read weeks and groups data
2. WHEN an admin user is authenticated THEN they SHALL have full access to insert, update, and delete operations
3. WHEN RLS policies are reviewed THEN duplicate or conflicting policies SHALL be removed
4. WHEN policies are corrected THEN users SHALL not receive "Authentication required" errors for permitted operations

### Requirement 4

**User Story:** As a developer, I want to restore weeks data in the database, so that the frontend can display the intended content.

#### Acceptance Criteria

1. WHEN the weeks table is checked THEN it SHALL contain 5 weeks of data from the local csp/ folder
2. WHEN weeks data is missing THEN the system SHALL upload photos and PDFs from csp/Week1-Week5 to Supabase storage
3. WHEN files are uploaded THEN the weeks table SHALL contain proper references to the stored files
4. WHEN weeks data is restored THEN the frontend SHALL display the gallery and embedded PDFs correctly

### Requirement 5

**User Story:** As a user, I want the application pages to load properly, so that I can access all features without infinite loading states.

#### Acceptance Criteria

1. WHEN a user navigates to any page THEN the page SHALL load completely without getting stuck in loading states
2. WHEN the Groups page is accessed THEN it SHALL not ask for login again if the user is already authenticated
3. WHEN dashboards load THEN the user role SHALL resolve properly and display appropriate content
4. WHEN buttons are clicked THEN they SHALL respond immediately without being blocked by suspended states

### Requirement 6

**User Story:** As a student, I want to log in and access student features, so that I can view weeks and participate in groups.

#### Acceptance Criteria

1. WHEN a student logs in THEN they SHALL be able to view the weeks gallery
2. WHEN a student opens a week THEN they SHALL see photos and be able to view PDFs inline
3. WHEN a student accesses groups THEN they SHALL be able to view available groups and join them
4. WHEN a student joins a group THEN they SHALL be able to participate in real-time chat

### Requirement 7

**User Story:** As an admin, I want to log in and access admin features, so that I can manage content and users.

#### Acceptance Criteria

1. WHEN an admin logs in THEN they SHALL see the admin dashboard with create/edit/delete options
2. WHEN an admin creates a new week THEN they SHALL be able to upload photos and PDFs successfully
3. WHEN an admin edits week content THEN the changes SHALL be saved and reflected immediately
4. WHEN an admin deletes a week THEN it SHALL be removed from the system completely

### Requirement 8

**User Story:** As a user, I want the AskAI chatbot to work properly, so that I can get AI assistance with my questions.

#### Acceptance Criteria

1. WHEN a user clicks the AskAI button THEN the chat interface SHALL open without errors
2. WHEN a user sends a message to the AI THEN it SHALL receive a response from the Gemini API
3. WHEN AI conversations occur THEN they SHALL be private to each user and not shared globally
4. WHEN chat history reaches 1 month old THEN it SHALL be automatically deleted

### Requirement 9

**User Story:** As a developer, I want to verify all critical user flows work end-to-end, so that the application is fully functional.

#### Acceptance Criteria

1. WHEN a student completes the full flow (login → view weeks → join group → chat) THEN all steps SHALL work without errors
2. WHEN an admin completes the full flow (login → create/edit week → create group) THEN all operations SHALL succeed
3. WHEN any user flow is tested THEN there SHALL be no infinite reloading, invisible windows, or authentication errors
4. WHEN the system is verified THEN all features SHALL work as originally intended in the main spec