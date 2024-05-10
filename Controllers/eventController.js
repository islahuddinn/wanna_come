const catchAsync = require("../Utils/catchAsync");
const appError = require("../Utils/appError");
const Event = require("../Models/eventModel");
const User = require("../Models/userModel");
const factory = require("./handleFactory");
const Notification = require("../Models/notificationModel");
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
    availableTickets,
    soldTickets,
  } = req.body;

  const newEvent = await Event.create({
    title,
    image,
    price,
    date,
    time,
    location,
    description,
    availableTickets,
    soldTickets,
    createdBy: req.user.id,
  });

  ////// Send Notification
  const data = {
    eventTitle: req.body.title,
    eventInfo: req.body.eventInfo,
    eventLocation: req.body.eventLocation,
  };
  const notificationTitle = `New Event "${newEvent.title}" has been Created`;
  const notificationBody = `Hy Folks, another exciting event "${newEvent}" is going to be happen at eventLocation.`;

  // const deviceToken = req.body.FCMToken;

  const devices = await User.find({}, "deviceToken");
  console.log(devices);
  const FCMTokens = devices.map((device) => device.deviceToken);
  console.log(FCMTokens);

  if (!FCMTokens) {
    return res.status(404).json({
      success: false,
      status: 404,
      message: "FCMTokens not found...",
    });
  }
  await Notification.create({
    token: FCMTokens,
    title: notificationTitle,
    body: notificationBody,
    sender: req.user.id,
    data: data,
  });

  // await SendNotificationMultiCast({
  //   tokens: FCMTokens,
  //   title: notificationTitle,
  //   body: notificationBody,
  //   data: data,
  // });

  res.status(201).json({
    status: 201,
    success: true,
    // event: createdEvent,
    event: newEvent,
  });
});

exports.getallEvent = factory.getAll(Event);
exports.getOneEvent = factory.getOne(Event);
exports.updateEvent = factory.updateOne(Event);
exports.deleteEvent = factory.deleteOne(Event);
