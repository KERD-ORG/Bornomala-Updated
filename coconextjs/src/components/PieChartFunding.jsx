import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const PieChartFunding = ({ pending , approved , rejected }) => {
  const data = {
    labels: ['Pending', 'Approved' , 'Rejected'], 
    datasets: [
      {
        label: 'Funding',
        data: [pending , approved , rejected],
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

export default PieChartFunding;
