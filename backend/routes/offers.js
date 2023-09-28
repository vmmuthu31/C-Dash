const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const { getUserOffers } = require("../controllers/offerController");

// Fetch user's offers
router.get("/myoffers", verifyToken, getUserOffers);

module.exports = router;
