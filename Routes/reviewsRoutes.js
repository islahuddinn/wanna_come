const express = require("express");
const authController = require("../Controllers/authController");
const reviewController = require("../Controllers/reviewController");

const router = express.Router();

router
  .route("/create")
  .post(
    authController.protect,
    authController.restrictTo("User"),
    reviewController.setCreator,
    reviewController.createReview
  );

router
  .route("/getall")
  .get(
    authController.protect,
    authController.restrictTo("Owner"),
    reviewController.getAll
  );

router
  .route("/getunseen")
  .get(
    authController.protect,
    authController.restrictTo("Owner"),
    reviewController.getUnSeenReview
  );

router
  .route("/getseen")
  .get(
    authController.protect,
    authController.restrictTo("Owner"),
    reviewController.getSeenReview
  );

router
  .route("/getone/:id")
  .get(
    authController.protect,
    authController.restrictTo("Owner"),
    reviewController.getOne
  );

router
  .route("/delete/:id")
  .delete(
    authController.protect,
    authController.restrictTo("Owner"),
    reviewController.deleteReview
  );

module.exports = router;
