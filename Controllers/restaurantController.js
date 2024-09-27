const appError = require("../Utils/appError");
const Restaurant = require("../Models/restaurantModel");
const factory = require("./handleFactory");
const { loginChecks } = require("../Utils/login-checks");

exports.updateBusinessProfile = async (req, res, next) => {
  const user = req.user;
  try {
    if (user.userType !== "Owner") {
      return next(
        new appError(
          "You are not authorized to update the business profile",
          403
        )
      );
    }

    const {
      image,
      businessName,
      firstName,
      lastName,
      businessDescription,
      businessLocation,
      openingTime,
      closingTime,
    } = req.body;

    // Create a new restaurant
    const newRestaurant = await Restaurant.create({
      image,
      businessName,
      firstName,
      lastName,
      businessDescription,
      businessLocation,
      openingTime,
      closingTime,
      createdBy: user.id,
    });
    user.isProfileCompleted = true;
    await user.save();
    res.act = loginChecks(user);

    res.status(201).json({
      success: true,
      status: 201,
      restaurant: newRestaurant,
    });
  } catch (error) {
    next(error);
  }
};

/// Get user restaurant
exports.getBusinessProfile = async (req, res, next) => {
  const user = req.user;
  try {
    // Check if the user is authorized to view the business profile
    if (user.userType !== "Owner") {
      return next(
        new appError("You are not authorized to view the business profile", 403)
      );
    }

    // Find the restaurant associated with the user
    const restaurant = await Restaurant.findOne({ createdBy: user.id });

    // If no restaurant is found, return an error
    if (!restaurant) {
      return next(new appError("Restaurant not found", 404));
    }

    // Return the restaurant profile
    res.status(200).json({
      success: true,
      status: 200,
      restaurant,
    });
  } catch (error) {
    next(error);
  }
};

exports.getallRestaurant = factory.getAll(Restaurant);
exports.getOneRestaurant = factory.getOne(Restaurant);
exports.updateRestaurant = factory.updateOne(Restaurant);
exports.deleteRestaurant = factory.deleteOne(Restaurant);
