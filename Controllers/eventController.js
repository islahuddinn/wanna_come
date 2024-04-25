const catchAsync = require("../Utils/catchAsync");
const appError = require("../Utils/appError");
const Event = require("../Models/eventModel");
const User = require("../Models/userModel");
const factory = require("./handleFactory");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const {
  SendNotification,
  SendNotificationMultiCast,
} = require("../Utils/notification");

exports.createEvent = catchAsync(async (req, res, next) => {
  const {
    title,
    image,
    price,
    date,
    time,
    location,
    description,
    totalTickets,
  } = req.body;

  const newEvent = await Event.create({
    title,
    image,
    price,
    date,
    time,
    location,
    description,
    totalTickets,
  });

  ////// Send Notification
  // const data = {
  //   eventTitle: req.body.title,
  //   eventInfo: req.body.eventInfo,
  //   eventLocation: req.body.eventLocation,
  // };
  // const notificationTitle = "New Event Created";
  // const notificationBody =
  //   "Hy Folks, another exciting event is going to be happen at eventLocation.";

  // // const deviceToken = req.body.FCMToken;

  // const devices = await User.find({}, "deviceToken");
  // console.log(devices);
  // const FCMTokens = devices.map((device) => device.deviceToken);
  // console.log(FCMTokens);

  // if (!FCMTokens) {
  //   return res.status(404).json({
  //     success: false,
  //     status: 404,
  //     message: "FCMTokens not found...",
  //   });
  // }

  // try {
  //   await SendNotificationMultiCast({
  //     tokens: FCMTokens,
  //     title: notificationTitle,
  //     body: notificationBody,
  //     data: data,
  //   });
  //   console.log("Notification sent to all users.");
  // } catch (error) {
  //   console.error("Error sending notification.....:", error);
  // }

  res.status(201).json({
    status: 201,
    success: true,
    event: createdEvent,
  });
});

/////// Update events

exports.updateEvent = catchAsync(async (req, res, next) => {
  const {
    title,
    image,
    price,
    date,
    time,
    location,
    description,
    totalTickets,
  } = req.body;

  const eventId = req.params.id;

  try {
    const eventToUpdate = await Event.findById(eventId);

    if (!eventToUpdate) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: "Event not found",
      });
    }
    eventToUpdate.title = title;
    eventToUpdate.image = image;
    eventToUpdate.price = price;
    eventToUpdate.date = date;
    eventToUpdate.time = time;
    eventToUpdate.location = location;
    eventToUpdate.description = description;
    eventToUpdate.totalTickets = totalTickets;

    const updatedEvent = await eventToUpdate.save();

    ////// Send Notification
    // const data = {
    //   eventTitle: req.body.title,
    //   eventInfo: req.body.eventInfo,
    //   eventLocation: req.body.eventLocation,
    // };
    // const notificationTitle = "Event Updated";
    // const notificationBody = "The event has been updated.";
    // // const deviceToken = req.body.FCMToken;
    // const devices = await User.find({}, "deviceToken");
    // console.log(devices);
    // const FCMTokens = devices.map((device) => device.deviceToken);
    // console.log(FCMTokens);

    // if (!FCMTokens) {
    //   return res.status(404).json({
    //     success: false,
    //     status: 404,
    //     message: "FCMTokens not found...",
    //   });
    // }

    // try {
    //   await SendNotificationMultiCast({
    //     tokens: FCMTokens,
    //     title: notificationTitle,
    //     body: notificationBody,
    //     data: data,
    //   });
    //   console.log("Notification sent to all users.");
    // } catch (error) {
    //   console.error("Error sending notification.....:", error);
    // }

    res.status(200).json({
      success: true,
      status: 200,
      message: "Event updated successfully",
      data: updatedEvent,
    });
  } catch (error) {
    next(error);
  }
});

//////// handle event reservation with stripe

exports.reservEvent = catchAsync(async (req, res, next) => {
  const { eventId } = req.params;
  const userId = req.user._id;
  try {
    // Check if the user exists
    const user = await User.findById(userId);
    const event = await Event.findById(eventId);
    if (!user) {
      return appError("User not found.", 400);
    } else if (!event) {
      return appError("Event not found", 400);
    }

    // Check if the user is a PR user
    if (user.availableTickets === 0) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "Slots are not available for event reservation.",
      });
    }

    let paymentIntent;

    // Check if the user has a referral code and it's valid
    if (user.referralCode) {
      const referrer = await User.findOne({ referralCode: user.referralCode });
      if (referrer) {
        // Update cashback for the referrer
        CashUpdate(eventId, referrer._id);
        // Proceed with Stripe payment integration
        paymentIntent = await stripe.paymentIntents.create({
          amount: event.price * 100,
          currency: "usd",
          description: "Event Reservation",
          automatic_payment_methods: {
            enabled: true,
          },
        });
        // Confirm the payment intent to complete the payment
        const confirmedPaymentIntent = await stripe.paymentIntents.confirm(
          paymentIntent.id,
          {
            payment_method: "pm_card_visa",
            return_url: "https://www.example.com",
          }
        );
        return res.status(200).json({
          success: true,
          status: 200,
          message: "Event reserved successfully.",
          data: { user, paymentIntent: confirmedPaymentIntent },
        });
      }
    }

    // If no referral code or it's invalid, proceed with Stripe payment integration
    if (!paymentIntent) {
      paymentIntent = await stripe.paymentIntents.create({
        amount: event.price * 100,
        currency: "usd",
        description: "Event reservation",
        automatic_payment_methods: { enabled: true },
      });
    }
    // Confirm the payment intent to complete the payment
    const confirmedPaymentIntent = await stripe.paymentIntents.confirm(
      paymentIntent.id,
      {
        payment_method: "pm_card_visa",
        return_url: "https://www.example.com",
      }
    );
    return res.status(200).json({
      success: true,
      status: 200,
      message: "Event reserved successfully.",
      data: { user, paymentIntent: confirmedPaymentIntent },
    });
  } catch (error) {
    // Handle any errors
    return res.status(500).json({
      success: false,
      status: 500,
      message: "Internal server error.",
      error: error.message,
    });
  }
});

//// Another function for event reservation

exports.bookReservation = catchAsync(async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const userId = req.user._id;
    const event = await Event.findById(eventId);
    const user = await User.findById(userId);

    // Check if the event exists
    if (!user) {
      return appError("User not found.", 400);
    } else if (!event) {
      return appError("Event not found", 400);
    }
    //// Check if tickets are available or not
    if (user.availableTickets === 0) {
      return appError("No available tickets", 400);
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

    // Check if there are available tickets before reservation
    if (event.availableTickets > 0) {
      // Update soldTickets and availableTickets
      event.soldTickets += 1;
      event.availableTickets -= 1;
      // Mark the event as booked
      event.isReserved = true;
      // Save the updated event
      await event.save();
      return {
        status: 200,
        success: true,
        paymentIntentId: paymentIntent.id,
      };
    } else {
      return {
        success: false,
        message: "No available tickets",
      };
    }
  } catch (error) {
    console.error("Error booking reservation:", error);
    return {
      status: 500,
      success: false,
      message: error.message,
    };
  }
});

exports.getallEvent = factory.getAll(Event);
exports.getOneEvent = factory.getOne(Event);
exports.deleteEvent = factory.deleteOne(Event);
