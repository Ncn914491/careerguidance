import { validateEnvironmentVariables, getVercelEnvironment, isVercelDeployment, getBaseUrl, getConfig } from '@/lib/env-validation';

describe('Environment Variable Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('validateEnvironmentVariables', () => {
    it('should pass validation with all required variables', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
      process.env.GEMINI_API_KEY = 'test-gemini-key';

      const result = validateEnvironmentVariables();

      expect(result.isValid).toBe(true);
      expect(result.missingVars).toHaveLength(0);
      expect(result.supabaseUrl).toBe('https://test.supabase.co');
      expect(result.supabaseAnonKey).toBe('test-anon-key');
    });

    it('should fail validation with missing public variables', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const result = validateEnvironmentVariables();

      expect(result.isValid).toBe(false);
      expect(result.missingVars).toContain('NEXT_PUBLIC_SUPABASE_URL');
      expect(result.missingVars).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    });

    it('should throw error in production with missing variables', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      expect(() => validateEnvironmentVariables()).toThrow('Missing required environment variables');
    });

    it('should warn in development with missing variables', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = validateEnvironmentVariables();

      expect(result.isValid).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Some environment variables are missing'));

      consoleSpy.mockRestore();
    });
  });

  describe('getVercelEnvironment', () => {
    it('should detect Vercel environment', () => {
      process.env.VERCEL = '1';
      process.env.VERCEL_ENV = 'production';
      process.env.VERCEL_URL = 'myapp.vercel.app';
      process.env.VERCEL_REGION = 'iad1';

      const result = getVercelEnvironment();

      expect(result.isVercel).toBe(true);
      expect(result.environment).toBe('production');
      expect(result.url).toBe('myapp.vercel.app');
      expect(result.region).toBe('iad1');
    });

    it('should handle non-Vercel environment', () => {
      delete process.env.VERCEL;
      delete process.env.VERCEL_ENV;

      const result = getVercelEnvironment();

      expect(result.isVercel).toBe(false);
      expect(result.environment).toBe('development');
    });
  });

  describe('isVercelDeployment', () => {
    it('should return true when VERCEL env var is set', () => {
      process.env.VERCEL = '1';
      expect(isVercelDeployment()).toBe(true);
    });

    it('should return false when VERCEL env var is not set', () => {
      delete process.env.VERCEL;
      expect(isVercelDeployment()).toBe(false);
    });
  });

  describe('getBaseUrl', () => {
    it('should return Vercel URL when available', () => {
      process.env.VERCEL_URL = 'myapp.vercel.app';
      expect(getBaseUrl()).toBe('https://myapp.vercel.app');
    });

    it('should return production URL in production without Vercel', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.VERCEL_URL;
      expect(getBaseUrl()).toBe('https://your-domain.vercel.app');
    });

    it('should return localhost in development', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.VERCEL_URL;
      expect(getBaseUrl()).toBe('http://localhost:3000');
    });
  });

  describe('getConfig', () => {
    it('should return complete configuration', () => {
      process.env.NODE_ENV = 'production';
      process.env.VERCEL = '1';
      process.env.VERCEL_ENV = 'production';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
      process.env.GEMINI_API_KEY = 'test-gemini-key';

      const config = getConfig();

      expect(config.isVercel).toBe(true);
      expect(config.isProduction).toBe(true);
      expect(config.isDevelopment).toBe(false);
      expect(config.database.url).toBe('https://test.supabase.co');
      expect(config.database.anonKey).toBe('test-anon-key');
      expect(config.database.serviceRoleKey).toBe('test-service-key');
      expect(config.ai.geminiApiKey).toBe('test-gemini-key');
    });

    it('should detect preview environment', () => {
      process.env.VERCEL_ENV = 'preview';

      const config = getConfig();

      expect(config.isPreview).toBe(true);
    });
  });
});