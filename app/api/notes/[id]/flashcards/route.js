import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Note from '@/models/Note';
import { verifyToken } from '@/lib/jwt';
import { generateFlashcards } from '@/lib/gemini';

export async function POST(request, { params }) {
  try {
    // Verify authentication
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
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
    try {
      await connectDB();
    } catch (error) {
      console.error('Database connection error:', error);
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const { id } = params;
    if (!id?.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { error: 'Invalid note ID format' },
        { status: 400 }
      );
    }

    const note = await Note.findById(id);

    if (!note) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    // Verify note ownership
    if (note.userId.toString() !== decoded.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Combine all chapter content
    if (!note.chapters || !Array.isArray(note.chapters) || note.chapters.length === 0) {
      return NextResponse.json(
        { error: 'Note has no content to generate flashcards from' },
        { status: 400 }
      );
    }

    const noteContent = note.chapters.map(chapter => 
      `${chapter.title}\n${chapter.content}`
    ).join('\n\n');

    // Generate flashcards
    const flashcards = await generateFlashcards(noteContent);

    // Update note with flashcards
    note.flashcards = flashcards;
    note.hasFlashcards = true;
    note.flashcardsGeneratedAt = new Date();
    
    try {
      await note.save();
    } catch (error) {
      console.error('Error saving flashcards:', error);
      return NextResponse.json(
        { error: 'Failed to save flashcards to database' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: 'Flashcards generated successfully',
      count: flashcards.length,
      flashcards
    });

  } catch (error) {
    console.error('Error generating flashcards:', error);
    
    // Handle specific error types
    if (error.message.includes('GEMINI_API_KEY')) {
      return NextResponse.json(
        { error: 'AI service configuration error' },
        { status: 500 }
      );
    }

    if (error.message.includes('Invalid note content')) {
      return NextResponse.json(
        { error: 'Note content is invalid or empty' },
        { status: 400 }
      );
    }

    if (error.message.includes('Failed to parse') || 
        error.message.includes('Invalid flashcard') ||
        error.message.includes('No valid flashcards')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate flashcards. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET(request, { params }) {
  try {
    // Verify authentication
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
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
    try {
      await connectDB();
    } catch (error) {
      console.error('Database connection error:', error);
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const { id } = params;
    if (!id?.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { error: 'Invalid note ID format' },
        { status: 400 }
      );
    }

    // Include userId in the select to verify ownership
    const note = await Note.findById(id).select('userId flashcards hasFlashcards flashcardsGeneratedAt');

    if (!note) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    // Verify note ownership
    if (note.userId.toString() !== decoded.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      flashcards: note.flashcards || [],
      hasFlashcards: note.hasFlashcards || false,
      flashcardsGeneratedAt: note.flashcardsGeneratedAt
    });

  } catch (error) {
    console.error('Error retrieving flashcards:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve flashcards' },
      { status: 500 }
    );
  }
}
