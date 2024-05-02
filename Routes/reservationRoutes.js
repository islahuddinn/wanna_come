const express = require("express");
const userController = require("../Controllers/userController");
const authController = require("../Controllers/authController");
const reservationController = require("../Controllers/reservationController");
const router = express.Router();

router.use(authController.protect);
router.route("/event-reservation/:id").post(
  // authController.protect,
  //   authController.restrictTo("Owner"),
  // eventController.setCreator,
  reservationController.eventReservation
);
// router.post(
//   "/create",
//   // authController.protect,
//   //   authController.restrictTo("Owner"),
//   // eventController.setCreator,
//   reservationController.eventReservation
// );
// router.post(
//   "/create",
//   // authController.protect,
//   //   authController.restrictTo("Owner"),
//   // eventController.setCreator,
//   reservationController.eventReservation
// );
// router.get("/", reservationController.getallReservation);

// router
//   .route("/:id")
//   .get(reservationController.getOneReservation)
//   .patch(
//     // authController.protect,
//     // authController.restrictTo("Owner"),
//     reservationController.updateReservation
//   )
//   .delete(
//     // authController.protect,
//     // authController.restrictTo("Owner"),
//     reservationController.deleteReservation
//   );

module.exports = router;
