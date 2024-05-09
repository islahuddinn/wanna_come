const express = require("express");
const userController = require("../Controllers/userController");
const authController = require("../Controllers/authController");
const reservationController = require("../Controllers/reservationController");
const router = express.Router();

router.use(authController.protect);
router.route("/event-reservation/:id").post(
  //   authController.restrictTo("Owner"),
  // eventController.setCreator,
  reservationController.eventReservation
);
router.route("/table-reservation/:id").post(
  // eventController.setCreator,
  reservationController.tableReservation
);
router.route("/accept-reject-reservations/:id").post(
  //   authController.restrictTo("Owner"),
  reservationController.acceptRejectReservation
);
router.get("/", reservationController.getallReservation);
router.get(
  "/user-all-reservations",
  reservationController.getAllReservationsByUser
);
router
  .route("/:id")
  .get(reservationController.getOneReservation)
  .patch(
    // authController.restrictTo("Owner"),
    reservationController.updatedReservation
  )
  .delete(
    // authController.restrictTo("Owner"),
    reservationController.deleteReservation
  );
router.get(
  "/get-analytics",
  //   authController.restrictTo("Owner"),
  reservationController.aggregateReservations
);

module.exports = router;
