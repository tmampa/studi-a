import mongoose from 'mongoose';

const QuizSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  options: [{
    type: String,
    required: true,
  }],
  correctAnswer: {
    type: Number,
    required: true,
  },
  explanation: {
    type: String,
    required: true,
  },
});

export default QuizSchema;
