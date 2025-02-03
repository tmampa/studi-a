import { NextResponse } from 'next/server';
import { adminMiddleware } from '@/lib/admin-middleware';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Note from '@/models/Note';

export async function GET(request) {
  // Check admin access
  const adminCheck = await adminMiddleware(request);
  if (adminCheck) return adminCheck;

  try {
    await connectDB();

    // Get overall statistics
    const totalUsers = await User.countDocuments();
    const totalNotes = await Note.countDocuments();
    const totalAdmins = await User.countDocuments({ isAdmin: true });

    // Get recent user registrations (last 7 days)
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const recentUsers = await User.find({
      createdAt: { $gte: last7Days }
    }).countDocuments();

    // Get most active users
    const activeUsers = await Note.aggregate([
      { $group: { 
        _id: '$userId', 
        notesCount: { $sum: 1 } 
      }},
      { $sort: { notesCount: -1 } },
      { $limit: 5 },
      { $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }},
      { $unwind: '$user' },
      { $project: {
        _id: 0,
        name: '$user.name',
        email: '$user.email',
        notesCount: 1
      }}
    ]);

    return NextResponse.json({
      stats: {
        totalUsers,
        totalNotes,
        totalAdmins,
        recentUsers,
        activeUsers
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin statistics' },
      { status: 500 }
    );
  }
}
