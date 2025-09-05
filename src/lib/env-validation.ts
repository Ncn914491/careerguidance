// Environment variable validation for Vercel deployment
export function validateEnvironmentVariables() {
  const requiredEnvVars = {
    // Public environment variables (available on client-side)
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };

  const serverOnlyEnvVars = {
    // Server-only environment variables
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  };

  const missingVars: string[] = [];

  // Check required public variables
  Object.entries(requiredEnvVars).forEach(([key, value]) => {
    if (!value) {
      missingVars.push(key);
    }
  });

  // Check server-only variables (only on server-side)
  if (typeof window === 'undefined') {
    Object.entries(serverOnlyEnvVars).forEach(([key, value]) => {
      if (!value) {
        missingVars.push(key);
      }
    });
  }

  if (missingVars.length > 0) {
    const errorMessage = `Missing required environment variables: ${missingVars.join(', ')}`;
    console.error(errorMessage);
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error(errorMessage);
    } else {
      console.warn('⚠️  Some environment variables are missing. The app may not work correctly.');
    }
  }

  return {
    isValid: missingVars.length === 0,
    missingVars,
    supabaseUrl: requiredEnvVars.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: requiredEnvVars.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

// Vercel-specific environment variable helpers
export function getVercelEnvironment() {
  return {
    isVercel: !!process.env.VERCEL,
    environment: process.env.VERCEL_ENV || 'development',
    url: process.env.VERCEL_URL,
    region: process.env.VERCEL_REGION,
  };
}

// Check if we're in a Vercel deployment
export function isVercelDeployment() {
  return !!process.env.VERCEL;
}

// Get the appropriate base URL for API calls
export function getBaseUrl() {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  if (process.env.NODE_ENV === 'production') {
    // Replace with your production domain
    return 'https://your-domain.vercel.app';
  }
  
  return 'http://localhost:3000';
}

// Environment-specific configuration
export function getConfig() {
  const vercelEnv = getVercelEnvironment();
  
  return {
    ...vercelEnv,
    baseUrl: getBaseUrl(),
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isPreview: vercelEnv.environment === 'preview',
    database: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    ai: {
      geminiApiKey: process.env.GEMINI_API_KEY,
    },
  };
}