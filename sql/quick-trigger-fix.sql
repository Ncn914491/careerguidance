-- QUICK TRIGGER CONFLICT FIX
-- Run this first to resolve the trigger dependency error
-- Then run the comprehensive fix

-- Drop the problematic function with CASCADE to remove all dependencies
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Confirm the function and its triggers are gone
SELECT 'Function and triggers dropped successfully' as status;