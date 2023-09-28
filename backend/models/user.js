const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { UserCounter, CompanyCounter } = require("./counter");

const userSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  email: { type: String, unique: true },
  password: String,
  isGoogleAccount: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date },
  companyName: {
    type: String,
    validate: {
      validator: function (value) {
        if (this.role === "company") {
          return value && value.trim().length > 0;
        }
        return true;
      },
      message: "Company name is required for company role.",
    },
  },
  offers: [
    {
      status: {
        type: String,
        enum: ["created", "accepted", "rejected"],
        default: "created",
      },
      projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        required: true,
      },
      projectName: { type: String, required: true },
      period: { type: String, required: true },
      offerRate: { type: Number, required: true },
      biddingRate: { type: Number, required: true },
      createdAt: { type: Date, default: Date.now },
      bids: [
        {
          bidCreator: { type: String, required: true },
          bidRate: { type: Number, required: true },
          comments: { type: String, required: true },
          status: { type: String, required: true },
          createdAt: { type: Date, default: Date.now },
        },
      ],
    },
  ],
});

// Pre-save middleware to generate the 'id' field based on the counter collection
userSchema.pre("save", async function (next) {
  try {
    if (!this.id) {
      let counter;
      if (this.isCompany) {
        counter = await CompanyCounter.findByIdAndUpdate(
          { _id: "companySeq" },
          { $inc: { seq: 1 } },
          { new: true, upsert: true }
        );
      } else {
        counter = await UserCounter.findByIdAndUpdate(
          { _id: "userSeq" },
          { $inc: { seq: 1 } },
          { new: true, upsert: true }
        );
      }

      this.id = counter.seq;
    }

    next();
  } catch (err) {
    next(err);
  }
});

const User = mongoose.model("User", userSchema);

module.exports = User;
