"use client";
import { Fragment } from "react";
import { Menu, Popover, Transition } from "@headlessui/react";
import { AiOutlineMenu, AiOutlineCloseCircle } from "react-icons/ai";
import { BiSearch } from "react-icons/bi";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";

import axios from "axios";
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });
import Link from "next/link";
import Navbar from "./Navbar";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

// Define any missing types
interface BeneficiaryData {
  cleanBeneficiary: string;
  netRetirement: number;
  numberOfRetirements: string;
  retirementdetails: string;
  netRetirementDistributionbyid: string;
  retirementdistributionbycountry: string;
  distribution: string;
  netRetirementDistributionbymethodology: string;
  yearlyData: YearlyData[];
}

interface YearlyData {
  year: string;
  data: DataEntry[];
}

interface DataEntry {
  currentValue: number;
  yearlyValues: YearlyValue[];
}

interface YearlyValue {
  year: string;
  value: number;
}

const Dashboard: React.FC = () => {
  const [data, setData] = useState<BeneficiaryData[]>([]);
  const [pieChartData, setPieChartData] = useState([]);
  const [NumberOfRetirements, setSelectednoofretirement] = useState<
    string | null
  >(null);
  const [retirementdetails, setSelectedRetirementDetails] = useState<
    string | null
  >(null);
  const [chartData, setChartData] = useState<any[] | null>(null);

  const searchParams = useSearchParams();
  const companyNameFromQuery = searchParams.get("companyName");

  useEffect(() => {
    if (companyNameFromQuery) {
      const selectedData = data.find(
        (b) => b.cleanBeneficiary === companyNameFromQuery
      );

      if (selectedData && selectedData.retirementdetails) {
        setSelectednoofretirement(selectedData.numberOfRetirements);
        setSelectedRetirementDetails(selectedData.retirementdetails);
        const pieData = [];

        // Function to safely push data into pieData
        const addPieData = (dataStr, title) => {
          // Parse the data string to extract labels and values
          const items = dataStr.split(", ");
          const labels = [];
          const values = [];
          items.forEach((item) => {
            const [label, value] = item.split(":");
            labels.push(label.trim());
            values.push(parseFloat(value.trim()));
          });

          // Determine hover template based on the title
          let hoverTemplate = "";
          switch (title) {
            case "Retirement Distribution (Project ID)":
            case "Retirement Distribution (Country)":
              hoverTemplate = "%{label}, %{percent}";
              break;
            case "Retirement Distribution <br> (Project Type)":
              hoverTemplate =
                "<br><br>" +
                "<span style='text-align: center; padding-top:50px; max-width: auto; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;'>%{label}</span>: %{percent:.2f}" + // Format as a number
                "<br><br><br>";

              break;

            case "Retirement Distribution <br> (Methodology)":
              hoverTemplate = "%{label}:%{percent}";
              break;
            default:
              hoverTemplate = "%{label}:%{percent}";
          }

          pieData.push({
            values,
            labels,
            name: "",
            vm: title,
            type: "pie",
            hoverinfo: "none",
            hovertemplate: hoverTemplate,
            textinfo: "percent",
            textposition: "inside",
          });
        };

        // Add Pie charts
        addPieData(
          selectedData.netRetirementDistributionbyid || "",
          "Retirement Distribution <br> (Project ID)"
        );
        addPieData(
          selectedData.retirementdistributionbycountry || "",
          "Retirement Distribution <br> (Country)"
        );
        addPieData(
          selectedData.distribution || "",
          "Retirement Distribution <br> (Project Type)"
        );
        addPieData(
          selectedData.netRetirementDistributionbymethodology || "",
          "Retirement Distribution <br> (Methodology)"
        );

        // Update pieChartData state
        setPieChartData(pieData);
      }
    }
  }, [companyNameFromQuery, data]);

  // Fetch the data only once when the component mounts
  useEffect(() => {
    axios
      .get<BeneficiaryData[]>(
        "https://carbon-relay-backend.vercel.app/DataRoute/data"
      )
      .then((response) => {
        setData(response.data);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }, []);
  console.log("company name", companyNameFromQuery);

  // Update chart data when the route or data changes
  useEffect(() => {
    if (companyNameFromQuery && data.length > 0) {
      const selectedData = data.find(
        (b) => b.cleanBeneficiary === companyNameFromQuery
      );
      if (selectedData) {
        setChartData(processDataForPlotlyChart(selectedData));
      }
    }
  }, [companyNameFromQuery, data]);

  console.log("chartdata", chartData);
  const processDataForPlotlyChart = (
    beneficiaryData: BeneficiaryData
  ): any[] => {
    const traces: any[] = [];

    // Net Retirement
    traces.push({
      x: ["Net Retirement"],
      y: [beneficiaryData.netRetirement],
      text: `${beneficiaryData.netRetirement}`,
      hoverinfo: "text",
      textposition: "inside",
      type: "bar",
      showlegend: false,
      marker: {
        color: "rgba(55, 128, 191, 0.7)",
      },
    });

    // Retirement by Year
    beneficiaryData.yearlyData.forEach((yearData) => {
      if (Array.isArray(yearData.data)) {
        traces.push({
          x: ["Retirement by Year"],
          y: [
            yearData.data.reduce((acc, entry) => acc + entry.currentValue, 0),
          ],
          name: yearData.year,
          text: yearData.year, // Add this
          hovertemplate: `${yearData.year}:${[
            yearData.data.reduce((acc, entry) => acc + entry.currentValue, 0),
          ]}<extra></extra>`,

          textposition: "inside", // And this
          type: "bar",
          showlegend: false,
        });
      }
    });

    // Retirement by ID
    const idDataPairs =
      beneficiaryData.netRetirementDistributionbyid.split(", ");
    idDataPairs.forEach((pair) => {
      const [id, value] = pair.split(":");
      traces.push({
        x: ["Retirement by ID"],
        y: [parseFloat(value)],
        text: id.trim(), // Add this
        textposition: "inside", // And this
        hovertemplate: `${id.trim()}:${[parseFloat(value)]}<extra></extra>`,
        name: id.trim(),
        type: "bar",
        showlegend: false,
      });
    });

    // Retirement by Vintage
    const retirementByVintage = {};
    beneficiaryData.yearlyData.forEach((yearData) => {
      if (yearData.data && Array.isArray(yearData.data)) {
        yearData.data.forEach((dataEntry) => {
          if (dataEntry.yearlyValues && Array.isArray(dataEntry.yearlyValues)) {
            dataEntry.yearlyValues.forEach((yValue) => {
              if (retirementByVintage[yValue.year]) {
                retirementByVintage[yValue.year] += yValue.value;
              } else {
                retirementByVintage[yValue.year] = yValue.value;
              }
            });
          }
        });
      }
    });
    for (const [year, value] of Object.entries(retirementByVintage)) {
      traces.push({
        x: ["Retirement by Vintage"],
        y: [value],
        text: [year], // Add this
        textposition: "inside", // And this
        hovertemplate: `Vintage ${[year]}:${[value]}<extra></extra>`,
        name: year,
        type: "bar",
        showlegend: false,
      });
    }

    return traces;
  };

  const layout = {
    barmode: "stack",
    title: "",
    hovermode: "closest",
    textinfo: "none",
    height: 420,
    width: 800,
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",

    hovertemplate: "<b>%{customdata}</b><extra></extra>",
    yaxis: { zeroline: false, title: "Net Retirement Amount" },
  };
  const config = {
    modeBarButtonsToRemove: [
      "pan2d",
      "zoomIn2d",
      "zoomOut2d",
      "autoScale2d",
      "resetScale2d",
      "hoverClosestCartesian",
      "hoverCompareCartesian",
      "toggleSpikelines",
    ],
  };
  return (
    <>
      <div className="min-h-full bg-white">
       <Navbar />
        <main className="pt-2 ">
          <div className="px-10 mx-auto    ">
            <h1 className="sr-only">Page title</h1>
            {/* Main 3 column grid */}
            <div className="grid grid-cols-1 gap-4 items-start  lg:grid-cols-3 lg:gap-2">
              {/* Left column */}
              <div className="grid grid-cols-1 gap-8 lg:col-span-2">
                <section aria-labelledby="section-1-title ">
                  <h2 className="sr-only" id="section-1-title">
                    Section title
                  </h2>
                  <div className="rounded-lg">
                    <div className="">
                      <div className="text-center">
                        <div>
                          <p>
                            <span className="font-semibold text-xl">
                              {" "}
                              Company Name:
                            </span>{" "}
                            {companyNameFromQuery}
                          </p>
                          <span className="flex  absolute mx-10 mt-[250px]">
                            {pieChartData &&
                              pieChartData.map((data, index) => (
                                <div
                                  className=""
                                  key={index}
                                  style={{
                                    width: "100%",
                                    marginRight: "20px",
                                    padding: "0",
                                  }}
                                >
                                  <Plot
                                    data={[data]}
                                    layout={{
                                      showlegend: false,
                                      textinfo: "none",
                                      hovermode: "text",
                                      height: 390,
                                      paper_bgcolor: "rgba(0,0,0,0)",
                                      plot_bgcolor: "rgba(0,0,0,0)",
                                      width: 200,
                                      autosize: false,
                                      annotations: [
                                        {
                                          x: 0,
                                          y: 0.1,
                                          text: data?.vm,
                                          showarrow: false,
                                          font: {
                                            size: 14,
                                            color: "black",
                                          },
                                        },
                                      ],
                                      margin: { l: 0, r: 0, b: 0, t: 0 }, 
                                      paper_bgcolor: "white",
                                    }}
                                  />
                                </div>
                              ))}
                          </span>
                          <div className="pt-10">
                          {chartData && (
                            <span
                              className="relative "
                              style={{ bottom: "85px", }}
                            >
                              <Plot
                                data={chartData}
                                config={config}
                                layout={layout}
                              />
                            </span>
                          )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Right column */}
              <div className="grid  grid-cols-1 gap-4">
                <section aria-labelledby="section-2-title">
                  <h2 className="sr-only" id="section-2-title">
                    Section title
                  </h2>
                  <div className="rounded-lg overflow-hidden shadow">
                    <div className="">
                      <div className="relative overflow-hidden shadow-md sm:rounded-lg">
                        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                              <th scope="col" className="px-6 py-3">
                                Name
                              </th>
                              <th scope="col" className="px-6 py-3">
                                Value
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                              <td>
                                <div className="pl-3">
                                  <div className="text-base font-semibold">
                                    Name
                                  </div>
                                </div>
                              </td>
                              <th
                                scope="row"
                                className="flex items-center px-6 py-4 text-gray-900 whitespace-nowrap dark:text-white"
                              >
                                <div className="pl-3">
                                  <div className="font-normal text-gray-500">
                                    {companyNameFromQuery}
                                  </div>
                                </div>
                              </th>
                            </tr>
                            <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                              <td>
                                <div className="pl-3">
                                  <div className="text-base font-semibold">
                                    Net Retirement
                                  </div>
                                </div>
                              </td>
                              <th
                                scope="row"
                                className="flex items-center px-6 py-4 text-gray-900 whitespace-nowrap dark:text-white"
                              >
                                <div className="pl-3">
                                  <div className="font-normal text-gray-500">
                                    {chartData ? chartData[0].y : "Loading..."}
                                  </div>
                                </div>
                              </th>
                            </tr>
                            <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                              <td>
                                <div className="pl-3">
                                  <div className="text-base font-semibold">
                                    Number of Retirement
                                  </div>
                                </div>
                              </td>
                              <th
                                scope="row"
                                className="flex items-center px-6 py-4 text-gray-900 whitespace-nowrap dark:text-white"
                              >
                                <div className="pl-3">
                                  <div className="font-normal text-gray-500">
                                    {NumberOfRetirements}
                                  </div>
                                </div>
                              </th>
                            </tr>
                            <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                              <td>
                                <div className="max-h-96">
                                  <div className="pl-3">
                                    <div className="text-base font-semibold">
                                      Retirement Details
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <th
                                className="block px-6 py-4 h-[450px] overflow-y-hidden text-gray-900 dark:text-white"
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.overflowY = "scroll")
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.overflowY = "hidden")
                                }
                              >
                                <div className="pl-3">
                                  <div className="font-normal text-gray-500">
                                    {retirementdetails}
                                  </div>
                                </div>
                              </th>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Dashboard;
