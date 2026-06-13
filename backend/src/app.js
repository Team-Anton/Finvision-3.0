const express = require("express");
const cors = require("cors");
const { env } = require("./config/env");
const authRoutes = require("./modules/auth/auth.routes");
const profileRoutes = require("./modules/profile/profile.routes");
const {
  errorHandler,
  notFoundHandler,
} = require("./middleware/errorHandler");

function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.frontendOrigins,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (req, res) => {
    res.json({
      success: true,
      message: "FineVision backend is running",
    });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/profile", profileRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
