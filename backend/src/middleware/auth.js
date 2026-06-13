const jwt = require("jsonwebtoken");
const { env } = require("../config/env");
const authService = require("../modules/auth/auth.service");

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const payload = jwt.verify(token, env.jwt.secret);
    const user = await authService.findUserById(payload.sub);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    req.user = user;
    return next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }
}

module.exports = {
  requireAuth,
};
