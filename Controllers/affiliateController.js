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

exports.shareEvent = catchAsync(async (req, res, next) => {
  const user = req.user;

  const eventId = req.params.eventId;

  if (!eventId) {
    return res.status(400).json({
      success: false,
      status: 400,
      message: "Event ID is required",
    });
  }

  try {
    const event = await Event.findById(eventId);

    if (!event) {
      return res
        .status(404)
        .json({ success: false, status: 404, message: "Event not found" });
    }

    const shareableLink = `${req.protocol}://${req.get(
      "host"
    )}/shared-event/${eventId}?referrer=${user._id}`;

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

///// Function to calculate and update cashback for the referral
exports.calculateAndUpdateCashback = catchAsync(async (eventId, referrerId) => {
  try {
    const event = await Event.findById(eventId);
    const cashbackAmount = event.price * 0.05; // 5% cashback

    // Update cashback for the referrer
    await User.findByIdAndUpdate(referrerId, {
      $inc: { walletBalance: cashbackAmount },
    });

    // Save the cashback information in the Referral model
    // await Referral.create({
    //   referrer: referrerId,
    //   event: eventId,
    //   walletBalance,
    // });
  } catch (error) {
    console.error("Error calculating and updating cashback:", error);
  }
});

//////// handle event booking with referral link

exports.bookEvent = catchAsync(async (req, res, next) => {
  //// 1. get event id and user referral code
  const { eventId, userId } = req.body;
  const CashUpdate = this.calculateAndUpdateCashback;
  // Check if the user is a PRuser
  const user = await User.findById(userId);
  if (user.isPRUser === true) {
    return res.status(400).json({
      success: false,
      status: 400,
      message: "PRusers are not allowed to book events.",
    });
  }

  // Check if the referral code is valid
  if (user.referralCode) {
    const referrer = await User.findOne({ referralCode: user.referralCode });
    console.log(referrer);
    if (referrer) {
      CashUpdate(eventId, referrer._id);
      //// Proceed with the Stripe payment
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 1000, // Set your desired amount in cents (e.g., 10 USD)
        currency: "usd",
        description: "Event Booking",
        payment_method: req.body.payment_method,
        confirm: true,
        return_url: "http://127.0.0.1:3000/api/v1/user/requestAprroved",
      });

      // Add your event booking logic here
      return res.status(200).json({
        success: true,
        status: 200,
        message: "Event booked successfully.",
        data: { user, paymentIntent },
      });
    }
  }

  // const paymentIntent = await stripe.paymentIntents.create({
  //   amount: 1000, // Set your desired amount in cents (e.g., 10 USD)
  //   currency: "usd",
  //   description: "Event Booking",
  //   payment_method: req.body.payment_method,
  //   confirm: true,
  // });

  return res.status(200).json({
    success: true,
    status: 200,
    message: "Event booked successfully for non Affiliates.",
    data: { user },
  });
});
