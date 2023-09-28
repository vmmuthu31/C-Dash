// controllers/bidController.js

const User = require("../models/user");

const placeBid = async (req, res) => {
  try {
    const { bidRate, comments, status } = req.body;
    const offerId = req.params.offerId;
    // Get the user from the token
    const user = await User.findById(req.userId);
    console.log(user);
    console.log(offerId);

    // Check if the user is allowed to place bids (individuals and companies can place bids)
    if (!user || !(user.role === "user" || user.role === "company")) {
      return res.status(403).json({ message: "Unauthorized to place bids" });
    }

    // Find the offer in the user's offers array based on the offerId
    const offer = user.offers.find((offer) => offer._id.toString() === offerId);
    console.log(offer);
    // Check if the offer exists and is in a valid status for bidding
    if (!offer || offer.status !== "created") {
      return res.status(400).json({ message: "Invalid offer for bidding" });
    }

    // Determine the bid creator (user or company) and set the bidCreator field accordingly
    const bidCreator =
      user.role === "company" ? user.companyName : user.username;

    // Create the bid object
    const bid = {
      bidCreator,
      bidRate,
      comments,
      status,
      createdAt: new Date(),
    };

    // Add the bid to the offer's bids array
    console.log(bid);
    offer.bids.push(bid);
    await user.save();

    res.status(201).json({ message: "Bid placed successfully", bid });
  } catch (err) {
    res.status(500).json({ message: "Error placing bid", error: err.message });
  }
};

const getUserBids = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).populate(
      "offers.bids",
      "bidRate comments status createdAt"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Extract the bids placed by the user from their offers
    const userBids = user.offers.flatMap((offer) => offer.bids);

    res.status(200).json({ userBids });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching user bids", error: err.message });
  }
};

module.exports = { placeBid, getUserBids };
