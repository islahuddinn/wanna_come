const catchAsync = require("../Utils/catchAsync");
const User = require("../Models/userModel");
const Event = require("../Models/eventModel");
const AdminNotificationService = require("../Utils/adminNotificationService");
const Email = require("../Utils/mailSend");
const generateReferralCode = require("../Utils/referralCodeGenerator");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// const Event = require("../Models/eventModel");
// const Referral = require("../Models/referralModel");

/// 1. Notify admin for request to join affiliate program

exports.requestAffiliateApproval = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const user = await User.findById(userId);

  if (user.isAffiliate) {
    return res.status(400).json({
      success: false,
      status: 400,
      message: "You are already an affiliate.",
    });
  }

  // const referralCode = generateReferralCode();
  // await User.findByIdAndUpdate(userId, {
  //   referralCode,
  // });
  // Logic to request approval (e.g., notify admin)
  // user.affiliateStatus = "pending";
  // await user.save();

  // Notify admin about the affiliate request
  try {
    await AdminNotificationService.notifyAdminAboutAffiliateRequest(user);
  } catch (error) {
    // Handle any errors that may occur while notifying the admin
    console.error("Error notifying admin:", error);
    // Log the error and continue with the response
  }

  res.status(200).json({
    success: true,
    status: 200,
    message: "Affiliate approval is pending.",
  });
});

//// 2. Aproved Affiliate user request by Admin

exports.requestApproved = catchAsync(async (req, res, next) => {
  const user = req.user;
  user.isAffiliate = req.body.isAffiliate;

  await user.save();

  try {
    await EmailtoUser(user, message);
  } catch (error) {
    console.error("Error Sending Email to User:", error);
  }

  if (user.isAffiliate === true) {
    const referralCode = generateReferralCode();

    user.referralCode = referralCode;
    await user.save();

    return res.status(200).json({
      success: true,
      status: 200,
      message: "Affiliate user request approved.",
      data: { user },
    });
  } else if (user.isAffiliate === false) {
    return res.status(400).json({
      success: false,
      status: 400,
      message: "Affiliate user request rejected",
      data: { user },
    });
  }
});
