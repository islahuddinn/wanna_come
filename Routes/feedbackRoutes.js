const express = require("express");
const authController = require("../Controllers/authControllers");
const feedbackController = require("../Controllers/feedbackController");

const router = express.Router();

router
  .route("/create")
  .post(
    authController.protect,
    authController.restrictTo("User"),
    feedbackController.setCreator,
    feedbackController.createFeedback
  );

router
  .route("/getall")
  .get(
    authController.protect,
    authController.restrictTo("Owner"),
    feedbackController.getAll
  );

router
  .route("/getunseen")
  .get(
    authController.protect,
    authController.restrictTo("Owner"),
    feedbackController.getUnSeenFeedback
  );

router
  .route("/getseen")
  .get(
    authController.protect,
    authController.restrictTo("Owner"),
    feedbackController.getSeenFeedback
  );

router
  .route("/getone/:id")
  .get(
    authController.protect,
    authController.restrictTo("Owner"),
    feedbackController.getOne
  );

router
  .route("/delete/:id")
  .delete(
    authController.protect,
    authController.restrictTo("Owner"),
    feedbackController.deleteFeedback
  );

module.exports = router;
