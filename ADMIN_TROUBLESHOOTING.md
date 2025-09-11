# Admin Panel Troubleshooting Guide

## Current Status ✅
- ✅ Database tables are set up correctly
- ✅ Storage buckets are configured  
- ✅ Admin user exists: `nchaitanyanaidu@yahoo.com`
- ✅ Career resources exist (3 total, duplicate removed)
- ✅ APIs are working correctly

## The Problem
You're not seeing the upload/delete options for career resources in the admin panel.

## Troubleshooting Steps

### Step 1: Verify You're Logged In as Admin
1. Open the web app in your browser
2. Make sure you're logged in as `nchaitanyanaidu@yahoo.com`
3. Navigate to `/admin` page
4. Check if you can see the admin panel at all

### Step 2: Check the Career Resources Tab
1. On the admin page, look for two tabs at the top:
   - 📅 "Week Content" (blue tab)
   - 🎯 "Career Resources" (should be clickable)
2. **Click on the "Career Resources" tab**
3. You should see:
   - A form to add new career resources
   - A yellow debug box showing your current state
   - A list of existing resources with delete buttons

### Step 3: Look for the Debug Info Box
When on the Career Resources tab, you should see a yellow debug box that shows:
- Active Tab: career-resources  
- Resources Loading: No/Yes
- Resources Count: 3
- Upload State: Ready

### Step 4: Check Browser Console
1. Press F12 to open browser dev tools
2. Go to Console tab
3. Look for any JavaScript errors (red text)
4. Refresh the admin page and check for errors

### Step 5: Check Network Tab
1. In browser dev tools, go to Network tab
2. Refresh the admin page
3. Look for these API calls:
   - `/api/career-resources` (should return 200 status)
4. Click on the API call to see the response

## Expected UI Elements

When on the Career Resources tab, you should see:

### Upload Form:
- Title field
- Resource Type dropdown (Text/Photo/PDF/PowerPoint)  
- Description field
- File upload area (if not text type)
- Green "📤 Upload Career Resource" button

### Existing Resources List:
- Cards showing each career resource
- Each card has a red trash/delete button 🗑️
- Resource titles and types are displayed

## If Still Not Working

### Manual Check via Browser Developer Tools:
1. Open admin page
2. Press F12 → Console
3. Type: `localStorage.getItem('supabase.auth.token')`
4. If this returns `null`, you're not logged in
5. Type: `document.querySelector('[data-tab="career-resources"]')` 
6. If this returns `null`, the tab isn't rendering

### Quick Fix Options:
1. **Clear browser cache and cookies**
2. **Try incognito/private browsing mode**
3. **Log out and log back in**
4. **Try a different browser**

## Test Data Available
There are now 3 career resources in your database:
1. "CSP Presentation - csp" (PPT)
2. "Test Career Resource (Delete Me)" (Text) - created by debug script

You should be able to see and delete these from the admin panel once the UI is working.

## Next Steps
1. Try the troubleshooting steps above
2. Let me know what you see at each step
3. If you're still not seeing the UI elements, send me screenshots of:
   - The admin page 
   - Browser console errors
   - Network tab showing API responses
