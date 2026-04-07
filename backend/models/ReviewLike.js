import mongoose from 'mongoose';

const reviewLikeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// One like per user per review
reviewLikeSchema.index({ userId: 1, reviewId: 1 }, { unique: true });

export default mongoose.model('ReviewLike', reviewLikeSchema);
