import connectDB from '@/lib/db';
import Note from '@/models/Note';
import { verifyToken } from '@/lib/jwt';

export async function GET(request, { params }) {
  try {
    await connectDB();
    
    // Verify authentication
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const decoded = verifyToken(token);
    if (!decoded) {
      return Response.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get note ID from params
    const { id } = params;

    // Validate MongoDB ObjectId format
    if (!id?.match(/^[0-9a-fA-F]{24}$/)) {
      return Response.json({ error: 'Invalid note ID format' }, { status: 400 });
    }

    try {
      const note = await Note.findOne({
        _id: id,
        userId: decoded.userId,
      }).exec();

      if (!note) {
        return Response.json({ error: 'Note not found' }, { status: 404 });
      }

      return Response.json(note);
    } catch (dbError) {
      console.error('Database Error:', dbError);
      return Response.json({ error: 'Invalid note ID' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error fetching note:', error);
    return Response.json(
      { error: 'Failed to fetch note' },
      { status: 500 }
    );
  }
} 