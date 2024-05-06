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
    availableTickets: {
      type: Number,
      default: 0,
    },
    soldTickets: {
      type: Number,
      default: 0,
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
  });
  next();
});

const Event = mongoose.model("Event", eventSchema);
module.exports = Event;
