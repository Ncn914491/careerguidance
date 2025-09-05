# Requirements Document

## Introduction

The Career Guidance Project Website is a comprehensive web application designed to showcase educational outreach activities, facilitate team collaboration, and provide AI-powered assistance to students. The platform will serve as a central hub for displaying visit statistics, managing weekly content uploads, enabling group communications, and offering administrative capabilities for content management and user role assignments.

## Requirements

### Requirement 1

**User Story:** As a visitor, I want to view key statistics about the career guidance program, so that I can understand the scope and impact of the initiative.

#### Acceptance Criteria

1. WHEN a user visits the homepage THEN the system SHALL display 4 information boxes showing: Schools visited (5+), Team members (11), Students taught (500+), and Visits (15+)
2. WHEN a user clicks on the "Schools visited" box THEN the system SHALL display a list of all schools
3. WHEN a user clicks on the "Team members" box THEN the system SHALL display a popup with 11 team member names and roll numbers
4. WHEN a user clicks on "Students taught" or "Visits" boxes THEN the system SHALL display the static numbers without additional navigation

### Requirement 2

**User Story:** As a user, I want to navigate through different sections of the website, so that I can access various features and content areas.

#### Acceptance Criteria

1. WHEN a user accesses any page THEN the system SHALL display a collapsible sidebar with navigation options: Home, Weeks, Groups, Team, Schools, Admin
2. WHEN a user clicks on any sidebar navigation item THEN the system SHALL navigate to the corresponding page
3. WHEN a user collapses the sidebar THEN the system SHALL maintain the collapsed state during the session

### Requirement 3

**User Story:** As a user, I want to view weekly content and materials, so that I can access educational resources and documentation from program visits.

#### Acceptance Criteria

1. WHEN a user navigates to the Weeks section THEN the system SHALL fetch and display all available weeks from the database
2. WHEN a user clicks on a specific week THEN the system SHALL open a modal displaying all files (photos, videos, PDFs) associated with that week
3. WHEN a PDF file is displayed THEN the system SHALL render it inline in the browser with a download option
4. WHEN media files are displayed THEN the system SHALL provide appropriate viewing capabilities for photos and videos

### Requirement 4

**User Story:** As an admin, I want to upload new weekly content, so that I can keep the platform updated with latest program materials.

#### Acceptance Criteria

1. WHEN an admin accesses the Admin panel THEN the system SHALL provide an interface to upload new week content
2. WHEN an admin uploads a new week THEN the system SHALL require a week number, description, at least 1 photo, and 1 PDF file
3. WHEN files are uploaded THEN the system SHALL store them in Supabase storage and save metadata in the week_files table
4. IF an admin attempts to upload without mandatory files THEN the system SHALL display validation errors and prevent submission

### Requirement 5

**User Story:** As a student, I want to participate in group chats, so that I can collaborate and communicate with other program participants.

#### Acceptance Criteria

1. WHEN a user accesses the Groups section THEN the system SHALL display available groups and enable real-time messaging
2. WHEN a user sends a message in a group THEN the system SHALL broadcast it to all group members in real-time using Supabase Realtime
3. WHEN a user joins a group chat THEN the system SHALL display message history and enable participation

### Requirement 6

**User Story:** As a user, I want to interact with an AI chatbot, so that I can get assistance and answers to my questions.

#### Acceptance Criteria

1. WHEN a user clicks the "AskAI" button in the lower-right corner THEN the system SHALL open a chat interface popup
2. WHEN a user sends a message to the AI THEN the system SHALL process it through the Gemini API and return a response
3. WHEN a user interacts with the AI chat THEN the system SHALL store the conversation in ai_chats table with 30-day auto-expiry
4. WHEN a user wants fullscreen mode THEN the system SHALL provide an option to expand the chat interface

### Requirement 7

**User Story:** As a student, I want to request admin privileges, so that I can contribute to content management when appropriate.

#### Acceptance Criteria

1. WHEN a student wants admin access THEN the system SHALL provide a request mechanism
2. WHEN an admin reviews requests THEN the system SHALL display pending requests in the admin dashboard
3. WHEN an admin approves or denies a request THEN the system SHALL update the user's role accordingly and notify the requester

### Requirement 8

**User Story:** As a system administrator, I want the application to have proper authentication and authorization, so that sensitive operations are protected.

#### Acceptance Criteria

1. WHEN the system initializes THEN it SHALL seed one admin user with email "nchaitanyanaidu@yahoo.com" and password "adminncn@20"
2. WHEN the seeded admin accesses the system THEN it SHALL skip the login screen for initial setup and testing
3. WHEN normal users access the system THEN it SHALL require proper login/signup authentication
4. WHEN users perform role-specific actions THEN the system SHALL enforce appropriate authorization checks

### Requirement 9

**User Story:** As a developer, I want the application to be properly tested and deployable, so that it maintains quality and can be reliably deployed.

#### Acceptance Criteria

1. WHEN code is written THEN the system SHALL include comprehensive tests in a dedicated "tests" folder
2. WHEN each development stage is completed THEN the system SHALL produce a runnable application with passing tests
3. WHEN the application is deployed THEN it SHALL be configured for Vercel deployment with proper environment variables
4. WHEN database operations occur THEN they SHALL use proper SQL schema with Row-Level Security enabled

### Requirement 10

**User Story:** As a user, I want the application to have an attractive and modern interface, so that the experience is engaging and professional.

#### Acceptance Criteria

1. WHEN users interact with the interface THEN the system SHALL implement a liquid glass style using TailwindCSS
2. WHEN the application loads THEN it SHALL provide a responsive design that works across different device sizes
3. WHEN users navigate the interface THEN it SHALL provide smooth transitions and modern UI components