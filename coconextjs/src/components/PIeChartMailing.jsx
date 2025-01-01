import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const PieChartMailing = ({ Sent , Pending , Failed }) => {
  const data = {
    labels: ['Sent', 'Pending' , 'Failed'], 
    datasets: [
      {
        label: 'Funding',
        data: [Sent , Pending , Failed],
        backgroundColor: ['#36a2eb','#4bc0c0' , '#ff6384'],
        borderColor: ['#36a2eb', '#ff6384'],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div style={{ maxWidth: '400px' }}>
      <Pie  data={data} />
    </div>
  );
};

export default PieChartMailing;
