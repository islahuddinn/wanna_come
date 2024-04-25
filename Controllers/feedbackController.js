const Feedback = require("../Models/feedbackModel");
const AppError = require("../Utils/appError");
const catchAsync = require("../Utils/catchAsync");
const factory = require("./handlersFactory");
const Email = require("../Utils/email");

exports.setCreator = catchAsync(async (req, res, next) => {
  req.body.creator = req.user.id;

  if (req?.user?.email) {
    let newUser = {
      email: "beido.social.sl@gmail.com",
      name: "Beido",
    };

    const message = `${req.body.feedback}. For Reply use this Email/Phone: ${
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

exports.createFeedback = factory.creatOne(Feedback);
exports.deleteFeedback = factory.deleteOne(Feedback);
exports.getAll = factory.getAll(Feedback);

exports.getOne = catchAsync(async (req, res, next) => {
  const feedback = await Feedback.findById(req.params.id);

  if (!feedback) {
    return next(new AppError("Feedback not found", 404));
  }

  feedback.isSeen = true;

  await feedback.save({ validateBeforeSave: false });

  res.status(200).json({
    status: "Success",
    feedback,
  });
});

exports.getUnSeenFeedback = catchAsync(async (req, res, next) => {
  let skip = (req.query.currentPage - 1) * req.query.pageSize;

  const feedback = await Feedback.find({ isSeen: false })
    .skip(skip)
    .limit(req.query.pageSize)
    .sort("createdAt");

  if (feedback.length < 1) {
    return next(new AppError("Feedback not found", 404));
  }

  res.status(200).json({
    status: "Success",
    feedback,
  });
});

exports.getSeenFeedback = catchAsync(async (req, res, next) => {
  let skip = (req.query.currentPage * 1 - 1) * req.query.pageSize * 1;

  const feedback = await Feedback.find({ isSeen: true })
    .skip(skip)
    .limit(req.query.pageSize * 1)
    .sort("createdAt");

  if (feedback.length < 1) {
    return next(new AppError("Feedback not found", 404));
  }

  res.status(200).json({
    status: "Success",
    feedback,
  });
});
