import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import { getCurrentUserServer } from '@/lib/auth-server';

// Use admin client for database operations
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
    // Check authentication
    const { user } = await getCurrentUserServer(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ 
        error: 'AI service not configured. Please contact administrator.' 
      }, { status: 500 });
    }

    const { message } = await request.json();

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Initialize Gemini AI with Flash model
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash', // Use stable Gemini 1.5 Flash model
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });

    // Create a career guidance focused prompt
    const systemPrompt = `You are a helpful AI assistant for a Career Guidance Program. Your role is to:

1. Provide career advice and guidance to students
2. Help with educational planning and course selection
3. Offer insights about different career paths and industries
4. Assist with resume writing and interview preparation
5. Share information about job market trends and opportunities
6. Support students in developing professional skills

Please provide helpful, accurate, and encouraging responses. Keep your answers concise but informative. If you're unsure about something, it's okay to say so and suggest they consult with a career counselor or do additional research.

Student's question: ${message.trim()}`;

    // Generate response with timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 30000);
    });

    const geminiPromise = model.generateContent(systemPrompt);
    
    const result = await Promise.race([geminiPromise, timeoutPromise]) as any;
    
    if (!result || !result.response) {
      throw new Error('Invalid response from AI service');
    }
    
    const response = result.response;
    const aiResponse = response.text();
    
    if (!aiResponse) {
      throw new Error('Empty response from AI service');
    }

    // Save chat to database with auto-expiry (30 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const { error: saveError } = await supabaseAdmin
      .from('ai_chats')
      .insert({
        user_id: user.id,
        message: message.trim(),
        response: aiResponse,
        expires_at: expiresAt.toISOString()
      });

    if (saveError) {
      console.error('Error saving chat:', saveError);
      // Don't fail the request if saving fails
    }

    return NextResponse.json({
      response: aiResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI Chat error:', error);
    
    let errorMessage = 'Sorry, I encountered an error. Please try again.';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        errorMessage = 'The AI service is taking too long to respond. Please try again.';
        statusCode = 408;
      } else if (error.message.includes('quota') || error.message.includes('limit')) {
        errorMessage = 'The AI service is currently at capacity. Please try again later.';
        statusCode = 429;
      } else if (error.message.includes('BLOCKED')) {
        errorMessage = 'Your message was blocked by safety filters. Please rephrase your question.';
        statusCode = 400;
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

// GET endpoint to retrieve chat history
export async function GET(request: NextRequest) {
  try {
    const { user } = await getCurrentUserServer(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get recent chat history (last 50 messages, not expired)
    const { data: chats, error } = await supabaseAdmin
      .from('ai_chats')
      .select('message, response, created_at')
      .eq('user_id', user.id)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching chat history:', error);
      return NextResponse.json({ error: 'Failed to fetch chat history' }, { status: 500 });
    }

    return NextResponse.json({ 
      chats: (chats || []).reverse() // Reverse to show oldest first
    });

  } catch (error) {
    console.error('Error in GET /api/ai-chat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}