const express = require("express");
const userController = require("../Controllers/userController");
const authController = require("../Controllers/authController");
const apiController = require("../Controllers/apiController");
const eventController = require("../Controllers/eventController");
const router = express.Router();

router.use(authController.protect);
router.post(
  "/create",
  // authController.protect,
  //   authController.restrictTo("admin"),
  // eventController.setCreator,
  eventController.createEvent
);

router.get("/", eventController.getallEvent);
router.get("/get-events", apiController.fetchDataFromAPI);

router
  .route("/:id")
  .get(eventController.getOneEvent)
  .patch(
    // authController.protect,
    // authController.restrictTo("admin"),
    eventController.updateEvent
  )
  .delete(
    // authController.protect,
    // authController.restrictTo("admin"),
    eventController.deleteEvent
  );
router.post("/share-events", eventController.shareEvent);
router.post("/book-event", eventController.bookEvent);

module.exports = router;
