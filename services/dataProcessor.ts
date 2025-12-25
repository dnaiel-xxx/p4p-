import { P4PRow, CountryConfig, CategoryType, AnalysisResult, CategoryResult, AggregatedMetrics } from "../types";
import { read, utils } from "xlsx";

// Helper to determine category
const getCategory = (country: string, config: CountryConfig): CategoryType => {
  if (!country) return 'Uncategorized';
  const norm = country.trim().toLowerCase();
  if (config.primary.some(c => c.toLowerCase() === norm)) return 'Primary';
  if (config.secondary.some(c => c.toLowerCase() === norm)) return 'Secondary';
  if (config.test.some(c => c.toLowerCase() === norm)) return 'Test';
  return 'Uncategorized';
};

// Helper to clean and parse numbers from various formats (e.g. "¥229.12", "16.67%", "1,000")
const parseCleanNumber = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  
  const strVal = String(val).trim();
  
  // Handle percentage string "16.67%"
  if (strVal.includes('%')) {
    const num = parseFloat(strVal.replace('%', ''));
    return isNaN(num) ? 0 : num / 100;
  }

  // Handle Currency "¥229.12" or "$100" or "1,200"
  // Remove currency symbols (¥, ￥, $) and commas
  const cleanStr = strVal.replace(/[¥￥$,\s]/g, '');
  const num = parseFloat(cleanStr);
  return isNaN(num) ? 0 : num;
};

// Helper to find value in row based on strict or fuzzy key matching
const getValue = (row: any, candidates: string[], excludeKeywords: string[] = []) => {
  const rowKeys = Object.keys(row);
  
  // 1. Exact match attempt
  for (const candidate of candidates) {
    const exactKey = rowKeys.find(k => k.trim() === candidate);
    if (exactKey) return row[exactKey];
  }

  // 2. Fuzzy match
  for (const candidate of candidates) {
    const foundKey = rowKeys.find(k => {
      const lowerK = k.toLowerCase();
      const lowerC = candidate.toLowerCase();
      // Check if it includes the candidate keyword
      if (!lowerK.includes(lowerC)) return false;
      // Check if it contains any excluded keywords (e.g. avoid 'Rate' when looking for 'Count')
      if (excludeKeywords.some(ex => lowerK.includes(ex.toLowerCase()))) return false;
      return true;
    });
    if (foundKey) return row[foundKey];
  }
  return null;
};

export const parseExcelData = async (file: File): Promise<P4PRow[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = read(arrayBuffer);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = utils.sheet_to_json(worksheet);

  return jsonData.map((row: any) => {
    // Parsing Cost: Look for '花费', 'Cost', 'Spend'
    const costRaw = getValue(row, ['花费', 'Cost', 'Spend', '金额']);
    const cost = parseCleanNumber(costRaw);

    // Parsing Impressions: '曝光量', 'Impression'
    const impRaw = getValue(row, ['曝光量', '曝光', 'Impressions']);
    const imps = parseCleanNumber(impRaw);

    // Parsing Clicks: '点击量', 'Click' -- Exclude '率' (Rate), '占比' (Ratio), '成本' (Cost)
    const clicksRaw = getValue(row, ['点击量', 'Clicks', 'Click'], ['率', 'Rate', '占比', 'Ratio', '成本', 'Cost']);
    const clicks = parseCleanNumber(clicksRaw);

    // Parsing CPC (File): '点击成本'
    const cpcRaw = getValue(row, ['点击成本', 'CPC', 'Click Cost']);
    const fileCPC = parseCleanNumber(cpcRaw);

    // Parsing Leads: '商机量', 'Lead' -- Exclude '转化率' (Conversion), '成本'
    const leadsRaw = getValue(row, ['商机量', 'Leads', 'Lead', 'Opportunit', '询盘'], ['率', 'Rate', '成本', 'Cost']);
    const leads = parseCleanNumber(leadsRaw);

    // Parsing L1 Ratio: 'L1+买家点击占比', 'L1+ Click Ratio'
    // If we only find 'L1+点击量' (Count), we might need to calculate ratio if total clicks > 0
    // But per requirements, we look for ratio first.
    let l1Ratio = 0;
    const l1RatioRaw = getValue(row, ['L1+买家点击占比', 'L1+点击占比', 'L1+ Click Ratio', 'L1+ Ratio']);
    if (l1RatioRaw != null) {
      l1Ratio = parseCleanNumber(l1RatioRaw);
    } else {
        // Fallback: Try to calculate from L1 Count if Ratio column missing
        const l1CountRaw = getValue(row, ['L1+点击量', 'L1+ Count', 'L1+ Clicks']);
        const l1Count = parseCleanNumber(l1CountRaw);
        if (clicks > 0) {
            l1Ratio = l1Count / clicks;
        }
    }
    
    // Safety check for ratio (e.g. if Excel has 20 for 20%)
    // Usually parseCleanNumber handles %, but if raw number 20 is passed for a ratio, assume it means 20% if > 1
    if (l1Ratio > 1) l1Ratio = l1Ratio / 100;

    const countryRaw = getValue(row, ['国家/地区', '国家', 'Country', 'Region']);
    const dateRaw = getValue(row, ['日期', 'Date', 'Time', 'Period', '时间']);

    return {
      Country: String(countryRaw || 'Unknown').trim(),
      Cost: cost,
      Impressions: imps,
      Clicks: clicks,
      Leads: leads,
      L1Ratio: l1Ratio,
      FileCPC: fileCPC,
      Date: dateRaw ? String(dateRaw) : undefined
    };
  });
};

const calculateMetrics = (rows: P4PRow[], totalGlobal?: AggregatedMetrics): AggregatedMetrics => {
  const totalCost = rows.reduce((sum, r) => sum + r.Cost, 0);
  const totalImpressions = rows.reduce((sum, r) => sum + r.Impressions, 0);
  const totalClicks = rows.reduce((sum, r) => sum + r.Clicks, 0);
  const totalLeads = rows.reduce((sum, r) => sum + r.Leads, 0);
  
  // Weighted Average for L1
  const weightedL1 = totalClicks > 0 
    ? rows.reduce((sum, r) => sum + (r.L1Ratio * r.Clicks), 0) / totalClicks 
    : 0;

  // Weighted Average for File CPC (using Clicks as weight)
  const weightedFileCPC = totalClicks > 0
    ? rows.reduce((sum, r) => sum + (r.FileCPC * r.Clicks), 0) / totalClicks
    : (rows.length > 0 ? rows.reduce((sum, r) => sum + r.FileCPC, 0) / rows.length : 0);

  // Calculated Promotion Cost = Total Cost / Total LEADS
  // If leads are 0, this is technically infinite, but we handle the value here.
  const promotionCost = totalLeads > 0 ? totalCost / totalLeads : 0;

  // If global totals are provided, calculate shares, otherwise these are 100% (for global object)
  const costShare = totalGlobal && totalGlobal.totalCost > 0 ? (totalCost / totalGlobal.totalCost) * 100 : (totalCost > 0 ? 100 : 0);
  const impressionShare = totalGlobal && totalGlobal.totalImpressions > 0 ? (totalImpressions / totalGlobal.totalImpressions) * 100 : (totalImpressions > 0 ? 100 : 0);
  const clickShare = totalGlobal && totalGlobal.totalClicks > 0 ? (totalClicks / totalGlobal.totalClicks) * 100 : (totalClicks > 0 ? 100 : 0);
  const leadShare = totalGlobal && totalGlobal.totalLeads > 0 ? (totalLeads / totalGlobal.totalLeads) * 100 : (totalLeads > 0 ? 100 : 0);

  return {
    totalCost,
    totalImpressions,
    totalClicks,
    totalLeads,
    avgL1Ratio: weightedL1,
    avgFileCPC: weightedFileCPC,
    promotionCost,
    costShare,
    impressionShare,
    clickShare,
    leadShare
  };
};

export const processAnalysis = (rows: P4PRow[], config: CountryConfig): AnalysisResult => {
  // 1. Calculate Global
  const globalMetrics = calculateMetrics(rows);

  // 2. Group by Category
  const groups: Record<CategoryType, P4PRow[]> = {
    Primary: [],
    Secondary: [],
    Test: [],
    Uncategorized: []
  };

  rows.forEach(row => {
    const cat = getCategory(row.Country, config);
    groups[cat].push(row);
  });

  // 3. Process Categories
  const byCategory: any = {};
  
  (Object.keys(groups) as CategoryType[]).forEach(cat => {
    const catRows = groups[cat];
    const catMetrics = calculateMetrics(catRows, globalMetrics);
    
    // Group by Country within Category
    const countries = catRows.map(row => ({
      name: row.Country,
      metrics: calculateMetrics([row], globalMetrics)
    })).sort((a, b) => b.metrics.totalCost - a.metrics.totalCost); // Default sort by spend

    byCategory[cat] = {
      category: cat,
      ...catMetrics,
      countries
    };
  });

  return {
    global: globalMetrics,
    byCategory: byCategory,
    timeSeries: [] // Placeholder for trends
  };
};

export const generateTrendData = (rows: P4PRow[], config: CountryConfig) => {
    const hasDates = rows.some(r => !!r.Date);
    
    if (!hasDates) {
        return null;
    }

    // Simple grouping by date string
    const timeGroups: Record<string, Record<CategoryType, {cost: number, leads: number}>> = {};
    
    rows.forEach(row => {
        const d = String(row.Date); 
        if(!timeGroups[d]) {
            timeGroups[d] = {
                Primary: {cost:0, leads:0},
                Secondary: {cost:0, leads:0},
                Test: {cost:0, leads:0},
                Uncategorized: {cost:0, leads:0}
            };
        }
        const cat = getCategory(row.Country, config);
        timeGroups[d][cat].cost += row.Cost;
        timeGroups[d][cat].leads += row.Leads;
    });

    return Object.keys(timeGroups).map(date => ({
        date,
        PrimaryCost: timeGroups[date].Primary.cost,
        PrimaryLeads: timeGroups[date].Primary.leads,
        SecondaryCost: timeGroups[date].Secondary.cost,
        SecondaryLeads: timeGroups[date].Secondary.leads,
        TestCost: timeGroups[date].Test.cost,
        TestLeads: timeGroups[date].Test.leads,
        UncategorizedCost: timeGroups[date].Uncategorized.cost,
        UncategorizedLeads: timeGroups[date].Uncategorized.leads,
    })).sort((a,b) => a.date.localeCompare(b.date));
};