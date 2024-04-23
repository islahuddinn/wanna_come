const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  thumb: {
    type: String,
    required: true,
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
    // required: true,
  },
  time: {
    type: Number,
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
    required: true,
    default: 0,
  },
  persons: {
    type: Number,
    required: true,
    default: 0,
  },
});

const Event = mongoose.model("Event", eventSchema);
module.exports = Event;
