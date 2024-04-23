const loginChecks = (user) => {
  // console.log("ROLE:", currentrole, "USER:", user);
  if (!user.verified) {
    return "email-unverified";
  } else if (!user.firstName || lastName) {
    return "account-setup-pending";
  } else if (!user.businessName) {
    return "Business-profile-setup-pending";
  } else {
    return "login-granted";
  }
};

module.exports = {
  loginChecks,
};
