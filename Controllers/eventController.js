const catchAsync = require("../Utils/catchAsync");
const Event = require("../Models/eventModel");
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

exports.getallEvent = factory.getAll(Event);
exports.getOneEvent = factory.getOne(Event);
