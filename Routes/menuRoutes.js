const express = require("express");
const userController = require("../Controllers/userController");
const authController = require("../Controllers/authController");
const menuController = require("../Controllers/menuController");
const router = express.Router();

// router.use(authController.protect);
router.post(
  "/create",
  // authController.protect,
  //   authController.restrictTo("Owner"),
  // eventController.setCreator,
  menuController.createMenu
);

router.get("/", menuController.getallMenu);

router
  .route("/:id")
  .get(menuController.getOneMenu)
  .patch(
    // authController.protect,
    // authController.restrictTo("Owner"),
    menuController.updateMenu
  )
  .delete(
    // authController.protect,
    // authController.restrictTo("Owner"),
    menuController.deleteMenu
  );

module.exports = router;
