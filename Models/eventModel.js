const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: true,
      default:
        "https://icon-library.com/images/default-profile-icon/default-profile-icon-6.jpg",
    },
    title: {
      type: String,
      required: true,
      unique: true,
    },
    price: {
      type: Number,
      default: 0,
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    location: {
      type: {
        type: String,
        default: "Point",
      },
      coordinates: { type: [Number], default: [0, 0] },
    },
    description: {
      type: String,
      required: true,
    },
    totalTickets: {
      type: Number,
      required: true,
      default: 0,
    },
    availableTickets: {
      type: Number,
      default: 0,
    },
    soldTickets: {
      type: Number,
      default: 0,
    },
    isReserved: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);
eventSchema.pre([/^find/, "save"], function (next) {
  this.populate({
    path: "createdBy",
    select: "firstName lastName image",
  });
  next();
});

const Event = mongoose.model("Event", eventSchema);
module.exports = Event;
