const catchAsync = require("../Utils/catchAsync");
const appError = require("../Utils/appError");
const Restaurant = require("../Models/restaurantModel");
const Event = require("../Models/eventModel");
const User = require("../Models/userModel");
const factory = require("./handleFactory");

// exports.createRestaurant = catchAsync(async (req, res, next) => {
//   const {
//     image,
//     businessName,
//     businessDescription,
//     businessLocation,
//     openingTime,
//     closingTime,
//   } = req.body;

//   try {
//     // Create a new restaurant
//     const newRestaurant = await Restaurant.create({
//       image,
//       businessName,
//       businessDescription,
//       businessLocation,
//       openingTime,
//       closingTime,
//       OwnerId: req.user.id,
//     });

//     res.status(201).json({
//       success: true,
//       status: 201,
//       restaurant: newRestaurant,
//     });
//   } catch (error) {
//     next(error);
//   }
// });

exports.createRestaurant = factory.creatOne(Restaurant);
exports.getallRestaurant = factory.getAll(Restaurant);
exports.getOneRestaurant = factory.getOne(Restaurant);
exports.updateRestaurant = factory.updateOne(Restaurant);
exports.deleteRestaurant = factory.deleteOne(Restaurant);
