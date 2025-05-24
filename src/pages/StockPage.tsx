import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { StockChart } from '../components/StockChart';
import { fetchStockPrices } from '../services/api';
import { StockPrice } from '../types/stock';
import { calculateAverage, calculateStandardDeviation, calculateCorrelation } from '../utils/stockUtils';

const TIME_RANGES = [
  { label: '5 minutes', value: 5 },
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '4 hours', value: 240 },
  { label: '1 day', value: 1440 },
];

export const StockPage: React.FC = () => {
  const { ticker } = useParams<{ ticker: string }>();
  const [timeRange, setTimeRange] = useState<number>(30);
  const [stockData, setStockData] = useState<StockPrice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const loadStockData = async () => {
      if (!ticker) return;
      
      console.log('Loading stock data for:', { ticker, timeRange });
      
      if (isMounted) {
        setLoading(true);
        setError(null);
      }
      
      try {
        const data = await fetchStockPrices(ticker, timeRange);
        console.log('Received stock data:', { ticker, dataCount: data.length });
        
        if (isMounted) {
          if (data.length > 0) {
            setStockData(data);
          } else {
            console.warn('No data returned from API, showing empty state');
            setError('No data available for the selected time range.');
          }
        }
      } catch (err) {
        console.error('Error in loadStockData:', err);
        if (isMounted) {
          setError('Failed to load stock data. Using mock data instead.');
          // Generate and set mock data
          const mockData = [];
          const now = new Date();
          for (let i = 0; i < 30; i++) {
            mockData.push({
              ticker: ticker || 'AAPL',
              price: 100 + Math.random() * 50, // Random price between 100-150
              timestamp: new Date(now.getTime() - (30 - i) * 60000).toISOString()
            });
          }
          setStockData(mockData);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadStockData();

    // Set up polling every 30 seconds
    const intervalId = setInterval(loadStockData, 30000);
    
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [ticker, timeRange]);

  const handleTimeRangeChange = (event: SelectChangeEvent<number>) => {
    setTimeRange(Number(event.target.value));
  };

  if (!ticker) {
    return <Typography>No stock selected</Typography>;
  }

  if (loading && stockData.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">{error}</Typography>
        {stockData.length > 0 && (
          <Typography variant="body2" color="textSecondary" mt={2}>
            Showing mock data for demonstration purposes.
          </Typography>
        )}
      </Box>
    );
  }

  const currentPrice = stockData[0]?.price || 0;
  const previousPrice = stockData[1]?.price || currentPrice;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = (priceChange / previousPrice) * 100;
  
  const prices = stockData.map(item => item.price);
  const averagePrice = calculateAverage(prices);
  const standardDeviation = calculateStandardDeviation(prices);
  
  // Calculate price changes for correlation
  const priceChanges: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    priceChanges.push(prices[i] - prices[i - 1]);
  }
  
  // Calculate correlation with previous period (1-lag correlation)
  let correlation = 0;
  if (priceChanges.length > 1) {
    const currentChanges = priceChanges.slice(0, -1);
    const nextChanges = priceChanges.slice(1);
    correlation = calculateCorrelation(currentChanges, nextChanges);
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1">
            {ticker}
          </Typography>
          <Box display="flex" alignItems="center" mt={1}>
            <Typography variant="h4" component="span" fontWeight="bold" mr={2}>
              ${currentPrice.toFixed(2)}
            </Typography>
            <Typography 
              variant="body1" 
              color={priceChange >= 0 ? 'success.main' : 'error.main'}
              fontWeight="bold"
            >
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} 
              ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
            </Typography>
          </Box>
        </Box>
        
        <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="time-range-label">Time Range</InputLabel>
          <Select
            labelId="time-range-label"
            value={timeRange}
            onChange={handleTimeRangeChange}
            label="Time Range"
          >
            {TIME_RANGES.map((range) => (
              <MenuItem key={range.value} value={range.value}>
                {range.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, width: '100%' }}>
        <Box sx={{ flex: '2', minWidth: '300px' }}>
          <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
            <StockChart data={stockData} ticker={ticker} timeRange={timeRange} />
          </Paper>
        </Box>
        
        <Box sx={{ flex: '1', minWidth: '300px' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Current Price
                  </Typography>
                  <Typography variant="h5">
                    ${currentPrice.toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            
            <Box>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Average Price ({TIME_RANGES.find(r => r.value === timeRange)?.label})
                  </Typography>
                  <Typography variant="h5">
                    ${averagePrice.toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            
            <Box>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Standard Deviation
                  </Typography>
                  <Typography variant="h5">
                    ${standardDeviation.toFixed(2)}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {standardDeviation > 0 
                      ? `$${standardDeviation.toFixed(2)} from mean`
                      : 'Insufficient data'}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            
            <Box>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Price Autocorrelation (1-lag)
                  </Typography>
                  <Typography variant="h5">
                    {correlation.toFixed(4)}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {correlation > 0.3 
                      ? 'Positive correlation with previous period'
                      : correlation < -0.3 
                        ? 'Negative correlation with previous period'
                        : 'Little to no correlation with previous period'}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            
            <Box>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Price Change (24h)
                  </Typography>
                  <Typography 
                    variant="h5" 
                    color={priceChange >= 0 ? 'success.main' : 'error.main'}
                  >
                    {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} 
                    ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            
            <Box>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Data Points
                  </Typography>
                  <Typography variant="h5">
                    {stockData.length}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {TIME_RANGES.find(r => r.value === timeRange)?.label} period
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
