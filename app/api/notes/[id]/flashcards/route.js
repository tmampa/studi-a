import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { generateFlashcards } from '@/lib/gemini';
import { ObjectId } from 'mongodb';
import { verifyToken } from '@/lib/jwt';
import Note from '@/models/Note';

export async function POST(request, { params }) {
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
    try {
      await connectDB();
    } catch (error) {
      console.error('Database connection error:', error);
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Validate and extract note ID
    const id = params.id;
    if (!id?.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { error: 'Invalid note ID format' },
        { status: 400 }
      );
    }

    // Find the note using Mongoose
    const note = await Note.findOne({
      _id: id,
      userId: decoded.userId
    });

    if (!note) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    // Generate content for flashcards
    const content = note.chapters.map(chapter => 
      `${chapter.title}\n${chapter.content}`
    ).join('\n\n');

    try {
      // Generate flashcards
      const flashcards = await generateFlashcards(content);
      
      // Update note with flashcards
      note.flashcards = flashcards;
      note.hasFlashcards = true;
      note.flashcardsGeneratedAt = new Date();
      await note.save();

      return NextResponse.json({ 
        success: true, 
        flashcards 
      });
    } catch (error) {
      console.error('Error generating flashcards:', error);
      return NextResponse.json(
        { error: 'Failed to generate flashcards' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in flashcards route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
    try {
      await connectDB();
    } catch (error) {
      console.error('Database connection error:', error);
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Validate and extract note ID
    const id = params.id;
    if (!id?.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { error: 'Invalid note ID format' },
        { status: 400 }
      );
    }

    // Find the note using Mongoose
    const note = await Note.findOne({
      _id: id,
      userId: decoded.userId
    }).select('flashcards hasFlashcards flashcardsGeneratedAt');

    if (!note) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      flashcards: note.flashcards || [],
      hasFlashcards: note.hasFlashcards || false,
      flashcardsGeneratedAt: note.flashcardsGeneratedAt
    });
  } catch (error) {
    console.error('Error in GET flashcards:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
