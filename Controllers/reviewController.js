const Review = require("../Models/reviewModel");
const AppError = require("../Utils/appError");
const catchAsync = require("../Utils/catchAsync");
const factory = require("./handleFactory");
const Email = require("../Utils/mailSend");

exports.setCreator = catchAsync(async (req, res, next) => {
  req.body.creator = req.user.id;

  if (req?.user?.email) {
    let newUser = {
      email: "wanna.social.sl@gmail.com",
      name: "Wanna-Come",
    };

    const message = `${req.body.review}. For Reply use this Email/Phone: ${
      req?.user?.email ? req?.user?.email : req?.user?.number
    }`;

    try {
      await new Email(newUser, message).sendSupportMessage(message);
    } catch (error) {
      console.log(error);
    }
  }
  next();
});

exports.createReview = factory.creatOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.getAll = factory.getAll(Review);

exports.getOne = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError("Review not found", 404));
  }

  review.isSeen = true;

  await review.save({ validateBeforeSave: false });

  res.status(200).json({
    status: "Success",
    review,
  });
});

exports.getUnSeenReview = catchAsync(async (req, res, next) => {
  let skip = (req.query.currentPage - 1) * req.query.pageSize;

  const review = await Review.find({ isSeen: false })
    .skip(skip)
    .limit(req.query.pageSize)
    .sort("createdAt");

  if (review.length < 1) {
    return next(new AppError("Review not found", 404));
  }

  res.status(200).json({
    status: "Success",
    review,
  });
});

exports.getSeenReview = catchAsync(async (req, res, next) => {
  let skip = (req.query.currentPage * 1 - 1) * req.query.pageSize * 1;

  const review = await Review.find({ isSeen: true })
    .skip(skip)
    .limit(req.query.pageSize * 1)
    .sort("createdAt");

  if (review.length < 1) {
    return next(new AppError("Review not found", 404));
  }

  res.status(200).json({
    status: "Success",
    review,
  });
});
