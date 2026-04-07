import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    movieId: {
      type: String,
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    spoiler: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// One review per user per movie
reviewSchema.index({ userId: 1, movieId: 1 }, { unique: true });

// For feed queries sorted by date
reviewSchema.index({ createdAt: -1 });

export default mongoose.model('Review', reviewSchema);
