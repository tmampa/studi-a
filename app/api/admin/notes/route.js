import { NextResponse } from 'next/server';
import { adminMiddleware } from '@/lib/admin-middleware';
import connectDB from '@/lib/db';
import Note from '@/models/Note';
import User from '@/models/User';

export async function GET(request) {
  // Check admin access
  const adminCheck = await adminMiddleware(request);
  if (adminCheck) return adminCheck;

  try {
    await connectDB();

    // Get query parameters for pagination and filtering
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const subject = searchParams.get('subject') || '';
    const difficulty = searchParams.get('difficulty') || '';
    const startDate = searchParams.get('startDate') || null;
    const endDate = searchParams.get('endDate') || null;
    const hasFlashcards = searchParams.get('hasFlashcards') || null;
    const hasQuiz = searchParams.get('hasQuiz') || null;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } }
      ];
    }
    if (subject) {
      query.subject = subject;
    }
    if (difficulty) {
      query.difficulty = difficulty;
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Flashcards and Quiz filters
    if (hasFlashcards !== null) {
      query.hasFlashcards = hasFlashcards === 'true';
    }
    if (hasQuiz !== null) {
      query.quiz = hasQuiz === 'true' ? { $exists: true, $not: { $size: 0 } } : { $size: 0 };
    }

    // Sort options
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Populate with user details
    const notes = await Note.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('userId', 'name email');

    // Get total count for pagination
    const total = await Note.countDocuments(query);

    return NextResponse.json({
      notes,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalNotes: total
      }
    });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  // Check admin access
  const adminCheck = await adminMiddleware(request);
  if (adminCheck) return adminCheck;

  try {
    await connectDB();
    const { noteId, action } = await request.json();

    const note = await Note.findById(noteId);
    if (!note) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'delete':
        await Note.findByIdAndDelete(noteId);
        return NextResponse.json({ 
          message: 'Note deleted successfully' 
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error managing note:', error);
    return NextResponse.json(
      { error: 'Failed to manage note', details: error.message },
      { status: 500 }
    );
  }
}
