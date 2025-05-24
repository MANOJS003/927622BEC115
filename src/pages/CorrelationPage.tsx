import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Paper,
  Grid,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Snackbar,
  Alert,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { CorrelationHeatmap } from '../components/CorrelationHeatmap';
import { fetchAllStocks } from '../services/api';
import { StockPrice } from '../types/stock';

const DEFAULT_TICKERS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META'];
const TIME_RANGES = [
  { label: '1 hour', value: 60 },
  { label: '4 hours', value: 240 },
  { label: '1 day', value: 1440 },
  { label: '1 week', value: 10080 },
];

export const CorrelationPage: React.FC = () => {
  const [tickers, setTickers] = useState<string[]>(DEFAULT_TICKERS);
  const [newTicker, setNewTicker] = useState<string>('');
  const [timeRange, setTimeRange] = useState<number>(60);
  const [stockData, setStockData] = useState<Record<string, StockPrice[]>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' | 'info' }>({ 
    open: false, 
    message: '', 
    severity: 'success' 
  });

  const loadStockData = useCallback(async () => {
    if (tickers.length === 0) {
      setStockData({});
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchAllStocks(tickers, timeRange);
      
      // Filter out tickers that have no data
      const validTickers = Object.entries(data)
        .filter(([_, prices]) => prices.length > 0)
        .map(([ticker]) => ticker);
      
      // If some tickers had no data, update the tickers list
      if (validTickers.length !== tickers.length) {
        setTickers(validTickers);
        if (validTickers.length === 0) {
          setError('No data available for the selected tickers.');
        } else if (validTickers.length < tickers.length) {
          setSnackbar({
            open: true,
            message: `No data available for some tickers. Showing data for: ${validTickers.join(', ')}`,
            severity: 'warning'
          });
        }
      }
      
      setStockData(data);
    } catch (err) {
      console.error('Error fetching stock data:', err);
      setError('Failed to load stock data. Please try again later.');
      setSnackbar({
        open: true,
        message: 'Failed to load stock data. Please try again later.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [tickers, timeRange]);

  useEffect(() => {
    loadStockData();

    // Set up polling every 5 minutes
    const intervalId = setInterval(loadStockData, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [loadStockData]);

  const handleTimeRangeChange = (event: SelectChangeEvent<number>) => {
    setTimeRange(Number(event.target.value));
  };

  const handleAddTicker = () => {
    if (newTicker.trim() === '') return;
    
    const ticker = newTicker.trim().toUpperCase();
    
    if (tickers.includes(ticker)) {
      setSnackbar({
        open: true,
        message: `Ticker ${ticker} is already in the list.`,
        severity: 'warning'
      });
      return;
    }
    
    setTickers([...tickers, ticker]);
    setNewTicker('');
  };

  const handleRemoveTicker = (tickerToRemove: string) => {
    if (tickers.length <= 1) {
      setSnackbar({
        open: true,
        message: 'You need at least one ticker.',
        severity: 'warning'
      });
      return;
    }
    
    setTickers(tickers.filter(ticker => ticker !== tickerToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      handleAddTicker();
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Box p={3}>
      <Box mb={3}>
        <Typography variant="h4" gutterBottom>
          Stock Correlation Heatmap
        </Typography>
        
        <Box display="flex" flexWrap="wrap" gap={2} alignItems="center" mb={3}>
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
          
          <Box display="flex" alignItems="center" sx={{ flexGrow: 1, maxWidth: 400 }}>
            <TextField
              label="Add Ticker"
              variant="outlined"
              size="small"
              value={newTicker}
              onChange={(e) => setNewTicker(e.target.value)}
              onKeyPress={handleKeyPress}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleAddTicker}
                      edge="end"
                      color="primary"
                      disabled={!newTicker.trim()}
                    >
                      <AddIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              fullWidth
            />
          </Box>
        </Box>
        
        <Box display="flex" flexWrap="wrap" gap={1} mb={3}>
          {tickers.map((ticker) => (
            <Paper
              key={ticker}
              elevation={1}
              sx={{
                display: 'flex',
                alignItems: 'center',
                padding: '4px 12px',
                borderRadius: '16px',
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
              }}
            >
              <Typography variant="body2">{ticker}</Typography>
              <IconButton
                size="small"
                onClick={() => handleRemoveTicker(ticker)}
                sx={{
                  color: 'inherit',
                  padding: '4px',
                  marginLeft: '4px',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  },
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Paper>
          ))}
        </Box>
      </Box>

      {loading && tickers.length > 0 ? (
        <Box display="flex" justifyContent="center" my={8}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box p={3} textAlign="center">
          <Typography color="error">{error}</Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={loadStockData}
            sx={{ mt: 2 }}
          >
            Retry
          </Button>
        </Box>
      ) : tickers.length === 0 ? (
        <Box p={3} textAlign="center">
          <Typography>Add some tickers to see the correlation heatmap.</Typography>
        </Box>
      ) : (
        <Paper elevation={2} sx={{ p: 2 }}>
          <CorrelationHeatmap 
            stockData={stockData} 
            timeRange={timeRange} 
          />
        </Paper>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
