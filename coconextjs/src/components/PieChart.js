import React from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const PieChart = ({ data, labels, title, color = [] }) => {
  const getRandomColor = () => {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const colorsArray = color.length
    ? color
    : Array(data.length)
        .fill()
        .map(() => getRandomColor());

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: title || "# of Items",
        data: data,
        backgroundColor: colorsArray,
        borderColor: colorsArray,
        borderWidth: 1,
      },
    ],
  };

  return (
    <div style={{ maxWidth: "400px", margin: "0 auto", padding: "10px" }}>
      <Pie data={chartData} />
    </div>
  );
};

export default PieChart;
