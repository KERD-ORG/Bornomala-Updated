// src/BarChart.js
import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { text } from "@fortawesome/fontawesome-svg-core";

ChartJS.register(BarElement, CategoryScale, LinearScale);

const BarChartFunding = ({
  FundingActivity,
  activityMonth,
  activityYear,
  activityStartYear,
  activityEndYear,
}) => {
  const [labels, setLabels] = useState([]);

  useEffect(() => {
    if (FundingActivity === "Monthly") {
      setLabels([
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ]);
    } else if (FundingActivity === "Yearly") {
      const years = [];
      for (let year = activityStartYear; year <= activityEndYear; year++) {
        years.push(year);
      }
      setLabels(years);
    }
  }, [
    FundingActivity,
    activityMonth,
    activityYear,
    activityStartYear,
    activityEndYear,
  ]);

  const data = {
    labels: labels,
    datasets: [
      {
        label: "Funding",
        data: Array.from({ length: labels.length }, () =>
          Math.floor(Math.random() * 100)
        ),
        backgroundColor: "#696cff",
        borderColor: "#696cff",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false, // Hides the legend
      },
      title: {
        display: true,
        text: "Funding Activity",
        font: {
          size: 18,
          textStyle: "bold",
        },
        padding: {
          top: 20,
          bottom: 30,
        },
      },
    },
  };

  return (
    <Bar className="ps-3 pb-3" data={data} options={options} height={200} />
  );
};

export default BarChartFunding;
