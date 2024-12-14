import connectDB from '@/lib/db';
import User from '@/models/User';

export async function GET() {
  try {
    await connectDB();
    const users = await User.find({});
    return Response.json({ users });
  } catch (error) {
    return Response.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const data = await request.json();
    const user = await User.create(data);
    return Response.json({ user }, { status: 201 });
  } catch (error) {
    return Response.json({ error: 'Failed to create user' }, { status: 500 });
  }
} 