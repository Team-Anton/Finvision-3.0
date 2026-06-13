const authService = require("./auth.service");

async function register(req, res, next) {
  try {
    const result = await authService.createUser(req.body || {});
    res.status(201).json({
      success: true,
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.loginUser(req.body || {});
    res.json({
      success: true,
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
};
