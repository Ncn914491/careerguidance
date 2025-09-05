# Authentication System

This document explains the authentication system implemented for the Career Guidance Website.

## Overview

The authentication system uses Supabase Auth with a special bypass mechanism for the seeded admin user. It includes:

- Admin user seeding with predefined credentials
- Auth bypass for the seeded admin user
- Role-based access control (student/admin)
- API endpoints for authentication operations

## Admin User

### Credentials
- **Email**: `nchaitanyanaidu@yahoo.com`
- **Password**: `adminncn@20`
- **Role**: `admin`

### Seeding the Admin User

To create the admin user, run:

```bash
npm run db:seed-admin
```

This script will:
1. Create the admin user in Supabase Auth (if not exists)
2. Create/update the profile with admin role
3. Handle cases where the user already exists

### Auth Bypass

The seeded admin user has a special authentication bypass that:
- Skips normal login flow for the specific admin credentials
- Automatically grants admin privileges
- Allows immediate access without email verification

## API Endpoints

### POST /api/auth/login
Authenticate a user with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Authentication successful",
  "user": {
    "id": "user-id",
    "email": "user@example.com"
  },
  "isAdmin": false,
  "bypassUsed": false
}
```

### POST /api/auth/logout
Sign out the current user.

**Response:**
```json
{
  "message": "Signed out successfully"
}
```

### GET /api/auth/me
Get current user information.

**Response:**
```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com"
  },
  "isAdmin": false,
  "isSeededAdmin": false
}
```

### POST /api/admin/seed
Seed the admin user (development only).

**Headers:**
```
x-seed-token: dev-seed-token
```

## Authentication Utilities

### `isSeededAdmin(email: string): boolean`
Check if an email belongs to the seeded admin user.

### `authenticateUser(email: string, password: string)`
Authenticate a user with bypass support for the seeded admin.

### `getCurrentUser()`
Get the current authenticated user and their role.

### `requireAdmin()`
Middleware function to ensure the current user has admin privileges.

### `createUserProfile(userId: string, email: string, fullName?: string)`
Create a user profile after signup.

## Usage Examples

### Client-side Authentication Check
```typescript
import { getCurrentUser } from '@/lib/auth'

const { user, isAdmin } = await getCurrentUser()

if (isAdmin) {
  // Show admin features
}
```

### API Route Protection
```typescript
import { requireAdmin } from '@/lib/auth'

export default async function handler(req, res) {
  try {
    await requireAdmin()
    // Admin-only logic here
  } catch (error) {
    return res.status(403).json({ error: 'Admin access required' })
  }
}
```

## Security Notes

1. The admin bypass is only for the specific seeded admin email
2. All other users go through normal Supabase authentication
3. Row-Level Security (RLS) policies are enforced at the database level
4. Admin seeding should only be used in development/initial setup

## Testing

Run the authentication tests:

```bash
npm test tests/lib/auth.test.ts
```

The tests cover:
- Admin email identification
- Credential validation
- Auth bypass functionality