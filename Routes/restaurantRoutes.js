const express = require("express");
const userController = require("../Controllers/userController");
const authController = require("../Controllers/authController");
const restaurantController = require("../Controllers/restaurantController");
const router = express.Router();

// router.use(authController.protect);
router.post(
  "/create",
  // authController.protect,
  //   authController.restrictTo("Owner"),
  // eventController.setCreator,
  restaurantController.createRestaurant
);

router.get("/", restaurantController.getallRestaurant);

router
  .route("/:id")
  .get(restaurantController.getOneRestaurant)
  .patch(
    // authController.protect,
    // authController.restrictTo("Owner"),
    restaurantController.updateRestaurant
  )
  .delete(
    // authController.protect,
    // authController.restrictTo("Owner"),
    restaurantController.deleteRestaurant
  );

module.exports = router;
