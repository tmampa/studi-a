import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import connectDB from '@/lib/db';
import Note from '@/models/Note';

export async function GET(request) {
  try {
    // Verify authentication
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectDB();

    // Get user's notes
    const notes = await Note.find({ userId: decoded.userId });

    // Calculate statistics
    const totalNotes = notes.length;
    const totalChapters = notes.reduce((sum, note) => sum + note.chapters.length, 0);
    const notesWithFlashcards = notes.filter(note => note.hasFlashcards).length;
    const totalFlashcards = notes.reduce((sum, note) => sum + (note.flashcards?.length || 0), 0);

    // Calculate notes created per day for the last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const notesPerDay = last7Days.map(date => ({
      date,
      count: notes.filter(note => 
        note.createdAt.toISOString().split('T')[0] === date
      ).length
    }));

    // Calculate chapter distribution
    const chapterDistribution = notes.reduce((acc, note) => {
      const chapterCount = note.chapters.length;
      acc[chapterCount] = (acc[chapterCount] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      stats: {
        totalNotes,
        totalChapters,
        notesWithFlashcards,
        totalFlashcards,
        notesPerDay,
        chapterDistribution,
        averageChaptersPerNote: totalNotes ? (totalChapters / totalNotes).toFixed(1) : 0,
        flashcardCompletionRate: totalNotes ? ((notesWithFlashcards / totalNotes) * 100).toFixed(1) : 0
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
