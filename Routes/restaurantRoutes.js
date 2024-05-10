const express = require("express");
const userController = require("../Controllers/userController");
const authController = require("../Controllers/authController");
const restaurantController = require("../Controllers/restaurantController");
const router = express.Router();

router.use(authController.protect);

router.get("/", restaurantController.getallRestaurant);

router
  .route("/:id")
  .get(
    // authController.restrictTo("Owner"),
    restaurantController.getOneRestaurant
  )
  .patch(
    authController.restrictTo("Owner"),
    restaurantController.updateRestaurant
  )
  .delete(
    authController.restrictTo("Owner"),
    restaurantController.deleteRestaurant
  );

module.exports = router;
