import axios from 'axios';
import { StockPrice } from '../types/stock';

// Using a CORS proxy to avoid CORS issues
const API_BASE_URL = 'https://cors-anywhere.herokuapp.com/http://20.244.56.144/evaluation-service';

export const fetchStockPrices = async (ticker: string, minutes: number = 30): Promise<StockPrice[]> => {
  try {
    const url = `${API_BASE_URL}/stocks/${ticker}?minutes=${minutes}`;
    console.log(`Fetching data from: ${url}`);
    
    const response = await axios.get<StockPrice[] | StockPrice>(url, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: 10000 // 10 second timeout
    });
    
    console.log('API Response:', response);
    
    // Handle both single price and array of prices
    const data = response.data;
    const result = Array.isArray(data) ? data : [data];
    
    if (!result || result.length === 0) {
      console.warn('No data returned from API');
      return [];
    }
    
    return result;
  } catch (error: any) {
    console.error('Error fetching stock prices:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: {
        url: error.config?.url,
        method: error.config?.method,
      }
    });
    
    // Return mock data if API fails
    console.warn('Using mock data due to API error');
    return generateMockData(ticker, minutes);
  }
};

// Generate mock data for development
const generateMockData = (ticker: string, minutes: number): StockPrice[] => {
  const now = new Date();
  const data: StockPrice[] = [];
  
  for (let i = minutes; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60000);
    const basePrice = 100 + (Math.random() * 50); // Random base price between 100-150
    const price = basePrice + (Math.sin(i / 5) * 5); // Add some variation
    
    data.push({
      ticker,
      price: parseFloat(price.toFixed(2)),
      timestamp: time.toISOString()
    });
  }
  
  return data;
};

export const fetchAllStocks = async (tickers: string[], minutes: number): Promise<Record<string, StockPrice[]>> => {
  try {
    const promises = tickers.map(ticker => 
      fetchStockPrices(ticker, minutes).catch(error => {
        console.error(`Error fetching data for ${ticker}:`, error);
        return [];
      })
    );

    const results = await Promise.all(promises);
    
    return tickers.reduce((acc, ticker, index) => {
      acc[ticker] = results[index] || [];
      return acc;
    }, {} as Record<string, StockPrice[]>);
  } catch (error) {
    console.error('Error in fetchAllStocks:', error);
    throw error;
  }
};
