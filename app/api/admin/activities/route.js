import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import ActivityLog from '@/models/ActivityLog';
import User from '@/models/User';

export async function GET(request) {
  try {
    // Get the authorization token from headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ message: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    let decoded;
    try {
      decoded = await verifyToken(token);
    } catch (tokenError) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    // Additional admin check
    if (!decoded.isAdmin) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    // Connect to database
    await connectDB();

    // Fetch activities (last 50, sorted by timestamp)
    const activities = await ActivityLog.find({})
      .sort({ timestamp: -1 })
      .limit(50)
      .populate('user', 'name email');

    return NextResponse.json({ 
      activities: activities.map(activity => ({
        _id: activity._id.toString(),
        type: activity.action || 'unknown',
        description: activity.details || 'No description',
        timestamp: activity.createdAt,
        user: activity.user ? {
          name: activity.user.name,
          email: activity.user.email
        } : null
      }))
    });
  } catch (error) {
    console.error('Activities fetch error:', error);
    return NextResponse.json({ 
      message: 'Error fetching activities', 
      error: error.message 
    }, { status: 500 });
  }
}
