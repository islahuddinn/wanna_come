const catchAsync = require("../utils/catchAsync");
const User = require("../Models/userModel");
const AdminNotificationService = require("../Utils/adminNotificationService");
const EmailtoUser = require("../Utils/mailSend");

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
  const referralCode = generateReferralCode();
  await User.findByIdAndUpdate(userId, {
    referralCode,
  });
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

exports.requestAprroved = catchAsync(async (req, res, next) => {
  const user = req.user;
  user.isAffiliate = req.body.isAffiliate; // send in body isAffiliate = true
  await user.save();
  try {
    await EmailtoUser.mailSend(user);
  } catch (error) {
    console.error("Error Sending Email to User:", error);
  }
  if ((user.isAffiliate = true)) {
    return res.status(400).json({
      success: false,
      status: 400,
      message: "Affiliate user request approved.",
    });
  }
});

//// 3. When User click on share event user will recieve a Unique link to share in his network

// handle event booking with referral link
exports.bookEventWithReferral = catchAsync(async (req, res, next) => {
  //// 1. get event id and user referral code
  const { eventId, referralCode } = req.body;
  const userId = req.user._id;

  // Check if the referral code is valid
  const referrer = await User.findOne({ referralCode });
  if (!referrer) {
    return res.status(400).json({
      success: false,
      message: "Invalid referral code.",
    });
  }

  // event booking logic
  // ...

  // Calculate and update cashback for the referrer
  await calculateAndUpdateCashback(eventId, referrer._id);

  return res.status(200).json({
    success: true,
    message: "Event booked successfully with referral.",
    data: {},
  });
});

// // Function to calculate and update cashback for the referral
// exports.calculateAndUpdateCashback = catchAsync(async (eventId, referrerId) => {
//   try {
//     const event = await Event.findById(eventId);
//     const cashbackAmount = event.price * 0.05; // 5% cashback

//     // Update cashback for the referrer
//     await User.findByIdAndUpdate(referrerId, {
//       $inc: { walletBalance: cashbackAmount },
//     });

//     // Save the cashback information in the Referral model
//     await Referral.create({
//       referrer: referrerId,
//       event: eventId,
//       cashbackAmount,
//     });
//   } catch (error) {
//     console.error("Error calculating and updating cashback:", error);
//   }
// });

// Controller to join the affiliate program
exports.joinAffiliateProgram = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  // Check if the user is already an affiliate
  const user = await User.findById(userId);
  if (user.isAffiliate) {
    return res.status(400).json({
      success: false,
      message: "User is already an affiliate.",
    });
  }

  // Generate a unique referral code for the user
  const referralCode = generateReferralCode();

  // Update user as an affiliate with the generated referral code
  await User.findByIdAndUpdate(userId, {
    isAffiliate: true,
    referralCode,
  });

  return res.status(200).json({
    success: true,
    message: "User joined the affiliate program successfully.",
    data: { referralCode },
  });
});

const Referral = require("../Models/referralModel");
const generateReferralCode = require("../Utils/referralCodeGenerator");

exports.generateReferralLink = catchAsync(async (req, res, next) => {
  const referrer = req.user._id; // Assuming the authenticated user is the referrer
  const { eventId, refereeId } = req.body; // You need to provide the event and referee IDs in the request body

  // Generate a unique referral code
  const referralCode = generateReferralCode();

  // Create a new referral entry
  const referral = await Referral.create({
    referrer,
    referee: refereeId,
    event: eventId,
    referralCode,
  });

  return res.json({
    success: true,
    status: 200,
    message: "Referral link generated successfully",
    data: { referral },
  });
});

exports.calculateCashback = catchAsync(async (req, res, next) => {
  const { referralCode } = req.body; // Referral code entered by the user during booking

  // Find the referral entry using the referral code
  const referral = await Referral.findOne({ referralCode }).populate("event");

  if (!referral) {
    return res.status(404).json({
      success: false,
      status: 404,
      message: "Referral not found",
      data: {},
    });
  }

  // Calculate cashback (5% of the event price)
  const cashbackAmount = 0.05 * referral.event.price;

  // Update the referral entry with the cashback amount
  await Referral.findByIdAndUpdate(referral._id, { cashbackAmount });

  return res.json({
    success: true,
    status: 200,
    message: "Cashback calculated and updated successfully",
    data: { cashbackAmount },
  });
});
