const express = require("express");
const { requireAuth } = require("../../middleware/auth");
const profileController = require("./profile.controller");

const router = express.Router();

router.get("/me", requireAuth, profileController.getMe);
router.put("/me", requireAuth, profileController.updateMe);

module.exports = router;
