const catchAsync = require("../Utils/catchAsync");
const Event = require("../Models/eventModel");
const User = require("../Models/userModel");
const factory = require("./handleFactory");
const { SendNotification } = require("../Utils/notification");

exports.createEvent = catchAsync(async (req, res, next) => {
  const {
    title,
    description,
    location,
    image,
    price,
    eventInfo,
    age,
    date,
    duration,
  } = req.body;

  const newEvent = new Event({
    title,
    description,
    location,
    image,
    price,
    eventInfo,
    age,
    date,
    duration,
  });

  const createdEvent = await newEvent.save();

  ////// Send Notification
  const notificationTitle = "Event Created Successfully";
  const notificationBody =
    "Congratulations, Your event has been created successfully.";

  const deviceToken = req.body.FCMToken;

  try {
    await SendNotification({
      token: deviceToken,
      title: notificationTitle,
      body: notificationBody,
    });
    console.log("Notification sent to admin.");
  } catch (error) {
    console.error("Error sending notification.....:", error);
  }

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
    description,
    location,
    image,
    price,
    eventInfo,
    age,
    date,
    duration,
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
    eventToUpdate.description = description;
    eventToUpdate.location = location;
    eventToUpdate.image = image;
    eventToUpdate.price = price;
    eventToUpdate.eventInfo = eventInfo;
    eventToUpdate.age = age;
    eventToUpdate.date = date;
    eventToUpdate.duration = duration;

    const updatedEvent = await eventToUpdate.save();

    ////// Send Notification
    const notificationTitle = "Event Updated Successfully";
    const notificationBody =
      "Congratulations, Your event has been updated successfully.";

    const deviceToken = req.body.FCMToken;

    try {
      await SendNotification({
        token: deviceToken,
        title: notificationTitle,
        body: notificationBody,
      });
      console.log("Notification sent to user.");
    } catch (error) {
      console.error("Error sending notification:", error);
    }

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

////// Delete Event By Id
exports.deleteEvent = catchAsync(async (req, res, next) => {
  const eventId = req.params.id;
  console.log(eventId);
  try {
    const eventToDelete = await Event.findById(eventId);
    console.log(eventToDelete);
    if (!eventToDelete) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: "Event not found...",
      });
    }

    const eventTitle = eventToDelete.title;

    await eventToDelete.deleteOne();

    ////// Send Notification
    const notificationTitle = "Event Deleted";
    const notificationBody = `The event "${eventTitle}" has been deleted successfully.`;

    const deviceToken = req.body.FCMToken;

    try {
      await SendNotification({
        token: deviceToken,
        title: notificationTitle,
        body: notificationBody,
      });
      console.log("Notification sent to user.");
    } catch (error) {
      console.error("Error sending notification:", error);
    }

    res.status(204).json({
      success: true,
      status: 204,
      message: "Event deleted successfully",
    });
  } catch (error) {
    next(error);
  }
});

exports.shareEvent = catchAsync(async (req, res, next) => {
  const user = req.user;

  const eventId = req.params.eventId;

  if (!eventId) {
    return res.status(400).json({
      success: false,
      status: 400,
      message: "Event ID is required",
    });
  }

  try {
    const event = await Event.findById(eventId);

    if (!event) {
      return res
        .status(404)
        .json({ success: false, status: 404, message: "Event not found" });
    }

    const shareableLink = `${req.protocol}://${req.get(
      "host"
    )}/shared-event/${eventId}?referrer=${user._id}`;

    return res.status(200).json({
      success: true,
      status: 200,
      data: {
        user: {
          userId: user._id,
          referralCode: user.referralCode,
        },
        event: {
          eventId: event._id,
        },
        shareableLink: shareableLink,
      },
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

///// Function to calculate and update cashback for the referral
exports.calculateAndUpdateCashback = catchAsync(async (eventId, referrerId) => {
  try {
    const event = await Event.findById(eventId);
    const cashbackAmount = event.price * 0.05; // 5% cashback

    // Update cashback for the referrer
    await User.findByIdAndUpdate(referrerId, {
      $inc: { walletBalance: cashbackAmount },
    });

    // Save the cashback information in the Referral model
    // await Referral.create({
    //   referrer: referrerId,
    //   event: eventId,
    //   walletBalance,
    // });
  } catch (error) {
    console.error("Error calculating and updating cashback:", error);
  }
});

//////// handle event booking with referral link

exports.bookEvent = catchAsync(async (req, res, next) => {
  //// 1. get event id and user referral code
  const { eventId, userId } = req.body;
  const CashUpdate = this.calculateAndUpdateCashback;
  // Check if the user is a PRuser
  const user = await User.findById(userId);
  if (user.isPRUser === true) {
    return res.status(400).json({
      success: false,
      status: 400,
      message: "PRusers are not allowed to book events.",
    });
  }

  // Check if the referral code is valid
  if (user.referralCode) {
    const referrer = await User.findOne({ referralCode: user.referralCode });
    console.log(referrer);
    if (referrer) {
      CashUpdate(eventId, referrer._id);
      //// Proceed with the Stripe payment
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 1000, // Set your desired amount in cents (e.g., 10 USD)
        currency: "usd",
        description: "Event Booking",
        payment_method: req.body.payment_method,
        confirm: true,
        return_url: "http://127.0.0.1:3000/api/v1/user/requestAprroved", // it is a dumy url replace it with proper url
      });

      // Add your event booking logic here
      return res.status(200).json({
        success: true,
        status: 200,
        message: "Event booked successfully.",
        data: { user, paymentIntent },
      });
    }
  }

  // const paymentIntent = await stripe.paymentIntents.create({
  //   amount: 1000, // Set your desired amount in cents (e.g., 10 USD)
  //   currency: "usd",
  //   description: "Event Booking",
  //   payment_method: req.body.payment_method,
  //   confirm: true,
  // });

  return res.status(200).json({
    success: true,
    status: 200,
    message: "Event booked successfully for non Affiliates.",
    data: { user },
  });
});

exports.getallEvent = factory.getAll(Event);
exports.getOneEvent = factory.getOne(Event);
