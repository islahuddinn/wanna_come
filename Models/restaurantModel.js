const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema({
  image: {
    type: String,
    required: true,
    default: "",
  },
  restaurantName: {
    type: String,
    required: true,
  },
  Date: {
    type: Number,
    required: true,
  },
  description: {
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
  menu: {
    type: mongoose.Types.Schema.ObjectId,
    ref: "menu",
  },
  reviews: {
    type: mongoose.Types.Schema.ObjectId,
    ref: "reviewa",
  },
  timestamps: true,
});
const Restaurant = mongoose.Model("Restaurant", restaurantSchema);
module.exports = Restaurant;
