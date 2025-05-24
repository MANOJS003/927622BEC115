import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  useTheme,
} from '@mui/material';
import { StockPrice } from '../types/stock';
import { calculateAverage, calculateStandardDeviation, getColorForCorrelation } from '../utils/stockUtils';

interface CorrelationHeatmapProps {
  stockData: Record<string, StockPrice[]>;
  timeRange: number;
}

export const CorrelationHeatmap: React.FC<CorrelationHeatmapProps> = ({ stockData, timeRange }) => {
  const theme = useTheme();
  const [hoveredCell, setHoveredCell] = useState<{row: string, col: string} | null>(null);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);

  const tickers = useMemo(() => Object.keys(stockData), [stockData]);

  const correlationMatrix = useMemo(() => {
    const matrix: Record<string, Record<string, number>> = {};
    
    // Initialize matrix
    tickers.forEach(ticker1 => {
      matrix[ticker1] = {};
      tickers.forEach(ticker2 => {
        matrix[ticker1][ticker2] = 0;
      });
    });

    // Calculate correlations
    tickers.forEach((ticker1, i) => {
      tickers.forEach((ticker2, j) => {
        if (i <= j) { // Calculate only once per pair
          const prices1 = stockData[ticker1].map(item => item.price);
          const prices2 = stockData[ticker2].map(item => item.price);
          
          // Use the minimum length to ensure arrays match
          const minLength = Math.min(prices1.length, prices2.length);
          const alignedPrices1 = prices1.slice(0, minLength);
          const alignedPrices2 = prices2.slice(0, minLength);
          
          // Calculate correlation
          const n = alignedPrices1.length;
          if (n === 0) {
            matrix[ticker1][ticker2] = 0;
            matrix[ticker2][ticker1] = 0;
            return;
          }
          
          const avg1 = calculateAverage(alignedPrices1);
          const avg2 = calculateAverage(alignedPrices2);
          
          let covariance = 0;
          let variance1 = 0;
          let variance2 = 0;
          
          for (let i = 0; i < n; i++) {
            const diff1 = alignedPrices1[i] - avg1;
            const diff2 = alignedPrices2[i] - avg2;
            
            covariance += diff1 * diff2;
            variance1 += diff1 * diff1;
            variance2 += diff2 * diff2;
          }
          
          let correlation = 0;
          if (variance1 > 0 && variance2 > 0) {
            correlation = covariance / (Math.sqrt(variance1) * Math.sqrt(variance2));
          }
          
          // Handle potential floating point precision issues
          correlation = Math.max(-1, Math.min(1, correlation));
          
          matrix[ticker1][ticker2] = correlation;
          matrix[ticker2][ticker1] = correlation; // Symmetric
        }
      });
    });
    
    return matrix;
  }, [stockData, tickers]);

  const stockStats = useMemo(() => {
    const stats: Record<string, { avg: number; stdDev: number }> = {};
    
    tickers.forEach(ticker => {
      const prices = stockData[ticker]?.map(item => item.price) || [];
      stats[ticker] = {
        avg: calculateAverage(prices),
        stdDev: calculateStandardDeviation(prices)
      };
    });
    
    return stats;
  }, [stockData, tickers]);

  const handleCellHover = (rowTicker: string, colTicker: string) => {
    setHoveredCell({ row: rowTicker, col: colTicker });
  };

  const handleCellClick = (ticker: string) => {
    setSelectedTicker(prev => prev === ticker ? null : ticker);
  };

  if (tickers.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Typography>No stock data available</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        Stock Correlation Heatmap - Last {timeRange} minutes
      </Typography>
      
      <Box sx={{ display: 'flex', mb: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', mr: 4 }}>
          <Typography variant="subtitle2">Correlation Legend:</Typography>
          <Box sx={{ display: 'flex', mt: 1 }}>
            {[-1, -0.5, 0, 0.5, 1].map((value, i, arr) => {
              const nextValue = arr[i + 1];
              if (nextValue === undefined) return null;
              const color = getColorForCorrelation((value + nextValue) / 2);
              return (
                <Box 
                  key={value}
                  sx={{
                    width: 40,
                    height: 20,
                    backgroundColor: color,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: 'white',
                    fontSize: '0.7rem',
                  }}
                >
                  {value.toFixed(1)}
                </Box>
              );
            })}
          </Box>
        </Box>
        
        {(hoveredCell || selectedTicker) && (
          <Box sx={{ ml: 'auto' }}>
            <Typography variant="subtitle2">
              {selectedTicker ? 'Selected: ' : 'Hovering: '}
              {selectedTicker || (hoveredCell ? `${hoveredCell.row} vs ${hoveredCell.col}` : '')}
            </Typography>
            {selectedTicker ? (
              <Typography variant="body2">
                Avg: ${stockStats[selectedTicker]?.avg.toFixed(2)}, 
                Std Dev: ${stockStats[selectedTicker]?.stdDev.toFixed(2)}
              </Typography>
            ) : hoveredCell ? (
              <Typography variant="body2">
                Correlation: {correlationMatrix[hoveredCell.row]?.[hoveredCell.col]?.toFixed(2) || 'N/A'}
              </Typography>
            ) : null}
          </Box>
        )}
      </Box>
      
      <TableContainer component={Paper} sx={{ maxHeight: 600, overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Stock</TableCell>
              {tickers.map(ticker => (
                <TableCell 
                  key={ticker}
                  align="center"
                  sx={{
                    cursor: 'pointer',
                    backgroundColor: selectedTicker === ticker 
                      ? theme.palette.action.selected 
                      : 'inherit',
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                    },
                  }}
                  onClick={() => handleCellClick(ticker)}
                >
                  {ticker}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {tickers.map((rowTicker) => (
              <TableRow key={rowTicker}>
                <TableCell 
                  component="th" 
                  scope="row"
                  sx={{
                    cursor: 'pointer',
                    backgroundColor: selectedTicker === rowTicker 
                      ? theme.palette.action.selected 
                      : 'inherit',
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                    },
                  }}
                  onClick={() => handleCellClick(rowTicker)}
                >
                  {rowTicker}
                </TableCell>
                {tickers.map((colTicker) => {
                  const correlation = correlationMatrix[rowTicker]?.[colTicker] || 0;
                  const isHovered = hoveredCell?.row === rowTicker && hoveredCell?.col === colTicker;
                  const isSelected = selectedTicker === rowTicker || selectedTicker === colTicker;
                  
                  return (
                    <Tooltip 
                      key={`${rowTicker}-${colTicker}`}
                      title={
                        <>
                          <div>{`${rowTicker} vs ${colTicker}`}</div>
                          <div>Correlation: {correlation.toFixed(2)}</div>
                        </>
                      }
                      arrow
                    >
                      <TableCell
                        align="center"
                        sx={{
                          backgroundColor: getColorForCorrelation(correlation),
                          color: 'white',
                          cursor: 'pointer',
                          border: isHovered || isSelected 
                            ? `2px solid ${theme.palette.common.black}` 
                            : '1px solid rgba(224, 224, 224, 1)',
                          opacity: selectedTicker 
                            ? (selectedTicker === rowTicker || selectedTicker === colTicker) ? 1 : 0.3 
                            : 1,
                          transition: 'opacity 0.2s',
                        }}
                        onMouseEnter={() => handleCellHover(rowTicker, colTicker)}
                        onMouseLeave={() => setHoveredCell(null)}
                        onClick={() => {
                          if (selectedTicker === rowTicker) {
                            setSelectedTicker(null);
                          } else {
                            setSelectedTicker(rowTicker);
                          }
                        }}
                      >
                        {correlation.toFixed(2)}
                      </TableCell>
                    </Tooltip>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      {(hoveredCell || selectedTicker) && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            {selectedTicker 
              ? `Statistics for ${selectedTicker}`
              : `Correlation between ${hoveredCell?.row} and ${hoveredCell?.col}`}
          </Typography>
          
          {selectedTicker ? (
            <Box>
              <Typography variant="body2">
                Average Price: ${stockStats[selectedTicker]?.avg.toFixed(2)}
              </Typography>
              <Typography variant="body2">
                Standard Deviation: ${stockStats[selectedTicker]?.stdDev.toFixed(2)}
              </Typography>
            </Box>
          ) : hoveredCell ? (
            <Typography variant="body2">
              Correlation: {correlationMatrix[hoveredCell.row]?.[hoveredCell.col]?.toFixed(2) || 'N/A'}
            </Typography>
          ) : null}
        </Box>
      )}
    </Box>
  );
};
