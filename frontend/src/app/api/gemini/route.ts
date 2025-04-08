import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': 'http://localhost:3000',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}

export async function POST(request: Request) {
  const token = cookies().get('next-auth.session-token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { message, conversationId } = await request.json();
    
    // Create new conversation if none exists
    let conversationIdToUse = conversationId;
    if (!conversationId) {
      const conversationRes = await fetch('http://localhost:5000/api/ai/conversations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });
      const conversationData = await conversationRes.json();
      conversationIdToUse = conversationData.conversation_id;
    }

    // Send message to Gemini API
    const geminiResponse = await fetch('http://localhost:5000/api/gemini/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        message: message,
        conversation_id: conversationIdToUse
      })
    });

    const geminiData = await geminiResponse.json();
    
    return NextResponse.json({
      response: geminiData.response,
      conversationId: conversationIdToUse
    }, {
      headers: {
        'Access-Control-Allow-Origin': 'http://localhost:3000',
        'Access-Control-Allow-Credentials': 'true'
      }
    });

  } catch (error) {
    console.error('Error processing message:', error);
    return NextResponse.json({ error: 'Failed to process message' }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': 'http://localhost:3000',
        'Access-Control-Allow-Credentials': 'true'
      }
    });
  }
}