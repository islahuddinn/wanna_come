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
  console.log(userId, "mr user");
  const event = await Event.findById(eventId);
  console.log(event, "event being reserved");
  if (!userId) {
    return res
      .status(404)
      .json({ success: false, status: 404, message: "User not found" });
  }
  if (!event) {
    return res
      .status(404)
      .json({ success: false, status: 404, message: "Event not found" });
  }

  // Check if there are available tickets
  if (event.availableTickets === 0) {
    return res
      .status(400)
      .json({ success: false, status: 400, message: "No available tickets" });
  }

  /// Create a payment intent using Stripe
  const paymentIntent = await stripe.paymentIntents.create({
    amount: event.price * 100,
    currency: "usd",
    metadata: {
      eventId: eventId,
      userId: userId,
    },
  });
  const paymentIntentId = paymentIntent.id;
  // Create reservation
  const reservation = await Reservation.create({
    event: eventId,
    paymentIntentId,
    persons,
    date: event.date,
    time: event.time,
    reservedBy: userId,
  });

  // Update event's available tickets and sold tickets
  event.availableTickets -= persons;
  event.soldTickets += persons;
  await event.save();

  // // Send notification to admin about reservation
  // const title = `Reservation for event "${event.title}" has been made by user ${userId}`;
  // const body = `Reservation request for event "${event}" has been made by user ${userId}`;
  // const ownerId = event.createdBy.id;
  // console.log(ownerId, "mr owner id");
  // const businessOwner = await User.findById(ownerId);
  // console.log("here is the business owner of event !", businessOwner);

  // // Find the deviceToken of the business owner
  // const token = businessOwner.deviceToken;
  // console.log("fcmToken is here !", token);
  // // const token = (await RefreshToken.find({ user: creator.id })).map(
  // //   ({ deviceToken }) => deviceToken
  // // );
  // await Notification.create({
  //   token: token,
  //   title: title,
  //   body: body,
  //   data: { user: userId },
  // });
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
    availableTickets: event.availableTickets,
    soldTickets: event.soldTickets,
  });
});

//////---------Table Reservations------///////
exports.tableReservation = catchAsync(async (req, res, next) => {
  const { persons, selectedMenu, date, time } = req.body;
  const restaurantId = req.params.id;
  const userId = req.user.id;

  // Check if the event exists
  const restaurant = await User.findById(restaurantId);
  if (!restaurant) {
    return res
      .status(404)
      .json({ status: 404, success: false, message: "Restaurant not found" });
  }
  console.log(restaurant, "selected restaurant by user");
  // Check if there are available seats
  if (restaurant.availableSeats < persons) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "Not enough available seats",
    });
  }

  /// Create a payment intent using Stripe
  const paymentIntent = await stripe.paymentIntents.create({
    amount: selectedMenu.price * persons * 100, // Assuming price is per person
    currency: "usd",
    metadata: {
      restaurantId: restaurant._id,
      selectedMenu: selectedMenu,
      userId: userId,
    },
  });

  // Create reservation
  const reservation = await Reservation.create({
    restaurant: restaurantId,
    paymentIntentId: paymentIntent.id,
    persons,
    selectedMenu,
    date: date,
    time: time,
    reservedBy: userId,
  });

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
    status: 201,
    message: "Reservation created successfully",
    reservation,
  });
});

///////-----Accept/Reject Reservations-----////////
exports.acceptRejectReservation = catchAsync(async (req, res, next) => {
  const reservationId = req.params.id;
  const { isReserved } = req.body;
  console.log(reservationId, "reserved");
  // Update reservation status
  const reservation = await Reservation.findById(reservationId);

  if (!reservation) {
    return res
      .status(404)
      .json({ success: false, status: 404, message: "Reservation not found" });
  }

  // Determine notification message based on reservation status
  let notificationMessage = "";
  if (isReserved) {
    notificationMessage = `Reservation "${reservation.id}" has been accepted`;
  } else {
    notificationMessage = `Reservation "${reservation.id}" has been rejected`;
  }
  console.log(notificationMessage, "here's come the notikipation");
  // Send notification to the event booker
  const bookerId = reservation.reservedBy.id;
  console.log(bookerId, "here is the mr booker id");
  const booker = await User.findById(bookerId);

  if (!booker) {
    return res
      .status(404)
      .json({ success: false, message: "Event booker not found" });
  }

  const title = "Reservation Status Update";
  const body = notificationMessage;
  const token = booker.deviceToken;

  await Notification.create({
    token: token,
    title: title,
    body: body,
    data: { reservationId: reservationId },
  });

  // await SendNotification({
  //   token: token,
  //   title: title,
  //   body: body,
  //   data: { reservationId: reservationId },
  // });
  const updatedReservation = await Reservation.findByIdAndUpdate(
    reservationId,
    {
      isReserved,
      new: true,
    }
  );
  res.status(200).json({
    success: true,
    staus: 200,
    message: "Reservation status updated successfully",
    updatedReservation,
  });
});

////////-----Get all reservations of user----//////
exports.getAllReservationsByUser = catchAsync(async (req, res, next) => {
  const { userId } = req.user.id;
  console.log(userId, "mr user");
  const reservations = await Reservation.find({ reservedBy: userId });

  res.status(200).json({
    success: true,
    message: "Reservations retrieved successfully",
    reservations,
  });
});
/////Analytics
exports.aggregateReservations = catchAsync(async (req, res, next) => {
  try {
    const pipeline = [
      {
        $match: {
          date: { $exists: true }, // Filter reservations with a date
        },
      },
      {
        $project: {
          month: { $month: "$date" }, // Extract month from date
          eventReservation: {
            $cond: [{ $gt: ["$event", null] }, 1, 0], // Check if event reservation exists
          },
          tableReservation: {
            $cond: [{ $gt: ["$restaurant", null] }, 1, 0], // Check if table reservation exists
          },
        },
      },
      {
        $group: {
          _id: "$month",
          totalEventReservations: { $sum: "$eventReservation" },
          totalTableReservations: { $sum: "$tableReservation" },
        },
      },
      {
        $sort: { _id: 1 }, // Sort by month in ascending order
      },
    ];

    const result = await Reservation.aggregate(pipeline);
    return result;
  } catch (error) {
    console.error("Error aggregating reservations:", error);
    throw error;
  }
});
exports.getallReservation = factory.getAll(Reservation);
exports.getOneReservation = factory.getOne(Reservation);
exports.updatedReservation = factory.updateOne(Reservation);
exports.deleteReservation = factory.deleteOne(Reservation);
