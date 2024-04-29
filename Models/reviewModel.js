const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      trim: true,
    },
    isSeen: {
      type: Boolean,
      default: false,
    },
    creator: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: "creator",
    select: "firstName lastName image",
  });
  next();
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
