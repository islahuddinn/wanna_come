const express = require("express");
const userController = require("../Controllers/userController");
const authController = require("../Controllers/authController");
const reservationController = require("../Controllers/reservationController");
const router = express.Router();

router.use(authController.protect);
router
  .route("/event-reservation/:id")
  .post(reservationController.eventReservation);
router
  .route("/table-reservation/:id")
  .post(reservationController.tableReservation);
router
  .route("/accept-reject-reservations/:id")
  .post(
    authController.restrictTo("Owner"),
    reservationController.acceptRejectReservation
  );
router.get("/", reservationController.getallReservation);
router.get(
  "/user-all-reservations",
  reservationController.getAllReservationsByUser
);
router.get(
  "/get-analytics",
  // authController.restrictTo("Owner"),
  reservationController.aggregateReservations
);
router.get(
  "/search-reservations",
  // authController.restrictTo("Owner"),
  reservationController.searchReservations
);
router
  .route("/:id")
  .get(reservationController.getOneReservation)
  .patch(reservationController.updatedReservation)
  .delete(reservationController.deleteReservation);

module.exports = router;
