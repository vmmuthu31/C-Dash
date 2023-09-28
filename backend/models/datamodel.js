const mongoose = require("mongoose");
const { Schema } = mongoose;

const YearlyDataSchema = new Schema({
  year: Number,
  data: Schema.Types.Mixed,
});

const dataSchema = new mongoose.Schema({
  cleanBeneficiary: String,
  retirementBeneficiary: String,
  netRetirement: Number,
  others: Number,
  numberOfRetirements: Number,
  netRetirementDistributionbyid: String,
  retirementdistributionbycountry: String,
  distribution: String,
  netRetirementDistributionbymethodology: String,
  retirementdetails: String,
  yearlyData: [YearlyDataSchema],
});

const Data = mongoose.model("Data", dataSchema);

module.exports = Data;
