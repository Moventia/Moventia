import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    // The user who RECEIVES this notification
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['follow', 'like', 'comment', 'review'],
      required: true,
    },
    // The user who TRIGGERED this notification
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Denormalized for fast display (avoids extra populate)
    fromUsername: {
      type: String,
      required: true,
    },
    fromAvatar: {
      type: String,
      default: '',
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index: user's notifications sorted newest-first
notificationSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
