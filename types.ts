import React from 'react';

export interface P4PRow {
  Country: string;
  Cost: number;
  Impressions: number;
  Clicks: number;
  Leads: number;
  L1Ratio: number; // 0-1
  FileCPC: number; // CPC read directly from Excel
  Date?: string; // Optional for trend analysis
}

export type CategoryType = 'Primary' | 'Secondary' | 'Test' | 'Uncategorized';

export interface CountryConfig {
  primary: string[];
  secondary: string[];
  test: string[];
}

export interface AggregatedMetrics {
  totalCost: number;
  totalImpressions: number;
  totalClicks: number;
  totalLeads: number;
  avgL1Ratio: number;
  
  avgFileCPC: number; // Weighted average of FileCPC
  promotionCost: number; // Calculated: Total Cost / Total Clicks
  
  // Percentages relative to global total
  costShare: number;
  impressionShare: number;
  clickShare: number;
  leadShare: number;
}

export interface CategoryResult extends AggregatedMetrics {
  category: CategoryType;
  countries: {
    name: string;
    metrics: AggregatedMetrics;
  }[];
}

export interface AnalysisResult {
  global: AggregatedMetrics;
  byCategory: Record<CategoryType, CategoryResult>;
  timeSeries?: any[]; // For trends
}

export interface HistoryItem {
  id: string;
  fileName: string;
  dateSaved: string;
  analysis: AnalysisResult;
  config: CountryConfig;
}