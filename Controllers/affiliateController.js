const catchAsync = require("../Utils/catchAsync");
const User = require("../Models/userModel");
const Event = require("../Models/eventModel");
const AdminNotificationService = require("../Utils/adminNotificationService");
const EmailtoUser = require("../Utils/mailSend");
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
    await EmailtoUser.mailSend(user);
  } catch (error) {
    console.error("Error Sending Email to User:", error);
  }

  if (user.isAffiliate === true) {
    const referralCode = generateReferralCode();

    // Assuming you want to update the user's referral code field
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

// exports.requestApproved = catchAsync(async (req, res, next) => {
//   const user = req.user;
//   user.isAffiliate = req.body.isAffiliate;
//   // const userId = req.user._id;

//   await user.save();
//   try {
//     await EmailtoUser.mailSend(user);
//   } catch (error) {
//     console.error("Error Sending Email to User:", error);
//   }

//   if (user.isAffiliate === true) {
//     const referralCode = CodeGenerator.generateReferralCode();
//     await User.findByIdAndUpdate(user._id, referralCode);
//     return res.status(200).json({
//       success: true,
//       status: 200,
//       message: "Affiliate user request approved.",
//       data: { user },
//     });
//   } else if (user.isAffiliate === false) {
//     return res.status(400).json({
//       success: false,
//       status: 400,
//       message: "Affiliate user request rejected",
//       data: { user },
//     });
//   }
// });

// //// Share Event
// exports.shareEvent = catchAsync(async (req, res, next) => {
//   // Get current user
//   const user = req.user;
//   const Event = req.eventId;

//   // Check if the user is an affiliate
//   let referralCode = null;
//   if (user.isAffiliate) {
//     // If the user is an affiliate, get their referral code
//     referralCode = user.referralCode;
//   }

//   // Assuming eventId is present in the request parameters (e.g., /share-event/:eventId)
//   const eventId = req.Event.eventId;

//   // Check if eventId is provided in the request parameters
//   if (!eventId) {
//     return res.status(400).json({
//       success: false,
//       message: "Event ID is required",
//     });
//   }

//   try {
//     // Fetch event details from the database
//     const event = await Event.findById(eventId);

//     if (!event) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Event not found" });
//     }

//     // Return user details, event ID, and referral code (if applicable)
//     return res.json({
//       success: true,
//       data: {
//         user: {
//           userId: user._id,
//           name: user.name,
//           email: user.email,
//           // Add other user details as needed
//         },
//         event: {
//           eventId: event._id,
//           eventName: event.name,
//           // Add other event details as needed
//         },
//         referralCode: referralCode, // Will be null for non-affiliate users
//       },
//     });
//   } catch (error) {
//     console.error(error);
//     return res
//       .status(500)
//       .json({ success: false, message: "Internal server error" });
//   }
// });

exports.shareEvent = catchAsync(async (req, res, next) => {
  // Get current user
  const user = req.user;

  const eventId = req.params.eventId;

  // Check if eventId is provided in the request parameters
  if (!eventId) {
    return res.status(400).json({
      success: false,
      message: "Event ID is required",
    });
  }

  try {
    // Fetch event details from the database
    const event = await Event.findById(eventId);

    if (!event) {
      return res
        .status(404)
        .json({ success: false, status: 404, message: "Event not found" });
    }

    // Generate a unique shareable link with appropriate encoding
    const shareableLink = `${req.protocol}://${req.get(
      "host"
    )}/shared-event/${eventId}?referrer=${user._id}`;

    // Return user details, event ID, and shareable link
    return res.status(200).json({
      success: true,
      status: 200,
      data: {
        user: {
          userId: user._id,
          referralCode: user.referralCode,
        },
        event: {
          eventId: event._id,
        },
        shareableLink: shareableLink,
      },
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

// Function to calculate and update cashback for the referral
exports.calculateAndUpdateCashback = catchAsync(async (eventId, referrerId) => {
  try {
    const event = await Event.findById(eventId);
    const cashbackAmount = event.price * 0.05; // 5% cashback

    // Update cashback for the referrer
    await User.findByIdAndUpdate(referrerId, {
      $inc: { walletBalance: cashbackAmount },
    });

    // Save the cashback information in the Referral model
    await Referral.create({
      referrer: referrerId,
      event: eventId,
      walletBalance,
    });
  } catch (error) {
    console.error("Error calculating and updating cashback:", error);
  }
});
// // handle event booking with referral link

// exports.bookEvents = catchAsync(async (req, res, next) => {
//   //// 1. get event id and user referral code
//   const { eventId, userId } = req.body;

//   // Check if the user is a PRuser
//   const user = await User.findById(userId);
//   if (user.userType === "PRuser") {
//     return res.status(400).json({
//       success: false,
//       message: "PRusers are not allowed to book events.",
//     });
//   }

//   // Check if the referral code is valid
//   if (user.referralCode) {
//     const referrer = await User.findOne({ referralCode: user.referralCode });
//     if (referrer) {
//       await calculateAndUpdateCashback(eventId, referrer._id);
//       // Add your event booking logic here
//       return res.status(200).json({
//         success: true,
//         status: 200,
//         message: "Event booked successfully with referral.",
//         data: {},
//       });
//     }
//   }

//   // If no referral code or invalid referral code, proceed with the event booking
//   // Add your event booking logic here

//   return res.status(200).json({
//     success: true,
//     status: 200,
//     message: "Event booked successfully.",
//     data: {},
//   });
// });

exports.bookEvent = catchAsync(async (req, res, next) => {
  //// 1. get event id and user referral code
  const { eventId, userId } = req.body;
  // Check if the user is a PRuser
  const user = await User.findById(userId);
  if (user.isPRUser === true) {
    return res.status(400).json({
      success: false,
      message: "PRusers are not allowed to book events.",
    });
  }

  // Check if the referral code is valid
  if (user.referralCode) {
    const referrer = await User.findOne({ referralCode: user.referralCode });
    console.log(referrer);
    if (referrer) {
      await calculateAndUpdateCashback(eventId, referrer._id);
      // Proceed with the Stripe payment
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 1000, // Set your desired amount in cents (e.g., 10 USD)
        currency: "usd",
        description: "Event Booking",
        payment_method: req.body.payment_method,
        confirm: true,
      });

      // Add your event booking logic here
      return res.status(200).json({
        success: true,
        status: 200,
        message: "Event booked successfully.",
        data: { paymentIntent },
      });
    }
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: 1000, // Set your desired amount in cents (e.g., 10 USD)
    currency: "usd",
    description: "Event Booking",
    payment_method: req.body.payment_method,
    confirm: true,
  });

  return res.status(200).json({
    success: true,
    status: 200,
    message: "Event booked successfully.",
    data: { paymentIntent },
  });
});
