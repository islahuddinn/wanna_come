const express = require("express");
const userController = require("../Controllers/userController");
const authController = require("../Controllers/authController");
const reservationController = require("../Controllers/reservationController");
const router = express.Router();

router.use(authController.protect);
router.route("/event-reservation/:id").post(
  authController.protect,
  //   authController.restrictTo("Owner"),
  // eventController.setCreator,
  reservationController.eventReservation
);
router.route("/table-reservation/:id").post(
  authController.protect,
  // eventController.setCreator,
  reservationController.tableReservation
);
router.route("/accept-reject-reservations/:id").post(
  authController.protect,
  //   authController.restrictTo("Owner"),
  // eventController.setCreator,
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
    authController.protect,
    // authController.restrictTo("Owner"),
    reservationController.updatedReservation
  )
  .delete(
    authController.protect,
    // authController.restrictTo("Owner"),
    reservationController.deleteReservation
  );
router.get(
  "/redeem-rewards-points",
  //   authController.restrictTo("Owner"),
  // eventController.setCreator,
  reservationController.redeemRewardsPoints
);
router.get(
  "/get-user-rewards-points",
  //   authController.restrictTo("Owner"),
  // eventController.setCreator,
  reservationController.getUserRewardPoints
);
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
