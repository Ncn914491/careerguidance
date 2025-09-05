# Deployment Guide for Vercel

## Environment Variables Setup

### Required Environment Variables

Set these in your Vercel dashboard under Project Settings > Environment Variables:

#### Public Variables (available on client-side)
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

#### Server-Only Variables (secure, server-side only)
```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
```

### Getting Your Keys

#### Supabase Keys
1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the Project URL and anon/public key
4. Copy the service_role key (keep this secure!)

#### Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key (keep this secure!)

## Deployment Steps

### 1. Prepare Your Repository
```bash
# Ensure all tests pass
npm test

# Build the project locally to check for errors
npm run build

# Commit all changes
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Deploy to Vercel

#### Option A: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add GEMINI_API_KEY

# Deploy to production
vercel --prod
```

#### Option B: Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Add environment variables in Project Settings
4. Deploy

### 3. Post-Deployment Verification

#### Check Environment Variables
```bash
# Test API endpoints
curl https://your-app.vercel.app/api/askai -X POST \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "userId": "test"}'
```

#### Test Authentication Flow
1. Visit your deployed app
2. Try signing up with a test account
3. Verify email confirmation works
4. Test login and role-based access

#### Test AI Chat
1. Login as a student
2. Open the AI chat
3. Send a test message
4. Verify response is received

## Troubleshooting

### Common Issues

#### 1. Environment Variables Not Loading
- Check variable names match exactly
- Ensure NEXT_PUBLIC_ prefix for client-side variables
- Redeploy after adding variables

#### 2. Supabase Connection Issues
- Verify URL format: `https://project-id.supabase.co`
- Check RLS policies are properly configured
- Ensure service role key has proper permissions

#### 3. Gemini API Timeout
- Check API key is valid and has quota
- Monitor function execution time (30s limit)
- Check Vercel function logs

#### 4. Build Failures
```bash
# Check for TypeScript errors
npm run build

# Check for linting issues
npm run lint

# Run tests
npm test
```

### Vercel-Specific Considerations

#### Function Timeout
- API routes have a 30-second timeout on free tier
- Gemini API calls are configured with 30s timeout
- Consider upgrading for longer timeouts if needed

#### Cold Starts
- First request after inactivity may be slower
- Gemini client initialization happens on first request
- Consider implementing warming strategies for production

#### Environment Variables
- Use Vercel dashboard for secure variable management
- Preview deployments inherit environment variables
- Production and preview can have different values

## Monitoring and Maintenance

### Health Checks
Create a simple health check endpoint:

```typescript
// src/app/api/health/route.ts
export async function GET() {
  return Response.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL_ENV || 'development'
  });
}
```

### Logging
- Use Vercel's built-in logging
- Monitor function execution times
- Set up alerts for errors

### Updates
```bash
# Deploy updates
git push origin main

# Vercel will automatically deploy
# Check deployment status in dashboard
```

## Security Checklist

- [ ] Environment variables are properly configured
- [ ] Service role key is kept secure (server-side only)
- [ ] RLS policies are enabled in Supabase
- [ ] API routes validate user authentication
- [ ] CORS headers are properly configured
- [ ] No sensitive data in client-side code
- [ ] Regular security updates for dependencies

## Performance Optimization

### For Vercel Free Tier
- Optimize bundle size
- Use dynamic imports for large components
- Implement proper caching strategies
- Monitor function execution times
- Consider edge functions for better performance

### Database Optimization
- Use proper indexes in Supabase
- Implement connection pooling
- Cache frequently accessed data
- Use Supabase's built-in caching

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify environment variables
3. Test API endpoints individually
4. Check Supabase logs and metrics
5. Monitor Gemini API usage and quotas