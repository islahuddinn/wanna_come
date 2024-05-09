const catchAsync = require("../Utils/catchAsync");
const appError = require("../Utils/appError");
const CalculateRewards = require("../Utils/calculateRewardPoints");
const Event = require("../Models/eventModel");
const Menu = require("../Models/menuModel");
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
const Restaurant = require("../Models/restaurantModel");
//////---------Events reservations------//////

exports.eventReservation = catchAsync(async (req, res, next) => {
  const { persons } = req.body;
  const eventId = req.params.id;
  const userId = req.user.id;
  // Check if the event exists
  console.log(userId, "mr user");
  const event = await Event.findById(eventId);
  console.log(event, "event being reserved");
  if (!userId) {
    return next(new appError("User not found", 404));
  }
  if (!event) {
    return next(new appError("Event not found", 404));
  }

  // Check if there are available tickets
  if (event.availableTickets === 0) {
    return next(new appError("No available tickets", 404));
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
  //////impliment the rewards logic here
  const reservations = await Reservation.find({ reservedBy: userId });

  const pointsEarned = CalculateRewards(reservations);
  req.user.rewardPoints += pointsEarned;
  await req.user.save();

  // Send notification to admin about reservation
  const title = `Reservation for event "${event.title}" has been made by user ${userId}`;
  const body = `Reservation request for event "${event}" has been made by user ${userId}`;
  const ownerId = event.createdBy.id;
  console.log(ownerId, "mr owner id");
  const businessOwner = await User.findById(ownerId);
  console.log("here is the business owner of event !", businessOwner);

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
    data: { user: userId },
  });
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
    pointsEarned,
  });
});

//////---------Table Reservations------///////
exports.tableReservation = catchAsync(async (req, res, next) => {
  const { persons, selectedMenu, date, time } = req.body;
  const restaurantId = req.params.id;
  const userId = req.user.id;

  // Check if the event exists
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) {
    return next(new appError("Restaurant not found", 404));
  }
  console.log(restaurant, "selected restaurant by user");
  const menu = await Menu.findById(selectedMenu);
  if (!menu) {
    return next(new appError("Menu not found", 404));
  }
  console.log(menu, "selected menu by user");
  // Check if there are available seats
  if (restaurant.availableSeats < persons) {
    return next(new appError("Not enough available seats", 400));
  }

  /// Create a payment intent using Stripe
  const paymentIntent = await stripe.paymentIntents.create({
    amount: menu.price * persons * 100,
    currency: "usd",
    metadata: {
      restaurant: restaurant.id,
      userId: userId,
    },
  });
  if (time < restaurant.openingTime || time > restaurant.closingTime) {
    return next(
      new appError(
        "Select the time between opening and closing time of restaurant",
        400
      )
    );
  }
  // Create reservation
  const reservation = await Reservation.create({
    restaurant: restaurantId,
    paymentIntentId: paymentIntent.id,
    persons,
    menu,
    date: date,
    time: time,
    reservedBy: userId,
  });
  //////rewards earned logic
  const reservations = await Reservation.find({ reservedBy: userId });

  const pointsEarned = CalculateRewards(reservations);
  req.user.rewardPoints += pointsEarned;
  await req.user.save();
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
    pointsEarned,
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
    return next(new appError("Reservation Not found", 404));
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
    return next(new appError("Event/Table booker not found", 404));
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
  const userId = req.user.id;
  console.log(userId, "mr user");
  const reservations = await Reservation.find({ reservedBy: userId });

  res.status(200).json({
    success: true,
    status: 200,
    message: "Reservations retrieved successfully",
    reservations,
  });
});
/////---------Reward Points--------//////
// Controller function to redeem rewards points
// exports.redeemRewardsPoints = async (req, res, next) => {
//   try {
//     // Logic to redeem rewards points
//     const pointsToRedeem = req.body.pointsToRedeem;
//     if (req.user.rewardPoints < pointsToRedeem) {
//       return res.status(400).json({
//         success: false,
//         message: "Insufficient rewards points",
//       });
//     }

//     // Implement logic to redeem points (e.g., apply discount or generate voucher)

//     // Update user's rewardPoints field
//     req.user.rewardPoints -= pointsToRedeem;
//     await req.user.save();

//     res.status(200).json({
//       success: true,
//       message: "Rewards points redeemed successfully",
//       data: {
//         rewardPoints: req.user.rewardPoints,
//       },
//     });
//   } catch (error) {
//     next(error);
//   }
// };
// Controller function to get user's reward points

/////---------Analytics--------//////
exports.aggregateReservations = catchAsync(async (req, res, next) => {
  console.log("Route hit for login");
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
