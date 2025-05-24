export interface StockPrice {
  ticker: string;
  price: number;
  timestamp: string;
}

export interface StockDetails {
  ticker: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
}

export interface CorrelationData {
  [key: string]: {
    [key: string]: number;
  };
}

export interface TimeRange {
  label: string;
  value: number; // in minutes
}
