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
  foreignField: 'user',
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
