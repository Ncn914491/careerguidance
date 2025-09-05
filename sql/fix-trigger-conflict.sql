-- FIX TRIGGER CONFLICT
-- This script safely removes existing triggers and recreates the profile creation system
-- Run this if you get errors about dependent objects on handle_new_user function

BEGIN;

-- ============================================================================
-- SAFE TRIGGER AND FUNCTION CLEANUP
-- ============================================================================

-- Method 1: Drop with CASCADE (handles all dependencies automatically)
DO $$
BEGIN
    -- Try to drop function with CASCADE to remove all dependent triggers
    DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
    RAISE NOTICE 'Successfully dropped handle_new_user function and dependencies';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not drop function with CASCADE: %', SQLERRM;
END $$;

-- Method 2: Manual cleanup if CASCADE didn't work
DO $$
BEGIN
    -- Drop specific triggers that might exist
    PERFORM 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created';
    IF FOUND THEN
        DROP TRIGGER on_auth_user_created ON auth.users;
        RAISE NOTICE 'Dropped trigger: on_auth_user_created';
    END IF;
    
    PERFORM 1 FROM pg_trigger WHERE tgname = 'on_auth_user_confirmed';
    IF FOUND THEN
        DROP TRIGGER on_auth_user_confirmed ON auth.users;
        RAISE NOTICE 'Dropped trigger: on_auth_user_confirmed';
    END IF;
    
    -- Try to drop function again
    DROP FUNCTION IF EXISTS public.handle_new_user();
    RAISE NOTICE 'Function handle_new_user dropped successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Manual cleanup error: %', SQLERRM;
END $$;

-- ============================================================================
-- RECREATE PROFILE CREATION SYSTEM
-- ============================================================================

-- Create improved profile creation function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert new profile with error handling
  INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name', 
      split_part(NEW.email, '@', 1)
    ),
    'student',
    NOW(),
    NOW()
  );
  
  RAISE NOTICE 'Created profile for user: %', NEW.email;
  RETURN NEW;
  
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, update it instead
    UPDATE public.profiles 
    SET 
      email = NEW.email,
      updated_at = NOW()
    WHERE id = NEW.id;
    RAISE NOTICE 'Updated existing profile for user: %', NEW.email;
    RETURN NEW;
    
  WHEN OTHERS THEN
    -- Log error but don't fail the auth process
    RAISE WARNING 'Failed to create/update profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signups
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- VERIFY SETUP
-- ============================================================================

-- Check if trigger was created successfully
DO $$
BEGIN
    PERFORM 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created';
    IF FOUND THEN
        RAISE NOTICE '✅ Trigger on_auth_user_created created successfully';
    ELSE
        RAISE NOTICE '❌ Failed to create trigger on_auth_user_created';
    END IF;
    
    PERFORM 1 FROM pg_proc WHERE proname = 'handle_new_user';
    IF FOUND THEN
        RAISE NOTICE '✅ Function handle_new_user created successfully';
    ELSE
        RAISE NOTICE '❌ Failed to create function handle_new_user';
    END IF;
END $$;

COMMIT;

-- ============================================================================
-- USAGE INSTRUCTIONS
-- ============================================================================

-- After running this script:
-- 1. Test by creating a new user account
-- 2. Check that a profile is automatically created in the profiles table
-- 3. If issues persist, check the Supabase logs for detailed error messages

-- To test the trigger manually (replace with actual user data):
-- INSERT INTO auth.users (id, email, raw_user_meta_data) 
-- VALUES (gen_random_uuid(), 'test@example.com', '{"full_name": "Test User"}');