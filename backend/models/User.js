import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /^[a-zA-Z0-9_]+$/,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    bio: {
      type: String,
      default: '',
      maxlength: 500,
    },
    avatarUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,           // adds createdAt & updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ── Pre-delete hooks: cascade delete all related data ────────────────────────
userSchema.pre('findOneAndDelete', async function(next) {
  const user = await this.model.findOne(this.getFilter());
  if (!user) return next();
  
  // Import models inside hook to avoid circular dependencies
  const { Review, ReviewLike, Follow, Notification, Favorite } = await import('./index.js');
  
  // Delete all reviews by this user
  await Review.deleteMany({ userId: user._id });
  
  // Delete all likes on reviews by this user
  await ReviewLike.deleteMany({ userId: user._id });
  
  // Delete all follow relationships (both follower and following)
  await Follow.deleteMany({ $or: [{ follower: user._id }, { following: user._id }] });
  
  // Delete all notifications for this user and notifications triggered by this user
  await Notification.deleteMany({ $or: [{ user: user._id }, { fromUser: user._id }] });
  
  // Delete all favorites by this user
  await Favorite.deleteMany({ userId: user._id });
  
  next();
});

// ── Virtuals ─────────────────────────────────────────────────────────────────
// These let us call user.followerCount, user.followingCount, user.reviewCount
// without storing redundant data.  They rely on the Follow & Review models.

userSchema.virtual('followerCount', {
  ref: 'Follow',
  localField: '_id',
  foreignField: 'following',
  count: true,
});

userSchema.virtual('followingCount', {
  ref: 'Follow',
  localField: '_id',
  foreignField: 'follower',
  count: true,
});

userSchema.virtual('reviewCount', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'userId',
  count: true,
});

// ── Instance helpers ─────────────────────────────────────────────────────────
userSchema.methods.toProfileJSON = function (requesterId = null) {
  const obj = {
    id: this._id,
    fullName: this.fullName,
    username: this.username,
    bio: this.bio,
    avatarUrl: this.avatarUrl,
    reviewCount: this.reviewCount ?? 0,
    followerCount: this.followerCount ?? 0,
    followingCount: this.followingCount ?? 0,
    isOwnProfile: requesterId ? this._id.equals(requesterId) : false,
  };
  // Only expose email to the owner
  if (requesterId && this._id.equals(requesterId)) {
    obj.email = this.email;
  }
  return obj;
};

export default mongoose.model('User', userSchema);
