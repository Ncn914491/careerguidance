# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Core Development Workflow
```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# System setup (creates admin user, initializes database)
npm run setup

# Clear Next.js cache when facing build issues
npm run clear-cache
```

### Code Quality & Testing
```bash
# Run ESLint for code quality
npm run lint

# Run Jest tests
npm run test

# Run tests in watch mode
npm run test:watch

# TypeScript type checking
npm run type-check

# Production build with type checking
npm run vercel:build
```

### Single Test Execution
```bash
# Run specific test file
npm test -- src/components/auth.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="auth"

# Run tests in specific directory
npm test -- src/__tests__/
```

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **Styling**: Tailwind CSS with glass morphism design
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **AI**: Google Gemini 1.5 Flash for career guidance
- **State**: Zustand for client state, SWR for server state
- **Testing**: Jest + React Testing Library

### Key Authentication Patterns
This project uses a sophisticated multi-layer authentication system:

1. **Middleware-level protection** (`middleware.ts`): Route-based authentication with automatic redirects
2. **Role-based access control**: Admin vs Student roles with different permissions
3. **Server-side auth clients**: Separate clients for middleware, API routes, and server components
4. **Special admin user**: Hard-coded admin credentials (`nchaitanyanaidu@yahoo.com`) with system privileges

### Database Architecture
The system uses Supabase with Row Level Security (RLS) policies. Key tables:
- `profiles` - User profiles with role-based permissions
- `groups` + `group_members` + `group_messages` - Real-time chat system
- `weeks` + `week_files` - Educational content management
- `ai_chats` - AI conversation history
- `schools`, `team_members` - Administrative data

### Real-time Features
- **Group chat**: Uses Supabase realtime subscriptions for live messaging
- **File sharing**: Integrated file upload/viewing within chat groups
- **AI assistance**: Persistent chat history with context awareness

## Project Structure Guidelines

### Source Code Organization
```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # Backend API endpoints
│   ├── admin/             # Admin dashboard pages
│   ├── groups/            # Real-time chat interface
│   ├── auth/              # Authentication callbacks
│   └── [other-pages]/     # Student dashboard, AI chat, etc.
├── components/            # React components
│   ├── features/          # Feature-specific components
│   ├── layout/            # App shell components
│   ├── providers/         # Context providers
│   └── ui/                # Reusable UI components
├── lib/                   # Utilities and configurations
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript type definitions
└── store/                 # Zustand state management
```

### API Route Patterns
- All API routes return JSON responses with consistent error handling
- Authentication is checked via Authorization headers or middleware
- Admin routes require role verification beyond authentication
- File upload routes handle multipart form data for Supabase storage

### Component Architecture
- **Feature components**: Self-contained components for major features (AdminDashboard, GroupChat, etc.)
- **Layout components**: Handle app shell, navigation, and responsive design
- **UI components**: Reusable components with consistent styling (Button, Modal, FileViewer)
- **Provider pattern**: Centralized state management for auth and app-wide state

## Development Guidelines

### Authentication Development
When working with authentication:
- Always check both user existence AND role permissions for admin features
- Use `src/lib/auth-client.ts` for server-side auth operations
- The admin user (`nchaitanyanaidu@yahoo.com`) has special system privileges
- Test authentication flows with both student and admin accounts

### Database Operations
- All database operations should respect RLS policies
- Use the admin Supabase client only for system-level operations
- Real-time subscriptions require proper cleanup on component unmount
- File operations use Supabase Storage with security policies

### Styling Conventions
- Primary design uses dark theme with glass morphism effects
- Responsive breakpoints: mobile (768px), tablet (1024px), desktop (1440px+)
- Consistent component styling with Tailwind utility classes
- Loading states use the custom cosmic animation component

### Error Handling
- API routes use consistent error response format
- Client-side errors are caught by ErrorBoundary components
- Database errors should be logged and user-friendly messages displayed
- Authentication errors trigger appropriate redirects

## Environment Configuration

### Required Environment Variables
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI Configuration
GEMINI_API_KEY=your_google_gemini_api_key
```

### Setup Process
1. Copy environment variables to `.env.local`
2. Run `npm run setup` to initialize database and create admin user
3. Default admin credentials: `nchaitanyanaidu@yahoo.com` / `adminncn@20`

## Testing Strategy

### Test Structure
- Unit tests in `src/__tests__/` directory
- Component tests use React Testing Library
- API route tests mock Supabase clients
- Authentication tests verify role-based access

### Running Specific Tests
```bash
# Test specific component
npm test -- --testPathPattern="components/auth"

# Test with coverage
npm test -- --coverage

# Test API routes
npm test -- --testPathPattern="api"
```

## Common Development Tasks

### Adding New Features
1. Create feature components in `src/components/features/`
2. Add corresponding API routes in `src/app/api/`
3. Update database schema if needed (via Supabase dashboard)
4. Test with both admin and student user roles

### Debugging Issues
- Check browser dev tools for client-side errors
- Monitor Supabase logs for database/auth issues
- Use `npm run clear-cache` for Next.js build problems
- Verify environment variables are properly loaded

### Database Changes
- Schema changes should be made through Supabase dashboard
- Update TypeScript types in `src/types/` after schema changes
- Test RLS policies with different user roles
- Consider migration scripts for production deployments

## Performance Considerations

- Next.js App Router provides automatic code splitting
- Images are optimized through Next.js Image component
- Real-time subscriptions are cleaned up properly to prevent memory leaks
- File uploads are handled efficiently through Supabase Storage
- AI responses use streaming for better user experience
