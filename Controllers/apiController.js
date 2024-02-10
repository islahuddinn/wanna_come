const axios = require("axios");
const catchAsync = require("../Utils/catchAsync");

// Example function to check if the PR code is valid
// const checkIfValidPRCode = (prCode) => {
//   // Implement your logic to check the validity of the PR code
//   // For example, you can check against a database of valid PR codes
//   return true; // Replace with your actual validation logic
// };

exports.fetchDataFromAPI = catchAsync(async (req, res, next) => {
  const { apiLink } = req.body;

  // Validate if the provided API link is a valid URL
  try {
    new URL(apiLink);
  } catch (error) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "Invalid API link",
      data: {},
    });
  }

  // Make an HTTP request to fetch data from the API
  try {
    const response = await axios.get(apiLink);
    const data = response.data;

    res.status(200).json({
      status: 200,
      success: true,
      message: "Data fetched successfully",
      data: { apiData: data },
    });
  } catch (error) {
    console.error("Error fetching data from API:", error.message);
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Internal server error",
      data: {},
    });
  }
});
