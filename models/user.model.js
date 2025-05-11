const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
      minlength: [2, 'Name must be at least 2 characters']
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: validator.isEmail,
        message: 'Please provide a valid email address'
      },
      index: true
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    role: {
      type: String,
      enum: ['user', 'admin', 'moderator'],
      default: 'user'
    },
    address: {
      line1: { type: String, trim: true, maxlength: 100 },
      street: { type: String, trim: true, maxlength: 50 },
      city: { type: String, trim: true, maxlength: 50 },
      state: { type: String, trim: true, maxlength: 50 },
      zipCode: {
        type: String,
        trim: true,
        validate: {
          validator: function(v) {
            return /^\d{5}(?:[-\s]\d{4})?$/.test(v);
          },
          message: 'Please provide a valid ZIP code'
        }
      },
      country: { type: String, trim: true, maxlength: 50 }
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          return /^\+?[\d\s-]{10,15}$/.test(v);
        },
        message: 'Please provide a valid phone number'
      }
    },
    active: {
      type: Boolean,
      default: true,
      select: false
    },
    // verificationToken: String,
    // verificationTokenExpires: Date
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    this.password = await bcrypt.hash(this.password, 12);
    if (!this.isNew) {
      this.passwordChangedAt = Date.now() - 1000;
    }
    next();
  } catch (err) {
    next(err);
  }
});

// Filter out inactive users on queries
userSchema.pre(/^find/, function(next) {
  this.find({ active: { $ne: false } });
  next();
});

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

// userSchema.methods.createVerificationToken = function() {
//   const verificationToken = crypto.randomBytes(32).toString('hex');
//   this.verificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
//   this.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
//   return verificationToken;
//};

const User = mongoose.model('User', userSchema);
module.exports = User;
