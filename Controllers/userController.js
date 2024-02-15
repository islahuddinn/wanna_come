const User = require("../Models/userModel");
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const factory = require("./handleFactory");
const cron = require("node-cron");
const Notification = require("../Models/notificationModel");
// const paginationQueryExtracter = require("../Utils/paginationQueryExtractor");
const paginateArray = require("../Utils/paginationHelper");
const RefreshToken = require("../Models/refreshTokenModel");
// const Guardian = require("../Models/guardianModel");

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for password updates. Please use /updateMyPassword.",
        400
      )
    );
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body, "email");
  if (req.file) filteredBody.photo = req.file.filename;
  // 3) Update user document..
  const updatedUser = await User.findByIdAndUpdate(req.user._id, req.body, {
    new: true,
  });

  res.status(200).json({
    status: 200,
    success: true,
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  // await User.findByIdAndUpdate(req.user.id, { active: false });
  const user = await User.findOne({ _id: req.user._id });
  if (user.subscriptionId) {
    await stripe.subscriptions.del(user.subscriptionId);
  }
  await RefreshToken.deleteMany({ user: req.user._id });
  await Guardian.deleteMany({
    $or: [{ guardian: req.user._id }, { user: req.user._id }],
  });
  await User.findByIdAndDelete(req.user._id);
  res.status(200).json({
    status: 204,
    success: true,
    data: null,
  });
});

exports.getUser = catchAsync(async (req, res, next) => {
  let user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError("No User Found With Given Id ", 404));
  }

  return res.status(200).json({
    status: 200,
    success: true,
    user,
  });
});
exports.getAllUsers = factory.getAll(User);

// Do NOT update passwords with this!
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);

//Affiliate User

// exports.affiliateUser = catchAsync(async (req, res, next) => {
//   // 1. get user with event id
//   // 2. get
// });

// Affiliate User Signup
exports.signupAffiliate = catchAsync(async (req, res, next) => {
  const { name, email, password, confirmPassword, affiliateCode } = req.body;

  // Check if the affiliate code is valid (you may need to implement this logic)
  const isValidAffiliateCode = checkIfValidAffiliateCode(affiliateCode);

  if (!isValidAffiliateCode) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "Invalid affiliate code",
      data: {},
    });
  }

  // Create the user with affiliate information
  const newUser = await User.create({
    name,
    email,
    password,
    confirmPassword,
    isAffiliate: true,
    affiliateCode,
  });

  res.status(201).json({
    status: 201,
    success: true,
    message: "Affiliate user signed up successfully",
    data: { user: newUser },
  });
});

// PR User Signup
exports.signupPRUser = catchAsync(async (req, res, next) => {
  const { name, email, password, confirmPassword, prCode } = req.body;

  // Check if the PR code is valid (you may need to implement this logic)
  const isValidPRCode = checkIfValidPRCode(prCode);

  if (!isValidPRCode) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "Invalid PR code",
      data: {},
    });
  }

  // Create the user with PR information
  const newUser = await User.create({
    name,
    email,
    password,
    confirmPassword,
    isPRUser: true,
    prCode,
  });

  res.status(201).json({
    status: 201,
    success: true,
    message: "PR user signed up successfully",
    data: { user: newUser },
  });
});

////// get User Ballance
exports.getWalletBalance = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      status: 200,
      message: "Wallet balance retrieved successfully.",
      data: {
        walletBalance: user.walletBalance,
        userId: user,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      status: 500,
      message: "Internal server error.",
      error: error.message,
    });
  }
});

/////////// Notifications
exports.mynotifications = catchAsync(async (req, res, next) => {
  const notifictations = await Notification.find({
    $and: [{ notifyType: { $ne: "sendMessage" } }, { receiver: req.user.id }],
  }).sort("-createdAt");

  const notifictationsmulti = await Notification.find({
    $and: [
      { notifyType: { $ne: "sendMessage" } },
      { multireceiver: { $in: [req.user.id] } },
    ],
  }).sort("-createdAt");

  await Notification.updateMany(
    {
      $and: [
        { isSeen: { $not: { $elemMatch: { $eq: req.user.id } } } },
        { multireceiver: { $elemMatch: { $eq: req.user.id } } },
      ],
    },
    { $addToSet: { isSeen: req.user.id } }
  );

  //////////////////
  let records;
  records = JSON.parse(JSON.stringify(notifictationsmulti));
  console.log("RECORDS: ", records.length);
  for (let i = 0; i < records.length; i++) {
    if (records[i].isSeen && records[i].isSeen.length > 0) {
      if (records[i].isSeen.includes(JSON.parse(JSON.stringify(req.user.id)))) {
        records[i].actionTaken = true;
      } else {
        records[i].actionTaken = false;
      }
    } else {
      records[i].actionTaken = false;
    }
    console.log("A");
  }

  // records.push(JSON.parse(JSON.stringify(notifictations)));
  const mergedNotifications = records.concat(notifictations);
  // console.log(records);
  mergedNotifications.sort((a, b) => b.createdAt - a.createdAt);
  //////

  const filteredDocs = notifictations.filter((doc) => !doc.actionTaken);

  const ids = filteredDocs.map((doc) => doc._id);

  const update = {
    $set: {
      actionTaken: true,
    },
  };

  const filter = {
    _id: {
      $in: ids,
    },
  };

  await Notification.updateMany(filter, update);

  const data = paginateArray(
    mergedNotifications,
    req.query.page,
    req.query.limit
  );

  res.status(200).json({
    success: true,
    status: 200,
    size: mergedNotifications.length,
    data,
  });
});
