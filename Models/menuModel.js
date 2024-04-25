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
  numberOfPersons: {
    type: Number,
    required: true,
    default: 0,
  },
});
const Menu = mongoose.Model("Menu", menuSchema);
module.exports = Menu;
