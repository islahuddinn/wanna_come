const express = require("express");
const userControler = require("../Controllers/userController");
const authController = require("../Controllers/authController");
// const apiController = require("../Controllers/apiController");
// const pushNotificationController = require("../controllers/push-notificationController");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/socialLogin", authController.socialLogin);
router.post("/guestLogin", authController.signup);
// router.post("/PRUser", affiliateControler.PRUser);
router.post("/verify", authController.verifyEmail);
router.post("/login", authController.login);
router.post("/sendOTP", authController.sendOTP);
router.post("/verifyOTP", authController.verifyOtp);
router.post("/refresh/:token", authController.refresh);
router.post("/forgetPassword", authController.forgotPassword);
router.patch("/resetPassword", authController.resetPassword);
router.post(
  "/verifyOTPResetPassword",
  authController.verifyOtpForResetPassword
);

// protecting all routes ussing protect midleware
router.use(authController.protect);
router.patch("/updateMyPassword", authController.updatePassword);
// router.get("/mynotifications", userController.mynotifications);

// router.get("/get-events", apiController.fetchDataFromAPI);
// router.post("/handleEventCommission", affiliateControler.calculateCashback);
router.post("/logout", authController.logout);
// router.post(
//   "/send-notification",
//   pushNotificationController.sendPushNotification
// );

router.get("/me", userControler.getMe, userControler.getUser);
router.patch("/updateProfile", userControler.updateMe);
// router.patch("/updateMe", userControler.updateMe);
// router.patch("/updateProfile", userControler.updateUserProfile);
// router.delete("/deleteMe", userControler.deleteMe); its not functional
router.route("/getAllUsers").get(userControler.getAllUsers);
router.get("/getwallet", userControler.getWalletBalance);

// router.use(authController.restrictTo("admin"));
// router.route("/").post(userControler.createUser);

router
  .route("/:id")
  .get(userControler.getUser)
  .patch(userControler.updateUser)
  .delete(userControler.deleteUser)
  .post(userControler.deleteUser);

module.exports = router;
