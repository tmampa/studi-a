import { NextResponse } from 'next/server';
import { getGeminiResponse } from '@/lib/gemini';
import { verifyAuth } from '../../../lib/auth-utils';

export async function POST(req) {
  try {
    // Verify authentication
    const userId = await verifyAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get message from request body
    const { message } = await req.json();
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get response from Gemini
    const response = await getGeminiResponse(message);
    
    return NextResponse.json({ message: response });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
