import mongoose from 'mongoose';
import ChapterSchema from './ChapterSchema';
import FlashcardSchema from './FlashcardSchema';
import QuizSchema from './QuizSchema';

const NoteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  topic: {
    type: String,
    required: true,
  },
  difficulty: {
    type: String,
    required: true,
  },
  chapters: [ChapterSchema],
  flashcards: {
    type: [FlashcardSchema],
    default: [],
  },
  hasFlashcards: {
    type: Boolean,
    default: false,
  },
  flashcardsGeneratedAt: {
    type: Date,
  },
  quiz: [QuizSchema],
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Note || mongoose.model('Note', NoteSchema);
