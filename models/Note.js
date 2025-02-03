import mongoose from 'mongoose';

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
  chapters: [mongoose.Schema.Types.Mixed],
  flashcards: {
    type: [mongoose.Schema.Types.Mixed],
    default: [],
  },
  hasFlashcards: {
    type: Boolean,
    default: false,
  },
  flashcardsGeneratedAt: {
    type: Date,
  },
  quiz: [mongoose.Schema.Types.Mixed],
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