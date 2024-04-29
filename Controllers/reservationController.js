const catchAsync = require("../Utils/catchAsync");
const appError = require("../Utils/appError");
const Event = require("../Models/eventModel");
const User = require("../Models/userModel");
const Reservation = require("../Models/reservationModel");
const factory = require("./handleFactory");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const {
  SendNotification,
  SendNotificationMultiCast,
} = require("../Utils/notification");
//////---------Events reservations------//////

exports.eventReservation = catchAsync(async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;
    const event = await Event.findById(eventId);
    const user = await User.findById(userId);

    // Check if the user and event exist
    if (!user) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "User not found.",
      });
    } else if (!event) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Event not found",
      });
    }

    // Calculate available tickets

    // Check if tickets are available
    if (event.availableTickets === 0) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "No available tickets",
      });
    }
    // Create a payment intent using Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: event.price * 100,
      currency: "usd",
      metadata: {
        eventId: event._id,
        userId: userId,
      },
    });

    const availableTickets = event.totalTickets - event.soldTickets;
    // Update soldTickets
    event.soldTickets += 1;

    // Save the updated event
    await event.save();

    // Return success response
    res.status(200).json({
      status: 200,
      success: true,
      paymentIntentId: paymentIntent.id,
      availableTickets: availableTickets,
    });
  } catch (error) {
    console.error("Error booking reservation:", error);
    res.status(500).json({
      status: 500,
      success: false,
      message: error.message,
    });
  }
});

//////---------Table Reservations------///////
