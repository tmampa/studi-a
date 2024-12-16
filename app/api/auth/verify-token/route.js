import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function POST(request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract token
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Connect to database
    await connectDB();

    // Find user and check admin status
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return user details, focusing on admin status
    return NextResponse.json({
      isAdmin: user.isAdmin,
      userId: user._id,
      email: user.email
    });

  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
