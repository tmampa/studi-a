import { NextResponse } from 'next/server';
import { adminMiddleware } from '@/lib/admin-middleware';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function GET(request) {
  // Check admin access
  const adminCheck = await adminMiddleware(request);
  if (adminCheck) return adminCheck;

  try {
    await connectDB();
    const users = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Admin users fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  // Check admin access
  const adminCheck = await adminMiddleware(request);
  if (adminCheck) return adminCheck;

  try {
    const { userId, action } = await request.json();

    await connectDB();
    
    switch (action) {
      case 'makeAdmin':
        await User.findByIdAndUpdate(userId, { isAdmin: true });
        break;
      case 'removeAdmin':
        await User.findByIdAndUpdate(userId, { isAdmin: false });
        break;
      case 'delete':
        await User.findByIdAndDelete(userId);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin user action error:', error);
    return NextResponse.json(
      { error: 'Failed to perform action' },
      { status: 500 }
    );
  }
}
