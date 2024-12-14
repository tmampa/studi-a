import { generateStudyNotes } from '@/lib/gemini';
import connectDB from '@/lib/db';
import Note from '@/models/Note';
import { verifyToken } from '@/lib/jwt';

export async function POST(request) {
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

    const { topic, subject, difficulty } = await request.json();

    // Validate input
    if (!topic || !subject || !difficulty) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    try {
      // Generate notes using Gemini
      const generatedNotes = await generateStudyNotes({ topic, subject, difficulty });

      // Validate generated notes
      if (!generatedNotes.title || !Array.isArray(generatedNotes.chapters) || generatedNotes.chapters.length === 0) {
        throw new Error('Invalid notes format received from AI');
      }

      // Save notes to database
      const note = await Note.create({
        title: generatedNotes.title,
        subject,
        topic,
        difficulty,
        chapters: generatedNotes.chapters,
        userId: decoded.userId,
      });

      return Response.json(note, { status: 201 });
    } catch (aiError) {
      console.error('AI Generation Error:', aiError);
      return Response.json(
        { error: 'Failed to generate study notes. Please try a different topic or try again later.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API Error:', error);
    return Response.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
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

    // Get user's notes
    const notes = await Note.find({ userId: decoded.userId })
      .sort({ createdAt: -1 })
      .select('-chapters.content') // Exclude chapter content for list view
      .exec();

    return Response.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    return Response.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
} 