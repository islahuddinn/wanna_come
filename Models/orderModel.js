const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    dishName: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    pricePerItem: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    orderedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "canceled"],
      default: "pending",
      required: true,
    },
  },
  { timestamps: true }
);
orderSchema.pre([/^find/, "save"], function (next) {
  this.populate({
    path: "orderedBy",
    select: "firstName lastName image",
  });
  next();
});
const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
