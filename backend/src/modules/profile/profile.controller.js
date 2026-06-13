const authService = require("../auth/auth.service");

async function getMe(req, res) {
  res.json({
    success: true,
    user: req.user,
  });
}

async function updateMe(req, res, next) {
  try {
    const user = await authService.updateUserProfile(req.user.id, req.body || {});
    res.json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMe,
  updateMe,
};
