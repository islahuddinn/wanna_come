const express = require("express");
const userController = require("../Controllers/userController");
const authController = require("../Controllers/authController");
const menuController = require("../Controllers/menuController");
const router = express.Router();

router.use(authController.protect);
router.post(
  "/create",
  authController.restrictTo("Owner"),
  // eventController.setCreator,
  menuController.createMenu
);
router.post("/order-menu", menuController.orderMenu);

router.get("/", menuController.getallMenu);
router.get("/get-all-orders", menuController.getallOrder);
router.route("/get-order-details/:id").get(menuController.getOneOrder);
router.route("/delete-order/:id").delete(menuController.deleteOrder);
router.route("/update-order/:id").patch(menuController.updateOrderMenu);

router.route("/cancel-order/:id").patch(menuController.cancelOrderMenu);
router
  .route("/:id")
  .get(menuController.getOneMenu)
  .patch(authController.restrictTo("Owner"), menuController.updateMenu)
  .delete(authController.restrictTo("Owner"), menuController.deleteMenu);

module.exports = router;
