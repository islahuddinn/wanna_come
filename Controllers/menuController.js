const catchAsync = require("../Utils/catchAsync");
const CustomError = require("../Utils/appError");
const Menu = require("../Models/menuModel");
const User = require("../Models/userModel");
const factory = require("./handleFactory");
const Order = require("../Models/orderModel");
const Notification = require("../Models/notificationModel");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { SendNotification } = require("../Utils/notification");

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
    /////------send notikipation-------/////
    const title = `Menu order for "${menuItem.dishName}" has been made by user ${userId}`;
    const body = `Menu order for "${menuItem}" has been made by user ${userId}`;
    const ownerId = menuItem.createdBy.id;
    console.log(ownerId, "mr owner id");
    const businessOwner = await User.findById(ownerId);
    console.log("here is the business owner of menu !", businessOwner);

    // Find the deviceToken of the business owner
    const token = businessOwner.deviceToken;
    console.log("fcmToken is here !", token);
    // const token = (await RefreshToken.find({ user: creator.id })).map(
    //   ({ deviceToken }) => deviceToken
    // );
    await Notification.create({
      token: token,
      title: title,
      body: body,
      receiver: businessOwner._id,
      sender: userId,
      data: newOrder,
    });
    // await SendNotification({
    //   token: token,
    //   title: title,
    //   body: body,
    //   data: {
    //     value: JSON.stringify({ user: userId }),
    //   },
    // });
    res.status(200).json({
      success: true,
      status: 200,
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
      status: 200,
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
    const orderId = req.params.id;

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
      status: 200,
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
exports.getOneMenu = factory.getOne(Menu);
exports.updateMenu = factory.updateOne(Menu);
exports.deleteMenu = factory.deleteOne(Menu);
/////order menu
exports.getallOrder = factory.getAll(Order);
exports.getOneOrder = factory.getOne(Order);
exports.deleteOrder = factory.deleteOne(Order);
