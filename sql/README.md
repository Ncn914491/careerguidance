# Database Setup Guide

This directory contains the SQL schema and migration scripts for the Career Guidance Project Website.

## Files

- `init.sql` - Complete database schema with tables, RLS policies, indexes, and functions
- `storage-setup.sql` - Storage bucket and policies setup for file uploads
- `migrate.js` - Node.js migration script for automated deployment
- `seed.sql` - Initial data seeding (created separately)

## Setup Options

### Option 1: Manual Setup (Supabase Dashboard)

1. **Access Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor

2. **Execute Schema**
   - Copy the contents of `init.sql`
   - Paste into the SQL Editor
   - Click "Run" to execute all statements

3. **Setup Storage**
   - Copy the contents of `storage-setup.sql`
   - Paste into the SQL Editor
   - Click "Run" to create storage bucket and policies

4. **Verify Setup**
   - Check the "Table Editor" to confirm all tables are created
   - Verify RLS policies are enabled in the "Authentication" > "Policies" section
   - Check "Storage" section to confirm `week-files` bucket exists

### Option 2: Automated Migration (Recommended)

1. **Install Dependencies**
   ```bash
   npm install @supabase/supabase-js dotenv
   ```

2. **Set Environment Variables**
   Create `.env.local` with:
   ```
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

3. **Run Migration Script**
   ```bash
   node sql/migrate.js
   ```

### Option 3: Supabase CLI (Advanced)

1. **Install Supabase CLI**
   ```bash
   npm install -g supabase
   ```

2. **Initialize Project**
   ```bash
   supabase init
   supabase link --project-ref your-project-ref
   ```

3. **Apply Migration**
   ```bash
   supabase db push
   ```

## Schema Overview

### Core Tables

- **profiles** - User profiles with role-based access (student/admin)
- **schools** - Schools visited during the program
- **team_members** - Team member information
- **weeks** - Weekly content organization
- **week_files** - Files associated with weeks (photos, videos, PDFs)
- **groups** - Group chat functionality
- **group_members** - Group membership management
- **group_messages** - Real-time group messages
- **ai_chats** - AI chat conversations with 30-day auto-expiry
- **admin_requests** - Admin role request workflow

### Security Features

- **Row-Level Security (RLS)** enabled on all tables
- **Role-based access control** with student/admin roles
- **Secure policies** for data access and modification
- **Automatic cleanup** for expired AI chat data

### Performance Optimizations

- **Indexes** on frequently queried columns
- **Foreign key constraints** for data integrity
- **Efficient query patterns** for real-time features

## Troubleshooting

### Common Issues

1. **Permission Denied**
   - Ensure you're using the service role key for migrations
   - Check that RLS policies allow the intended operations

2. **Table Already Exists**
   - Drop existing tables if recreating schema
   - Use `DROP TABLE IF EXISTS` statements if needed

3. **Foreign Key Violations**
   - Ensure auth.users table exists (created by Supabase Auth)
   - Check that referenced tables are created in correct order

### Verification Queries

```sql
-- Check all tables are created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

## Next Steps

After setting up the database schema:

1. **Seed Initial Data** - Run seed scripts for team members and schools
2. **Test Connections** - Verify Supabase client can connect and query
3. **Configure Authentication** - Set up auth providers and user management
4. **Enable Realtime** - Configure realtime subscriptions for group chat

## Security Notes

- Never commit service role keys to version control
- Use environment variables for all sensitive configuration
- Regularly review and audit RLS policies
- Monitor database performance and query patterns