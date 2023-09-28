// routes/placeBid.js
const express = require("express");
const router = express.Router();

// Import the controller or handler function for placing a bid
const { placeBid } = require("../controllers/bidController");
const { verifyToken } = require("../middleware/auth");
// Define the route for placing a bid with the offerId parameter
router.post("/:offerId", verifyToken, placeBid);

module.exports = router;
