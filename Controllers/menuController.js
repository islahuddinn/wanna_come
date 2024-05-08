const catchAsync = require("../Utils/catchAsync");
const CustomError = require("../Utils/appError");
const Menu = require("../Models/menuModel");
const factory = require("./handleFactory");
const Order = require("../Models/orderModel");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.createMenu = catchAsync(async (req, res, next) => {
  const { dishName, image, price, description } = req.body;

  try {
    // Create a new menu item
    const newMenu = await Menu.create({
      dishName,
      image,
      price,
      description,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      status: 201,
      menu: newMenu,
    });
  } catch (error) {
    next(error);
  }
});

/////----Order Menu------///////

exports.orderMenu = async (req, res, next) => {
  try {
    const { dishName, quantity } = req.body;
    const userId = req.user.id;

    // Find the menu item by dishName
    const menuItem = await Menu.findOne({ dishName });

    if (!menuItem) {
      return next(new CustomError("Menu item not found", 404));
    }

    // Calculate total price based on quantity
    const totalPrice = menuItem.price * quantity;

    // Create order object
    const order = {
      dishName: menuItem.dishName,
      image: menuItem.image,
      pricePerItem: menuItem.price,
      quantity,
      totalPrice,
      orderedBy: userId,
    };

    // Create a payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalPrice * 100,
      currency: "usd",
      description: `Order for ${quantity} ${dishName}`,
      metadata: { integration_check: "accept_a_payment" },
    });
    const paymentIntentId = paymentIntent.id;
    // Save the order and payment intent
    const newOrder = await Order.create(order);
    newOrder.status === "completed";
    res.status(200).json({
      success: true,
      message: "Order placed successfully",
      data: {
        newOrder,
        paymentIntentId,
      },
    });
  } catch (error) {
    return next(error);
  }
};
//////------update the order----/////
exports.updateOrderMenu = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const { dishName, quantity } = req.body;

    // Find the existing order by ID
    let order = await Order.findById(orderId);

    if (!order) {
      return next(new CustomError("Order not found", 404));
    }

    // Find the menu item by dishName
    const menuItem = await Menu.findOne({ dishName });

    if (!menuItem) {
      return next(new CustomError("Menu item not found", 404));
    }

    // Calculate total price based on quantity
    const totalPrice = menuItem.price * quantity;

    // Update order details
    order.dishName = menuItem.dishName;
    order.image = menuItem.image;
    order.pricePerItem = menuItem.price;
    order.quantity = quantity;
    order.totalPrice = totalPrice;
    order.status === "completed";

    // Create a payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalPrice * 100,
      currency: "usd",
      description: `Order for ${quantity} ${dishName}`,
      metadata: { integration_check: "accept_a_payment" },
    });
    const paymentIntentId = paymentIntent.id;
    // Save the updated order

    order = await order.save();

    res.status(200).json({
      success: true,
      message: "Order updated successfully",
      data: {
        order,
        paymentIntentId,
      },
    });
  } catch (error) {
    return next(error);
  }
};

///////------cencel menu order-------//////
exports.cancelOrderMenu = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;

    // Find the order by orderId
    const order = await Order.findById(orderId);

    if (!order) {
      return next(new CustomError("Order not found", 404));
    }

    // Check if the order is already canceled
    if (order.status === "canceled") {
      return next(new CustomError("Order is already canceled", 400));
    }

    // Update order status to canceled
    order.status = "canceled";
    await order.save();

    res.status(200).json({
      success: true,
      message: "Order canceled successfully",
      data: {
        order,
      },
    });
  } catch (error) {
    return next(error);
  }
};

exports.getallMenu = factory.getAll(Menu);
exports.getallOrder = factory.getAll(Order);
exports.getOneMenu = factory.getOne(Menu);
exports.getOneOrder = factory.getOne(Order);
exports.updateMenu = factory.updateOne(Menu);
// exports.updateOrder = factory.updateOne(Order);
exports.deleteMenu = factory.deleteOne(Menu);
exports.deleteOrder = factory.deleteOne(Order);
