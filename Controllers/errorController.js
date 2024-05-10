const CustomError = require("./../Utils/appError");

const handleCastError = (err) => {
  const message = `Invalid ${err.path} : ${err.value}`;
  return new CustomError(message, 400);
};

const tokenExpiredError = (err) => {
  return new CustomError("Your jwt token has expired please login again", 400);
};

const jsonWebTokenError = (err) => {
  return new CustomError("Invalid Token. Please login again!!", 401);
};

const duplicateKeyError = (err) => {
  const value = err.message.match(/(["'])(\\?.)*?\1/)[0];
  console.log(value);

  return new CustomError(
    `Dublicate Field Value: ${value}. Please use a different value`,
    400
  );
};

const validationError = (err) => {
  const errors = Object.values(err.errors).map((value) => value.message);
  const errorMsgs = errors.join(". ");
  const msg = `Invalid input data: ${errorMsgs}`;

  // console.log(errors);
  // console.log(msg);
  return new CustomError(msg, 400);
};

const devErrors = (res, error) => {
  res.status(error.statusCode).json({
    status: error.statusCode,
    success: error.status,
    message: error.message,
    stackTrace: error.stack,
    error: error,
  });
};

const prodErrors = (res, error) => {
  if (error.isOperational) {
    res.status(error.statusCode).json({
      status: error.statusCode,
      success: error.status,
      message: error.message,
    });
  } else {
    res.status(500).json({
      status: "fail",
      message: "Something went wrong please try again",
    });
  }
};

module.exports = (error, req, res, next) => {
  error.statusCode = error.statusCode || 500;
  error.message = error.message || "Internal Server Error";
  error.status = error.status || "error";
  console.error("Incoming Error:", error);

  if (process.env.NODE_ENV === "development") {
    devErrors(res, error);
  } else if (process.env.NODE_ENV === "production") {
    if (error.name === "TokenExpiredError") {
      error = tokenExpiredError(error);
    }
    if (error.name === "JsonWebTokenError") {
      error = jsonWebTokenError(error);
    }
    if (error.code === 11000) {
      error = duplicateKeyError(error);
    }
    if (error.name === "ValidationError") {
      error = validationError(error);
    }
    if (error.name === "CastError") {
      error = handleCastError(error);
    }
    prodErrors(res, error);
  }
};
