const catchAsync = require("../Utils/catchAsync");
const appError = require("../Utils/appError");
const Menu = require("../Models/menuModel");
const Event = require("../Models/eventModel");
const User = require("../Models/userModel");
const factory = require("./handleFactory");

exports.createMenu = catchAsync(async (req, res, next) => {
  const { dishName, image, price, description, numberOfPersons } = req.body;

  try {
    // Create a new menu item
    const newMenu = await Menu.create({
      dishName,
      image,
      price,
      description,
      numberOfPersons,
    });

    ////// Optionally, you can include notification sending logic here

    res.status(201).json({
      success: true,
      status: 201,
      menu: newMenu,
    });
  } catch (error) {
    next(error);
  }
});
exports.getallMenus = factory.getAll(Menu);
exports.getOneMenu = factory.getOne(Menu);
exports.deleteMenu = factory.deleteOne(Menu);
