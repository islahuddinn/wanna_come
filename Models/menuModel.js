const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema({
  dishName: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
    default:
      "https://icon-library.com/images/default-profile-icon/default-profile-icon-6.jpg",
  },
  price: {
    type: Number,
    required: true,
    default: 0,
  },
  description: {
    type: String,
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});
menuSchema.pre([/^find/, "save"], function (next) {
  this.populate({
    path: "createdBy",
    select: "firstName lastName image",
  });
  next();
});
const Menu = mongoose.model("Menu", menuSchema);
module.exports = Menu;
