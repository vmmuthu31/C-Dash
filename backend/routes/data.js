const express = require("express");
const router = express.Router();
const fileUpload = require("express-fileupload");
const XLSX = require("xlsx");

const processData = require("../models/processData");
const Data = require("../models/datamodel"); // Import your Data model
const ProjectData = require("../models/projectDataModel");

router.use(fileUpload());

// POST method to upload and process data
router.post("/upload", async (req, res) => {
  if (!req.files || !req.files.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  const file = req.files.file;

  try {
    await processData(file.data); // Pass the 'data' property of the file object
    res
      .status(200)
      .json({ message: "File uploaded and processed successfully." });
  } catch (error) {
    console.error("Error processing data:", error);
    res.status(500).json({ error: "Error processing data." });
  }
});

router.post("/uploadProjectData", async (req, res) => {
  if (!req.files || !req.files.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  const file = req.files.file;
  const workbook = XLSX.read(file.data, { type: "buffer" });
  const sheet_name_list = workbook.SheetNames;
  const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);

  // Preprocess date fields
  data.forEach((datum) => {
    ["Crediting Period Start Date", "Crediting Period End Date"].forEach(
      (key) => {
        if (typeof datum[key] === "string") {
          // Check if date is in the format "30-10-2013 00:00"
          const match = datum[key].match(/^(\d{1,2})-(\d{1,2})-(\d{4}) 00:00$/);
          if (match) {
            // Convert the string to "YYYY-MM-DD" format
            datum[key] = `${match[3]}-${match[2]}-${match[1]}`;
          }
        } else if (typeof datum[key] === "number") {
          // Convert Excel date format
          const excelEpoch = new Date(1899, 11, 31);
          const excelDate = new Date(
            excelEpoch.getTime() + datum[key] * 24 * 60 * 60 * 1000
          );
          datum[key] = excelDate.toISOString().split("T")[0];
        }
      }
    );
  });

  console.log(
    "Original dates:",
    data.map((d) => d["Crediting Period Start Date"])
  );

  try {
    await ProjectData.insertMany(data);
    res
      .status(200)
      .json({ message: "Project data uploaded and processed successfully." });
  } catch (error) {
    console.error("Error processing project data:", error);
    res.status(500).json({ error: "Error processing project data." });
  }
});

// GET method to fetch all data
router.get("/data", async (req, res) => {
  try {
    const allData = await Data.find(); // Fetch all data from the collection
    res.status(200).json(allData);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Error fetching data." });
  }
});

router.get("/projectData", async (req, res) => {
  try {
    const allProjectData = await ProjectData.find();
    res.status(200).json(allProjectData);
  } catch (error) {
    console.error("Error fetching project data:", error);
    res.status(500).json({ error: "Error fetching project data." });
  }
});

module.exports = router;
