// routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { verifyToken } = require("../middleware/auth");
const app = express();

app.use(express.json());
const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const existingUser = await User.findOne({ email }).exec();
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "A user with the same email already exists." });
    }
    const user = new User({
      email,
      password: hashedPassword,
      createdAt: new Date(),
      lastLogin: null,
    });

    await user.save();

    res.status(201).json({ message: "User created successfully", user });
  } catch (err) {
    if (err.code === 11000 && err.keyPattern && err.keyPattern.email) {
      // Duplicate email error
      return res
        .status(409)
        .json({ message: "A user with the same email already exists." });
    }
    // Handle other errors
    res
      .status(500)
      .json({ message: "Error creating user", error: err.message });
  }
});
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email id or password" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email id or password" });
    }
    const token = jwt.sign({ userId: user._id }, "carbonrelay", {
      expiresIn: "1h",
    });
    user.lastLogin = new Date();
    await user.save();
    res.status(200).json({ token, user });
  } catch (err) {
    res.status(500).json({ message: "Error during login", error: err.message });
  }
});

router.post("/createOffer", verifyToken, async (req, res) => {
  try {
    const { projectId, period, offerRate, biddingRate } = req.body;
    const user = await User.findById(req.userId);
    if (!user || !(user.role === "user" || user.role === "company")) {
      return res.status(403).json({ message: "Unauthorized to create offers" });
    }
    let projectName;
    if (user.role === "company") {
      projectName = user.companyName;
    } else {
      projectName = "Individual Offer";
    }
    const offer = {
      status: "created",
      projectId,
      projectName,
      period,
      offerRate,
      biddingRate,
      createdAt: new Date(),
    };
    user.offers.push(offer);
    await user.save();
    res.status(201).json({ message: "Offer created successfully", offer });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error creating offer", error: err.message });
  }
});

router.get("/protected", (req, res) => {
  const token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  jwt.verify(token, "carbonrelay", (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }
    res.json({ message: "Protected route accessed successfully" });
  });
});

const {
  getUserProfile,
  updateUserProfile,
} = require("../controllers/userController");

router.get("/profile", verifyToken, getUserProfile);

router.put("/profile", verifyToken, updateUserProfile);

module.exports = router;
