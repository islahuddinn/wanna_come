const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: true,
      default: "",
    },
    businessName: {
      type: String,
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    fullName: {
      type: String,
    },
    openingTime: {
      type: String,
      default: 0,
    },
    closingTime: {
      type: String,
    },
    businessDescription: {
      type: String,
    },
    businessLocation: {
      type: {
        type: String,
        default: "Point",
      },
      coordinates: { type: [Number], default: [0, 0] },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);
restaurantSchema.pre([/^find/, "save"], function (next) {
  this.populate({
    path: "createdBy",
  });
  next();
});
const Restaurant = mongoose.model("Restaurant", restaurantSchema);
module.exports = Restaurant;
