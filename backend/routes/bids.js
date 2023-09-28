const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const { getUserBids } = require("../controllers/bidController");

// Fetch user's bids
router.get("/mybids", verifyToken, getUserBids);

module.exports = router;
