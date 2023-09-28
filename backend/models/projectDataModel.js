const mongoose = require("mongoose");

const ProjectDataSchema = new mongoose.Schema({
  ID: Number,
  "Crediting Periods and Quantities": String,
  "Crediting Periods and Net Retirements": String,
  "Clean Beneficiaries with Retirement Numbers": String,
  "Number Retired": Number,
  "Clean Beneficiaries with Retirement Percentages": String,
  Name: String,
  Proponent: String,
  Methodology: String,
  "Country/Area": String,
  "Crediting Period Start Date": Date,
  "Crediting Period End Date": Date,
  "Project Type": String,
});

module.exports = mongoose.model("ProjectData", ProjectDataSchema);
