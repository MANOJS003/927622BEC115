import { StockPrice } from '../types/stock';

export const calculateAverage = (prices: number[]): number => {
  if (prices.length === 0) return 0;
  const sum = prices.reduce((acc, price) => acc + price, 0);
  return sum / prices.length;
};

export const calculateStandardDeviation = (prices: number[]): number => {
  if (prices.length === 0) return 0;
  const avg = calculateAverage(prices);
  const squareDiffs = prices.map(price => Math.pow(price - avg, 2));
  const avgSquareDiff = calculateAverage(squareDiffs);
  return Math.sqrt(avgSquareDiff);
};

export const calculateCorrelation = (prices1: number[], prices2: number[]): number => {
  if (prices1.length !== prices2.length || prices1.length === 0) return 0;
  
  const n = prices1.length;
  const avg1 = calculateAverage(prices1);
  const avg2 = calculateAverage(prices2);
  
  let covariance = 0;
  let variance1 = 0;
  let variance2 = 0;
  
  for (let i = 0; i < n; i++) {
    const diff1 = prices1[i] - avg1;
    const diff2 = prices2[i] - avg2;
    
    covariance += diff1 * diff2;
    variance1 += diff1 * diff1;
    variance2 += diff2 * diff2;
  }
  
  if (variance1 === 0 || variance2 === 0) return 0;
  
  return covariance / (Math.sqrt(variance1) * Math.sqrt(variance2));
};

export const processStockData = (stockData: Record<string, StockPrice[]>) => {
  const tickers = Object.keys(stockData);
  const correlationMatrix: Record<string, Record<string, number>> = {};
  
  // Initialize correlation matrix
  tickers.forEach(ticker1 => {
    correlationMatrix[ticker1] = {};
    tickers.forEach(ticker2 => {
      correlationMatrix[ticker1][ticker2] = 0;
    });
  });
  
  // Calculate correlations
  tickers.forEach(ticker1 => {
    tickers.forEach(ticker2 => {
      if (ticker1 === ticker2) {
        correlationMatrix[ticker1][ticker2] = 1; // Correlation with self is 1
      } else if (ticker1 < ticker2) { // Calculate only once per pair
        const prices1 = stockData[ticker1].map(item => item.price);
        const prices2 = stockData[ticker2].map(item => item.price);
        
        // Align prices by timestamp if needed
        const alignedPrices = alignPricesByTimestamp(
          stockData[ticker1],
          stockData[ticker2]
        );
        
        const alignedPrices1 = alignedPrices.map(p => p.price1);
        const alignedPrices2 = alignedPrices.map(p => p.price2);
        
        const correlation = calculateCorrelation(alignedPrices1, alignedPrices2);
        correlationMatrix[ticker1][ticker2] = correlation;
        correlationMatrix[ticker2][ticker1] = correlation; // Symmetric
      }
    });
  });
  
  return correlationMatrix;
};

const alignPricesByTimestamp = (
  prices1: StockPrice[],
  prices2: StockPrice[]
): Array<{ price1: number; price2: number }> => {
  const timeMap1 = new Map<string, number>();
  const timeMap2 = new Map<string, number>();
  
  // Create maps of timestamp to price for both stocks
  prices1.forEach(item => {
    const date = new Date(item.timestamp);
    const roundedTime = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      0, 0
    ).toISOString();
    timeMap1.set(roundedTime, item.price);
  });
  
  prices2.forEach(item => {
    const date = new Date(item.timestamp);
    const roundedTime = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      0, 0
    ).toISOString();
    timeMap2.set(roundedTime, item.price);
  });
  
  // Find common timestamps and create aligned price pairs
  const alignedPrices: Array<{ price1: number; price2: number }> = [];
  
  // Use Array.from to convert Map keys to an array
  const timestamps1 = Array.from(timeMap1.keys());
  
  // Iterate through timestamps from the first map
  for (const timestamp of timestamps1) {
    if (timeMap2.has(timestamp)) {
      alignedPrices.push({
        price1: timeMap1.get(timestamp)!,
        price2: timeMap2.get(timestamp)!
      });
    }
  }
  
  return alignedPrices;
};

export const getColorForCorrelation = (value: number): string => {
  // Value is between -1 and 1
  if (value >= 0.7) return '#2e7d32'; // Dark green
  if (value >= 0.3) return '#689f38'; // Medium green
  if (value > -0.3) return '#9e9e9e'; // Grey for near-zero correlation
  if (value > -0.7) return '#ef6c00'; // Orange
  return '#c62828'; // Dark red for strong negative correlation
};
