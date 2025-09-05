import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import { getCurrentUser } from '@/lib/auth-client';
import { validateEnvironmentVariables } from '@/lib/env-validation';

// Validate environment variables on startup
const envValidation = validateEnvironmentVariables();

// Initialize Gemini AI only if API key is available
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// Initialize Supabase client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: NextRequest) {
  try {
    const { message, userId } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Validate API key and Gemini client
    if (!genAI || !process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not configured or invalid');
      return NextResponse.json({ 
        error: 'AI service not configured',
        response: "I'm sorry, the AI service is currently unavailable. Please contact an administrator."
      }, { status: 500 });
    }

    // For demo purposes, if userId is provided (from component), use it
    // Otherwise, try to get authenticated user, or use a demo user ID
    let actualUserId = userId;
    
    if (!actualUserId) {
      const { user } = await getCurrentUser();
      if (user) {
        actualUserId = user.id;
      } else {
        // For demo purposes, use a temporary user ID if no authentication
        actualUserId = 'demo-user-' + Math.random().toString(36).substr(2, 9);
      }
    }

    // Get the generative model with timeout configuration
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-pro',
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      }
    });

    // Create a context-aware prompt for the career guidance program
    const contextPrompt = `You are an AI assistant for a Career Guidance Project Website. This is an educational outreach program that visits schools to provide career guidance to students. The program has:

- Visited 5+ schools
- Has a team of 11 members
- Taught 500+ students
- Conducted 15+ visits

The website features:
- Weekly content uploads (photos, videos, PDFs from school visits)
- Group chat functionality for students
- Admin panel for content management
- Statistics dashboard

Please provide helpful, encouraging, and informative responses related to career guidance, education, and the program. Keep responses concise and student-friendly (max 200 words).

User question: ${message}`;

    // Generate response from Gemini with timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 30000); // 30 second timeout
    });

    const geminiPromise = model.generateContent(contextPrompt);
    
    const result = await Promise.race([geminiPromise, timeoutPromise]) as any;
    const response = result.response;
    const aiResponse = response.text();

    // Store the chat in the database with 30-day auto-expiry
    const { error: dbError } = await supabaseAdmin
      .from('ai_chats')
      .insert({
        user_id: actualUserId,
        message: message,
        response: aiResponse,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      });

    if (dbError) {
      console.error('Error storing chat:', dbError);
      // Continue even if storage fails - don't block the user
    }

    return NextResponse.json({ 
      response: aiResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in AI chat:', error);
    
    // Provide specific fallback responses based on error type
    let fallbackResponse = "I'm sorry, I'm having trouble processing your request right now. Please try again later.";
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('Request timeout')) {
        fallbackResponse = "The AI service is taking longer than expected. Please try asking a shorter question or try again in a moment.";
        statusCode = 408; // Request Timeout
      } else if (error.message.includes('API key') || error.message.includes('authentication')) {
        fallbackResponse = "The AI service is currently unavailable. Please contact an administrator.";
        statusCode = 503; // Service Unavailable
      } else if (error.message.includes('quota') || error.message.includes('limit')) {
        fallbackResponse = "The AI service has reached its usage limit. Please try again later.";
        statusCode = 429; // Too Many Requests
      }
    }
    
    return NextResponse.json({ 
      error: 'AI service error',
      response: fallbackResponse,
      timestamp: new Date().toISOString()
    }, { status: statusCode });
  }
}

export async function GET() {
  try {
    const { user } = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Fetch user's chat history (non-expired chats only)
    const { data: chats, error } = await supabaseAdmin
      .from('ai_chats')
      .select('id, message, response, created_at')
      .eq('user_id', user.id)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(50); // Limit to last 50 chats

    if (error) {
      console.error('Error fetching chat history:', error);
      return NextResponse.json({ error: 'Failed to fetch chat history' }, { status: 500 });
    }

    return NextResponse.json({ chats: chats || [] });
  } catch (error) {
    console.error('Error in AI chat GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}