const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Allow requests from the specified frontend origin
app.use(cors());

// Connect to MongoDB database
const dbURI =
  "mongodb+srv://admin:admin@cluster0.rxnpu.mongodb.net/carbon-relay";
mongoose
  .connect(dbURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err.message);
  });

// Parse incoming JSON data
app.use(express.json());

// Import and use authentication routes
const authRoutes = require("./routes/auth");
app.use("/auth", authRoutes);

// Import and use placeBid route
const placeBidRoute = require("./routes/placeBid");
app.use("/placebid", placeBidRoute);

// Import and use data routes
const dataRoutes = require("./routes/data");
app.use("/DataRoute", dataRoutes);

// Import and use offer and bid routes
const offerRoutes = require("./routes/offers");
const bidRoutes = require("./routes/bids");
app.use("/offers", offerRoutes);
app.use("/bids", bidRoutes);

// Respond to root path
app.get("/", (req, res) => {
  res.json({
    message: "🦄🌈✨👋🌎🌍🌏✨🌈🦄",
  });
});

// Start the server
const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
