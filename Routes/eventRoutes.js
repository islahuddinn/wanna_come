const express = require("express");
const userController = require("../Controllers/userController");
const authController = require("../Controllers/authController");
const eventController = require("../Controllers/eventController");
const router = express.Router();

router.use(authController.protect);
router.post(
  "/create",
  authController.restrictTo("Owner"),
  // eventController.setCreator,
  eventController.createEvent
);

router.get("/", eventController.getallEvent);

router
  .route("/:id")
  .get(eventController.getOneEvent)
  .patch(authController.restrictTo("Owner"), eventController.updateEvent)
  .delete(authController.restrictTo("Owner"), eventController.deleteEvent);

module.exports = router;
