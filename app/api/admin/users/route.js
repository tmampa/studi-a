import { NextResponse } from 'next/server';
import { adminMiddleware } from '@/lib/admin-middleware';
import connectDB from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

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
    const { userId, action, userData } = await request.json();

    await connectDB();
    
    switch (action) {
      case 'create':
        // Validate required fields
        if (!userData.email || !userData.name) {
          return NextResponse.json(
            { error: 'Email and name are required' },
            { status: 400 }
          );
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
          return NextResponse.json(
            { error: 'User with this email already exists' },
            { status: 409 }
          );
        }

        // Generate a temporary password
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const newUser = new User({
          ...userData,
          password: hashedPassword,
          isAdmin: userData.isAdmin || false
        });

        await newUser.save();

        return NextResponse.json({ 
          user: {
            _id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            isAdmin: newUser.isAdmin
          },
          tempPassword 
        });

      case 'update':
        // Validate userId
        if (!userId) {
          return NextResponse.json(
            { error: 'User ID is required' },
            { status: 400 }
          );
        }

        // Update user, excluding password
        const updateData = { ...userData };
        delete updateData.password; // Prevent direct password update here

        const updatedUser = await User.findByIdAndUpdate(
          userId, 
          updateData, 
          { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({ user: updatedUser });

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
      { error: 'Failed to perform action', details: error.message },
      { status: 500 }
    );
  }
}
