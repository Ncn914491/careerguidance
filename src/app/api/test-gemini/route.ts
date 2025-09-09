import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET() {
  try {
    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ 
        success: false,
        error: 'Gemini API key not configured' 
      }, { status: 500 });
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Test with a simple prompt
    const result = await model.generateContent('Say "Hello! Gemini AI is working correctly."');
    const response = result.response;
    const text = response.text();

    return NextResponse.json({
      success: true,
      response: text,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Gemini test error:', error);
    
    let errorMessage = 'Failed to connect to Gemini AI';
    if (error instanceof Error) {
      if (error.message.includes('API_KEY')) {
        errorMessage = 'Invalid Gemini API key';
      } else if (error.message.includes('quota')) {
        errorMessage = 'Gemini API quota exceeded';
      }
    }

    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}