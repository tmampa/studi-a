import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Note from '@/models/Note';
import { verifyToken } from '@/lib/jwt';
import { generateQuiz } from '@/lib/gemini';

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

    // Get note ID from params
    const { id } = await Promise.resolve(params);
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

    // Get quiz settings from request body, with defaults if body is empty
    let numQuestions = 5;
    let difficulty = 'medium';
    
    try {
      const body = await request.json();
      numQuestions = body.numQuestions ?? 5;
      difficulty = body.difficulty ?? 'medium';
    } catch (error) {
      // If request body is empty or invalid, use defaults
      console.log('Using default quiz settings');
    }

    // Format note content for quiz generation
    let noteContent = '';
    
    // Add title
    if (note.title) {
      noteContent += `Title: ${note.title}\n\n`;
    }
    
    // Add chapters content
    if (note.chapters && note.chapters.length > 0) {
      noteContent += note.chapters
        .sort((a, b) => a.order - b.order)
        .map(chapter => `${chapter.title}\n${chapter.content}`)
        .join('\n\n');
    }
    
    // Add direct content if no chapters
    if (!note.chapters?.length && note.content) {
      noteContent += note.content;
    }

    if (!noteContent.trim()) {
      return NextResponse.json(
        { error: 'Note has no content to generate quiz from' },
        { status: 400 }
      );
    }

    // Generate quiz questions from note content
    try {
      console.log('Generating quiz from content length:', noteContent.length);
      const generatedQuiz = await generateQuiz(noteContent, { numQuestions, difficulty });
      
      // Validate generated quiz
      if (!Array.isArray(generatedQuiz) || generatedQuiz.length === 0) {
        throw new Error('Failed to generate valid quiz questions');
      }

      // Update note with generated quiz
      note.quiz = generatedQuiz.map(q => ({
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation
      }));

      await note.save();

      // Return the generated quiz directly
      return NextResponse.json({ 
        success: true,
        message: 'Quiz generated successfully',
        quiz: note.quiz 
      });
    } catch (error) {
      console.error('Detailed quiz generation error:', {
        message: error.message,
        stack: error.stack,
        noteId: id,
        contentLength: noteContent.length
      });
      
      return NextResponse.json(
        { error: `Failed to generate quiz: ${error.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error generating quiz:', error);
    return NextResponse.json(
      { error: 'Failed to generate quiz' },
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

    // Get note ID from params
    const { id } = await Promise.resolve(params);
    if (!id?.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { error: 'Invalid note ID format' },
        { status: 400 }
      );
    }

    // Use lean() for better performance since we don't need a full mongoose document
    const note = await Note.findById(id).lean();
    if (!note) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    // Return quiz if it exists
    if (!note.quiz || !Array.isArray(note.quiz) || note.quiz.length === 0) {
      return NextResponse.json(
        { error: 'No quiz found for this note. Try generating one first.' },
        { status: 404 }
      );
    }

    // Return the quiz with proper structure
    return NextResponse.json({ 
      success: true,
      quiz: note.quiz.map(q => ({
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation
      }))
    });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quiz' },
      { status: 500 }
    );
  }
}
