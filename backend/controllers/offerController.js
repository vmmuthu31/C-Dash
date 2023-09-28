const User = require("../models/user");

// Fetch the offers created by the logged-in user
const getUserOffers = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId); // Assuming the project name is stored in the 'name' field of the 'Project' model.

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Extract the offers created by the user
    const userOffers = user.offers;

    res.status(200).json({ userOffers });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching user offers", error: err.message });
  }
};

module.exports = { getUserOffers };
