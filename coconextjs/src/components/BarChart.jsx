// src/BarChart.js
import React, { useState, useEffect } from "react";
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

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
);

const BarChart = ({ label, data, title = "", type = "" }) => {
  const Data = {
    labels: label,
    datasets: [
      {
        label: type,
        data,
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
        text: title,
        font: {
          size: 18,
          weight: "bold",
        },
        padding: {
          top: 10,
          bottom: 30,
        },
      },
    },
  };

  return <Bar className="p-3 w-100 h-100" data={Data} options={options} />;
};

export default BarChart;
