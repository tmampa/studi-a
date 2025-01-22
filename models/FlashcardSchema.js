import mongoose from 'mongoose';

const FlashcardSchema = new mongoose.Schema({
  front: {
    type: String,
    required: true,
  },
  back: {
    type: String,
    required: true,
  },
});

export default FlashcardSchema;
