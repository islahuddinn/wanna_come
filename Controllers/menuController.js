const catchAsync = require("../Utils/catchAsync");
const appError = require("../Utils/appError");
const Menu = require("../Models/menuModel");
const factory = require("./handleFactory");

exports.createMenu = catchAsync(async (req, res, next) => {
  const { dishName, image, price, description } = req.body;

  try {
    // Create a new menu item
    const newMenu = await Menu.create({
      dishName,
      image,
      price,
      description,
    });

    res.status(201).json({
      success: true,
      status: 201,
      menu: newMenu,
    });
  } catch (error) {
    next(error);
  }
});
exports.getallMenu = factory.getAll(Menu);
exports.getOneMenu = factory.getOne(Menu);
exports.updateMenu = factory.updateOne(Menu);
exports.deleteMenu = factory.deleteOne(Menu);
