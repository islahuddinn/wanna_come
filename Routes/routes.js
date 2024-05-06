const express = require("express");
const userRoutes = require("./userRoute");
const eventRoutes = require("./eventRoutes");
// const menuRoutes = require("./menuRoutes");
const reviewsRoutes = require("./reviewsRoutes");
const restaurantRoutes = require("./restaurantRoutes");
const reservationRoutes = require("./reservationRoutes");
const privacyRoutes = require("./privacyPolicyRoute");
const termsandconditionRoutes = require("./termsAndConditionRoute");
const subscriptionRoutes = require("./subscriptionRoutes");

const setupRoutesV1 = () => {
  const router = express.Router();
  router.use("/user", userRoutes);
  router.use("/events", eventRoutes);
  // router.use("/menu", menuRoutes);
  router.use("/restaurants", restaurantRoutes);
  router.use("/reservations", reservationRoutes);
  router.use("/review", reviewsRoutes);
  router.use("/privacy", privacyRoutes);
  router.use("/termsandcondition", termsandconditionRoutes);
  router.use("/subscription", subscriptionRoutes);

  return router;
};
module.exports = setupRoutesV1;
