const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    feedback: {
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

feedbackSchema.pre(/^find/, function (next) {
  this.populate({
    path: "creator",
    select: "firstName lastName image",
  });
  next();
});

const Feedback = mongoose.model("Feedback", feedbackSchema);

module.exports = Feedback;
