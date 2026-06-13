function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: "Route not found.",
  });
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const status = Number(error.statusCode || error.status || 500);
  const safeStatus = status >= 400 && status < 600 ? status : 500;
  const isServerError = safeStatus >= 500;

  if (isServerError) {
    console.error(error);
  }

  return res.status(safeStatus).json({
    success: false,
    message: isServerError
      ? "Something went wrong. Please try again later."
      : error.message,
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
