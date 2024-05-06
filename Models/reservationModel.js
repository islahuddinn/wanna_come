const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
    },
    paymentIntentId: {
      type: String,
    },
    persons: {
      Type: Number,
    },
    date: {
      type: Date,
    },
    time: {
      type: String,
    },
    isReserved: {
      type: Boolean,
      default: false,
    },
    reservedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);
reservationSchema.pre([/^find/, "save"], function (next) {
  this.populate({
    path: "reservedBy",
    select: "firstName lastName image",
  });
  next();
});
const Reservation = mongoose.model("Reservation", reservationSchema);
module.exports = Reservation;
