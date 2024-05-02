const catchAsync = require("../Utils/catchAsync");
const appError = require("../Utils/appError");
const Event = require("../Models/eventModel");
const User = require("../Models/userModel");
const Reservation = require("../Models/reservationModel");
const factory = require("./handleFactory");
const Notification = require("../Models/notificationModel");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const {
  SendNotification,
  SendNotificationMultiCast,
} = require("../Utils/notification");
const { token } = require("morgan");
//////---------Events reservations------//////

// exports.eventReservation = catchAsync(async (req, res, next) => {
//   try {
//     const event = req.params.id;
//     const user = req.user._id;

//     // Check if the user and event exist
//     if (!user) {
//       return res.status(400).json({
//         status: 400,
//         success: false,
//         message: "User not found.",
//       });
//     } else if (!event) {
//       return res.status(400).json({
//         status: 400,
//         success: false,
//         message: "Event not found",
//       });
//     } else if (event.availableTickets === 0) {
//       return res.status(400).json({
//         status: 400,
//         success: false,
//         message: "No available tickets",
//       });
//     }

//     /// Create a payment intent using Stripe
//     // const paymentIntent = await stripe.paymentIntents.create({
//     //   amount: event.price * 100,
//     //   currency: "usd",
//     //   metadata: {
//     //     eventId: event._id,
//     //     userId: user._id,
//     //   },
//     // });

//     // Update soldTickets, available tickets
//     event.soldTickets += 1;
//     event.availableTickets -= 1;

//     // Save the updated event
//     // await event.save();

//     // Return success response
//     res.status(200).json({
//       status: 200,
//       success: true,
//       // paymentIntentId: paymentIntent.id,
//       data: event,
//     });
//   } catch (error) {
//     console.error("Error booking reservation:", error);
//     res.status(500).json({
//       status: 500,
//       success: false,
//       message: error.message,
//     });
//   }
// });

exports.eventReservation = catchAsync(async (req, res, next) => {
  const { persons } = req.body;
  const eventId = req.params.id;
  const userId = req.user.id;
  // Check if the event exists
  const event = await Event.findById(eventId);
  console.log(event, "event being reserved");
  if (!event) {
    return res.status(404).json({ success: false, message: "Event not found" });
  }

  // Check if there are available tickets
  if (event.availableTickets === 0) {
    return res
      .status(400)
      .json({ success: false, message: "No available tickets" });
  }

  /// Create a payment intent using Stripe
  const paymentIntentId = await stripe.paymentIntents.create({
    amount: event.price * 100,
    currency: "usd",
    metadata: {
      eventId: eventId,
      userId: userId,
    },
  });
  // Create reservation
  const reservation = await Reservation.create({
    event: eventId,
    user: userId,
    paymentIntentId,
    persons,
    date: event.date,
    time: event.time,
  });

  // Update event's available tickets and sold tickets
  event.availableTickets -= persons;
  event.soldTickets += persons;
  await event.save();

  // // Send notification to admin about reservation
  // await Notification.create({
  //   FcmToken,
  //   title,
  //   body,
  //   data,
  // });
  // const title = `Reservation for event "${event.title}" has been made by user ${userId}`;
  // const body = `Reservation request for event "${event}" has been made by user ${userId}`;
  // const token = (await RefreshToken.find({ user: creator.id })).map(
  //   ({ deviceToken }) => deviceToken
  // );
  // await SendNotification({
  //   token: token,
  //   title: title,
  //   body: body,
  //   data: {
  //     value: JSON.stringify({ user: userId }),
  //   },
  // });

  res.status(201).json({
    success: true,
    message: "Reservation created successfully",
    reservation,
  });
});

//////---------Table Reservations------///////
exports.tableReservation = catchAsync(async (req, res, next) => {
  const { persons, selectedMenu } = req.body;
  const eventId = req.params.id; // Assuming the event ID is passed as a parameter
  const userId = req.user._id;

  // Check if the event exists
  const event = await Event.findById(eventId);
  if (!event) {
    return res.status(404).json({ success: false, message: "Event not found" });
  }

  // Check if there are available seats
  if (event.availableSeats < persons) {
    return res
      .status(400)
      .json({ success: false, message: "Not enough available seats" });
  }

  /// Create a payment intent using Stripe
  const paymentIntent = await stripe.paymentIntents.create({
    amount: event.price * persons * 100, // Assuming price is per person
    currency: "usd",
    metadata: {
      eventId: event._id,
      userId: userId,
    },
  });

  // Create reservation
  const reservation = await Reservation.create({
    event: eventId,
    user: userId,
    paymentIntentId: paymentIntent.id,
    persons,
    selectedMenu,
    date: event.date,
    time: event.time,
  });

  // Update event's available seats
  event.availableSeats -= persons;
  await event.save();

  // Send notification to admin about reservation
  await Notification.create({
    FcmToken,
    title,
    body,
    data,
  });
  const title = `Reservation for event "${event.title}" has been made by user ${userId}`;
  const body = `Reservation request for event "${event}" has been made by user ${userId}`;
  const token = (await RefreshToken.find({ user: creator.id })).map(
    ({ deviceToken }) => deviceToken
  );
  await SendNotification({
    token: token,
    title: title,
    body: body,
    data: {
      value: JSON.stringify({ user: userId }),
    },
  });

  res.status(201).json({
    success: true,
    message: "Reservation created successfully",
    reservation,
  });
});

///////-----Accept/Reject Reservations-----////////
exports.acceptRejectReservation = catchAsync(async (req, res, next) => {
  const { reservationId } = req.params;
  const { isReserved } = req.body;

  // Update reservation status
  const reservation = await Reservation.findByIdAndUpdate(
    reservationId,
    { isReserved },
    { new: true }
  );

  if (!reservation) {
    return res
      .status(404)
      .json({ success: false, message: "Reservation not found" });
  }

  res.status(200).json({
    success: true,
    message: "Reservation status updated successfully",
    reservation,
  });
});

////////-----Get all reservations of user----//////
exports.getAllReservationsByUser = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  const reservations = await Reservation.find({ user: userId });

  res.status(200).json({
    success: true,
    message: "Reservations retrieved successfully",
    reservations,
  });
});
