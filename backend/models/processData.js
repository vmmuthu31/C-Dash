const xlsx = require("xlsx");
const Data = require("./datamodel");

const parseData = (inputStr) => {
  if (typeof inputStr !== "string") {
    console.error("Invalid input string:", inputStr);
    return null;
  }

  const datasets = inputStr
    .split(", ")
    .map((dataset) => {
      const [idStr, data] = dataset.split(":");
      const id = idStr ? parseInt(idStr.trim()) : null;
      if (!data) {
        console.error("Data is missing for ID:", idStr);
        return null;
      }
      const [currentValueStr, yearlyValuesStr] = data.split("(");
      const currentValue = currentValueStr
        ? parseFloat(currentValueStr.trim())
        : null;

      if (!yearlyValuesStr) {
        console.error("Yearly values are missing for ID:", idStr);
        return null;
      }

      const yearlyValuesArr = yearlyValuesStr
        .slice(0)
        .split(", ")
        .map((yearlyValueStr) => {
          const [yearStr, valueStr] = yearlyValueStr.split(":");
          return {
            year: yearStr ? parseInt(yearStr.trim()) : null,
            value: currentValue,
          };
        })
        .filter((y) => y !== null);

      return id && currentValue
        ? {
            id: id,
            currentValue: currentValue,
            yearlyValues: yearlyValuesArr,
          }
        : null;
    })
    .filter((d) => d !== null);

  return datasets.length > 0 ? datasets : null;
};
async function processData(buffer) {
  const workbook = xlsx.read(buffer, { type: "buffer" });
  const worksheet = workbook.Sheets["Sheet1"];
  const data = xlsx.utils.sheet_to_json(worksheet);
  const years = [
    2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012,
    2011, 2010, 2009,
  ];

  for (const row of data) {
    const yearlyDataArray = []; // Initialize an empty array for yearlyData

    for (const year of years) {
      const parsedYearData = parseData(row[year.toString()]);
      if (parsedYearData) {
        yearlyDataArray.push({ year, data: parsedYearData });
      } else {
        yearlyDataArray.push({ year, data: "empty" });
      }
    }

    const dataEntry = {
      cleanBeneficiary: row["Clean Beneficiary"],
      retirementBeneficiary: row["Retirement Beneficiary"],
      netRetirement: parseFloat(row["Net Retirement"]),
      others: parseFloat(row["Others"]),
      numberOfRetirements: parseInt(row["Number of Retirements"]),
      netRetirementDistributionbyid:
        row["Net Retirement Distribution (Project ID)"],
      retirementdistributionbycountry: row["Retirement Distribution (Country)"],
      distribution: row["Distribution (Project Type)"],
      netRetirementDistributionbymethodology:
        row["Net Retirement Distribution (Methodology)"],
      retirementdetails: row["Retirement Details"],
      yearlyData: yearlyDataArray, // yearlyData here is now an array
    };

    try {
      const newData = new Data(dataEntry);
      await newData.save();
      console.log("Data inserted successfully.");
    } catch (error) {
      console.error("Error inserting data:", error);
    }
  }
}

module.exports = processData;
