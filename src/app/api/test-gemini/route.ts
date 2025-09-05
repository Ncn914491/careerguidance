import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET() {
  try {
    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ 
        success: false,
        error: 'GEMINI_API_KEY not configured',
        message: 'Please set the GEMINI_API_KEY environment variable',
        apiKeyConfigured: false,
        apiKeyLength: 0
      }, { status: 500 });
    }

    // Log API key info (safely)
    const apiKeyLength = process.env.GEMINI_API_KEY.length;
    const apiKeyPrefix = process.env.GEMINI_API_KEY.substring(0, 8);
    console.log(`Testing Gemini API with key length: ${apiKeyLength}, prefix: ${apiKeyPrefix}...`);

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-pro',
      generationConfig: {
        maxOutputTokens: 100,
        temperature: 0.7,
      }
    });

    // Test with a simple prompt
    const testPrompt = "Say 'Hello! Gemini AI is working correctly.' and nothing else.";
    
    console.log('Sending test request to Gemini API...');
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout after 15 seconds')), 15000);
    });

    const geminiPromise = model.generateContent(testPrompt);
    
    const result = await Promise.race([geminiPromise, timeoutPromise]) as any;
    
    console.log('Received response from Gemini API');
    
    if (!result || !result.response) {
      throw new Error('Invalid response structure from Gemini API');
    }
    
    const response = result.response;
    const aiResponse = response.text();
    
    if (!aiResponse) {
      throw new Error('Empty response text from Gemini API');
    }

    console.log('Gemini API test successful');

    return NextResponse.json({
      success: true,
      message: 'Gemini API is working correctly',
      response: aiResponse,
      timestamp: new Date().toISOString(),
      apiKeyConfigured: true,
      apiKeyLength,
      apiKeyPrefix
    });

  } catch (error) {
    console.error('Gemini API test failed:', error);
    
    let errorMessage = 'Unknown error occurred';
    let errorType = 'unknown';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('Full error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      if (error.message.includes('timeout')) {
        errorType = 'timeout';
        errorMessage = 'Request timed out - Gemini API is not responding within 15 seconds';
        statusCode = 408;
      } else if (error.message.includes('API_KEY_INVALID') || error.message.includes('authentication') || error.message.includes('401')) {
        errorType = 'authentication';
        errorMessage = 'Invalid API key - please check your GEMINI_API_KEY';
        statusCode = 401;
      } else if (error.message.includes('quota') || error.message.includes('limit') || error.message.includes('429')) {
        errorType = 'quota';
        errorMessage = 'API quota exceeded or rate limit reached';
        statusCode = 429;
      } else if (error.message.includes('network') || error.message.includes('fetch') || error.message.includes('ENOTFOUND')) {
        errorType = 'network';
        errorMessage = 'Network error - cannot reach Gemini API servers';
        statusCode = 503;
      } else if (error.message.includes('BLOCKED')) {
        errorType = 'blocked';
        errorMessage = 'Request blocked by Gemini API safety filters';
        statusCode = 400;
      }
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
      errorType,
      timestamp: new Date().toISOString(),
      apiKeyConfigured: !!process.env.GEMINI_API_KEY,
      apiKeyLength: process.env.GEMINI_API_KEY?.length || 0,
      fullError: error instanceof Error ? error.message : String(error)
    }, { status: statusCode });
  }
}

export async function POST() {
  return NextResponse.json({
    error: 'Method not allowed. Use GET to test Gemini API connectivity.'
  }, { status: 405 });
}