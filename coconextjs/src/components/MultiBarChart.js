import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function MultiBarChart({
  activityType = "default",
  data = [],
}) {
  const xAxisKey =
    activityType === "Monthly"
      ? "month"
      : activityType === "Yearly"
      ? "year"
      : activityType === "Everyday"
      ? "everyday"
      : "defaultKey";

  const dataKeys = Object.keys(data[0] || {});
  const barDataKeys = dataKeys.filter((key) => key !== xAxisKey);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        width={500}
        height={300}
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 0,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <YAxis />
        <XAxis
          dataKey={xAxisKey}
          label={{
            position: "insideBottom",
            offset: -5,
          }}
        />
        <Tooltip />
        <Legend />
        {barDataKeys.map((key, index) => (
          <Bar
            key={key}
            dataKey={key}
            fill={
              index % 2 === 0
                ? "#696cff"
                : index % 3 === 0
                ? "#82ca9d"
                : "#ffc658"
            }
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
