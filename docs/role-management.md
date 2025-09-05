# Role Management System

This document explains the role-based access control system implemented for the Career Guidance Website.

## Overview

The system supports three user roles with automatic role transitions based on admin requests:

- **student**: Default role for new users
- **pending_admin**: Users who have requested admin access
- **admin**: Users with full administrative privileges

## User Schema

The `profiles` table contains user information with role-based access:

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin', 'pending_admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Role Transitions

### 1. New User Signup
- User signs up → Role: `student`
- Profile created automatically with default role

### 2. Admin Request Process
- Student requests admin access → Role: `pending_admin`
- Admin approves request → Role: `admin`
- Admin denies request → Role: `student`

## Admin User Setup

### Seeded Admin Credentials
- **Email**: `nchaitanyanaidu@yahoo.com`
- **Password**: `adminncn@20`
- **Role**: `admin`

### Creating the Admin User

```bash
# Run the admin seeding script
npm run db:seed-admin
```

This will:
1. Create the admin user in Supabase Auth
2. Create the profile with admin role
3. Handle cases where the user already exists

## API Endpoints

### Admin Request Management

#### POST /api/admin/requests
Create a new admin request (students only).

**Request Body:**
```json
{
  "reason": "I need admin access to manage content for the project"
}
```

**Response:**
```json
{
  "request": {
    "id": "uuid",
    "user_id": "uuid", 
    "reason": "...",
    "status": "pending",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### GET /api/admin/requests
Fetch admin requests.
- **Students**: Returns only their own requests
- **Admins**: Returns all requests with user details

#### PATCH /api/admin/requests/[id]
Approve or deny admin requests (admins only).

**Request Body:**
```json
{
  "action": "approve" // or "deny"
}
```

## Database Triggers

The system uses database triggers to automatically manage role transitions:

### 1. Admin Request Creation Trigger
```sql
CREATE TRIGGER trigger_update_role_on_admin_request
  AFTER INSERT ON admin_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_user_role_on_admin_request();
```

When a new admin request is created:
- User role changes from `student` → `pending_admin`

### 2. Admin Request Status Change Trigger
```sql
CREATE TRIGGER trigger_handle_admin_request_status_change
  AFTER UPDATE ON admin_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_admin_request_status_change();
```

When admin request status changes:
- **Approved**: `pending_admin` → `admin`
- **Denied**: `pending_admin` → `student`

## Row-Level Security (RLS) Policies

### Profiles Table
- **Read**: All authenticated users can view profiles
- **Update**: Users can only update their own profile
- **Insert**: Users can only create their own profile

### Admin Requests Table
- **Read**: 
  - Students: Only their own requests
  - Admins: All requests
- **Create**: Students can create requests
- **Update**: Only admins can approve/deny requests

### Other Tables
- **Schools, Team Members, Weeks, Week Files**: 
  - Read: Everyone
  - Create/Update: Admins only
- **Groups, Messages**: Member-based access
- **AI Chats**: User-specific access

## Migration

To add pending_admin role support to existing database:

```bash
# Run the migration script
npm run db:migrate-pending-admin
```

Or manually execute the SQL in `sql/add-pending-admin-role.sql`.

## Usage Examples

### Check User Role (Client-side)
```typescript
import { getCurrentUser } from '@/lib/auth'

const { user, isAdmin, isPendingAdmin } = await getCurrentUser()

if (isAdmin) {
  // Show admin features
} else if (isPendingAdmin) {
  // Show pending status
} else {
  // Show student features
}
```

### Protect API Routes
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

### Request Admin Access (Client-side)
```typescript
const response = await fetch('/api/admin/requests', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    reason: 'I need admin access to manage project content' 
  })
})
```

## Security Features

1. **Automatic Role Management**: Database triggers ensure consistent role transitions
2. **Row-Level Security**: Database-level access control
3. **Admin Bypass**: Special authentication for seeded admin
4. **Request Validation**: Prevents duplicate pending requests
5. **Atomic Operations**: Role updates are transactional

## Testing

Run the role management tests:

```bash
npm test tests/integration/role-management.test.ts
```

## Troubleshooting

### Common Issues

1. **Migration Fails**: Run SQL manually in Supabase dashboard
2. **Role Not Updating**: Check database triggers are created
3. **Admin Access Denied**: Verify admin user is properly seeded
4. **Duplicate Requests**: Check for existing pending requests

### Verification Commands

```bash
# Verify admin user exists
npm run db:verify

# Check database schema
# Run in Supabase SQL editor:
SELECT * FROM profiles WHERE role = 'admin';
SELECT * FROM admin_requests WHERE status = 'pending';
```