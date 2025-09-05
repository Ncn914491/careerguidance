# Role Management Setup Guide

This guide walks you through setting up the complete role management system for the Career Guidance Website.

## Prerequisites

- Supabase project set up
- Environment variables configured in `.env.local`
- Node.js and npm installed

## Step-by-Step Setup

### 1. Update Database Schema

First, apply the database schema with role management support:

```bash
# If starting fresh, run the main schema
# (This is already done if you've set up the project)

# Apply the pending_admin role migration
npm run db:migrate-pending-admin
```

**Alternative: Manual SQL Execution**

If the migration script fails, run the SQL manually in Supabase dashboard:

1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `sql/add-pending-admin-role.sql`
3. Execute the SQL

### 2. Seed the Admin User

Create the initial admin user with the specified credentials:

```bash
npm run db:seed-admin
```

This creates:
- **Email**: `nchaitanyanaidu@yahoo.com`
- **Password**: `adminncn@20`
- **Role**: `admin`

### 3. Verify the Setup

Run the verification script to ensure everything is working:

```bash
npm run db:verify-roles
```

This checks:
- ✅ Admin user exists and is configured correctly
- ✅ Database functions and triggers are in place
- ✅ Row-Level Security policies are enabled
- ✅ Role transitions work properly

### 4. Test the System

Run the integration tests:

```bash
npm test tests/integration/role-management.test.ts
```

## Manual Verification Steps

### 1. Check Admin User

Login to your application with:
- Email: `nchaitanyanaidu@yahoo.com`
- Password: `adminncn@20`

You should have access to admin features.

### 2. Test Student Registration

1. Create a new user account
2. Verify they get `student` role by default
3. Navigate to `/request-admin` page
4. Submit an admin request
5. Check that role changes to `pending_admin`

### 3. Test Admin Approval Process

1. Login as admin
2. Go to admin dashboard
3. View pending admin requests
4. Approve or deny requests
5. Verify user roles update accordingly

## Database Schema Overview

### Profiles Table
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

### Admin Requests Table
```sql
CREATE TABLE admin_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  reviewed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE
);
```

## Role Transition Flow

```
New User Signup
       ↓
   [student] ──────────────────────────────────┐
       ↓                                       ↓
Request Admin Access                    Continue as Student
       ↓                                       ↓
[pending_admin] ────────────────────────────────┘
       ↓
Admin Reviews Request
       ↓
   ┌─────────┬─────────┐
   ↓         ↓         ↓
Approve    Deny    Ignore
   ↓         ↓         ↓
[admin]  [student] [pending_admin]
```

## API Endpoints Summary

| Endpoint | Method | Description | Access |
|----------|--------|-------------|---------|
| `/api/admin/requests` | GET | List admin requests | Students: own requests, Admins: all |
| `/api/admin/requests` | POST | Create admin request | Students only |
| `/api/admin/requests/[id]` | PATCH | Approve/deny request | Admins only |

## Troubleshooting

### Common Issues

#### 1. Migration Fails
```bash
# Error: Could not execute migration
```
**Solution**: Run SQL manually in Supabase dashboard

#### 2. Admin User Not Created
```bash
# Error: Admin user creation failed
```
**Solutions**:
- Check environment variables are set correctly
- Verify Supabase service role key has admin permissions
- Run `npm run db:seed-admin` again

#### 3. Role Not Updating
```bash
# User role doesn't change after admin request
```
**Solutions**:
- Check database triggers are created
- Verify RLS policies allow role updates
- Check API logs for errors

#### 4. Access Denied Errors
```bash
# Error: Admin privileges required
```
**Solutions**:
- Verify user has correct role in database
- Check authentication session is valid
- Ensure RLS policies are correctly configured

### Verification Commands

```bash
# Check admin user exists
npm run db:verify-roles

# Check database schema
# Run in Supabase SQL Editor:
SELECT * FROM profiles WHERE role = 'admin';
SELECT * FROM admin_requests WHERE status = 'pending';

# Check triggers exist
SELECT tgname FROM pg_trigger WHERE tgname LIKE '%admin%';

# Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;
```

## Security Considerations

1. **Row-Level Security**: All tables have RLS enabled
2. **Role Validation**: Database constraints prevent invalid roles
3. **Atomic Operations**: Role transitions are handled in transactions
4. **Admin Bypass**: Special authentication for seeded admin only
5. **Request Validation**: Prevents duplicate pending requests

## Next Steps

After setup is complete:

1. **Customize Admin Dashboard**: Add admin-specific features
2. **Email Notifications**: Notify users when requests are processed
3. **Audit Logging**: Track role changes and admin actions
4. **Bulk Operations**: Allow admins to manage multiple requests
5. **Role Permissions**: Fine-tune what each role can access

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the logs in Supabase dashboard
3. Run the verification script: `npm run db:verify-roles`
4. Check the integration tests: `npm test tests/integration/role-management.test.ts`