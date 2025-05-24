import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import { StockPrice } from '../types/stock';
import { calculateAverage } from '../utils/stockUtils';
import { Box, Typography, useTheme } from '@mui/material';

interface StockChartProps {
  data: StockPrice[];
  ticker: string;
  timeRange: number;
}

const formatXAxis = (tickItem: string) => {
  const date = new Date(tickItem);
  return date.toLocaleTimeString();
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const date = new Date(label);
    return (
      <Box sx={{ 
        backgroundColor: 'background.paper', 
        p: 1, 
        border: '1px solid #ccc',
        borderRadius: 1
      }}>
        <Typography variant="body2" color="text.secondary">
          {date.toLocaleString()}
        </Typography>
        <Typography variant="body2">
          Price: ${payload[0].value.toFixed(2)}
        </Typography>
      </Box>
    );
  }
  return null;
};

export const StockChart: React.FC<StockChartProps> = ({ data, ticker, timeRange }) => {
  const theme = useTheme();
  
  const chartData = useMemo(() => {
    return data.map(item => ({
      time: item.timestamp,
      price: item.price,
      date: new Date(item.timestamp).toLocaleTimeString(),
    }));
  }, [data]);

  const averagePrice = useMemo(() => {
    return calculateAverage(data.map(item => item.price));
  }, [data]);

  if (data.length === 0) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: 400,
        border: '1px solid #ddd',
        borderRadius: 1,
        p: 2
      }}>
        <Typography>No data available for this time range</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: 400, mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        {ticker} - Last {timeRange} minutes
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Average Price: ${averagePrice.toFixed(2)}
      </Typography>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis 
            dataKey="time" 
            tickFormatter={formatXAxis}
            tick={{ fill: theme.palette.text.secondary }}
          />
          <YAxis 
            domain={['auto', 'auto']}
            tick={{ fill: theme.palette.text.secondary }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <ReferenceLine 
            y={averagePrice} 
            label={`Avg $${averagePrice.toFixed(2)}`} 
            stroke={theme.palette.secondary.main}
            strokeDasharray="3 3"
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke={theme.palette.primary.main}
            activeDot={{ r: 8 }}
            name="Stock Price"
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};
