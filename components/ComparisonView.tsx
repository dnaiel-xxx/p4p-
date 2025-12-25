import React from 'react';
import { AnalysisResult, CategoryType, CountryConfig } from '../types';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface ComparisonViewProps {
  baseData: AnalysisResult;
  baseName: string;
  newData: AnalysisResult;
  newName: string;
  config: CountryConfig;
}

// Flatten AnalysisResult to a map of Country Name -> Metrics for easy lookup
const flattenData = (data: AnalysisResult) => {
  const map = new Map<string, any>();
  const categories: CategoryType[] = ['Primary', 'Secondary', 'Test', 'Uncategorized'];
  categories.forEach(cat => {
    data.byCategory[cat].countries.forEach(c => {
      map.set(c.name, c.metrics);
    });
  });
  return map;
};

// Helper to determine category based on passed config
const getCategory = (country: string, config: CountryConfig): CategoryType => {
  if (!country) return 'Uncategorized';
  const norm = country.trim().toLowerCase();
  if (config.primary.some(c => c.toLowerCase() === norm)) return 'Primary';
  if (config.secondary.some(c => c.toLowerCase() === norm)) return 'Secondary';
  if (config.test.some(c => c.toLowerCase() === norm)) return 'Test';
  return 'Uncategorized';
};

const COLORS: Record<CategoryType, string> = {
  Primary: '#10b981', // Emerald
  Secondary: '#f59e0b', // Amber
  Test: '#6366f1', // Indigo
  Uncategorized: '#64748b' // Slate
};

const MetricDiff: React.FC<{ 
    oldVal: number; 
    newVal: number; 
    type: 'cost' | 'leads' | 'cpl' | 'inverse_ratio';
    isCurrency?: boolean; 
}> = ({ oldVal, newVal, type, isCurrency }) => {
  const diff = newVal - oldVal;
  if (Math.abs(diff) < 0.01) return <span className="text-slate-500"><Minus size={14} className="inline" /></span>;

  let colorClass = "text-slate-400";
  
  if (type === 'cost' || type === 'cpl') {
    // Red = Increase, Green = Decrease
    colorClass = diff > 0 ? "text-red-400" : "text-emerald-400";
  } else if (type === 'leads') {
     // Green = Increase, Red = Decrease
    colorClass = diff > 0 ? "text-emerald-400" : "text-red-400";
  }

  const Icon = diff > 0 ? ArrowUp : ArrowDown;
  const valStr = isCurrency 
    ? `¥${Math.abs(diff).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}` 
    : Math.abs(diff).toLocaleString(undefined, {maximumFractionDigits: 1});

  return (
    <span className={`flex items-center justify-end gap-1 ${colorClass} text-xs font-bold`}>
      <Icon size={12} /> {valStr}
    </span>
  );
};

export const ComparisonView: React.FC<ComparisonViewProps> = ({ baseData, baseName, newData, newName, config }) => {
  const oldMap = flattenData(baseData);
  const newMap = flattenData(newData);
  
  // 1. Get all unique countries
  const allCountries = Array.from(new Set([...Array.from(oldMap.keys()), ...Array.from(newMap.keys())]));

  // 2. Group countries by category using current config
  const grouped: Record<CategoryType, string[]> = {
    Primary: [],
    Secondary: [],
    Test: [],
    Uncategorized: []
  };

  allCountries.forEach(country => {
    const cat = getCategory(country, config);
    grouped[cat].push(country);
  });

  // 3. Sort countries within groups by New Cost (descending)
  (Object.keys(grouped) as CategoryType[]).forEach(cat => {
    grouped[cat].sort((a, b) => {
        const costA = newMap.get(a)?.totalCost || oldMap.get(a)?.totalCost || 0;
        const costB = newMap.get(b)?.totalCost || oldMap.get(b)?.totalCost || 0;
        return costB - costA;
    });
  });

  // Global Diffs
  const globalCostDiff = newData.global.totalCost - baseData.global.totalCost;
  const globalLeadsDiff = newData.global.totalLeads - baseData.global.totalLeads;
  const categories: CategoryType[] = ['Primary', 'Secondary', 'Test', 'Uncategorized'];

  return (
    <div className="space-y-8 pb-12">
      {/* Summary Card */}
      <div className="bg-slate-800 p-6 rounded-xl border border-indigo-500/50 shadow-lg shadow-indigo-500/10">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            📊 数据对比报告
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                <p className="text-slate-400 mb-1">基准文档 (旧):</p>
                <p className="text-white font-mono font-bold truncate" title={baseName}>{baseName}</p>
            </div>
            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                <p className="text-slate-400 mb-1">对比文档 (新):</p>
                <p className="text-white font-mono font-bold truncate" title={newName}>{newName}</p>
            </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
             <div className="p-4 bg-slate-700/30 rounded-lg text-center">
                <p className="text-slate-400 text-xs">总花费变化</p>
                <div className={`text-xl font-bold mt-1 ${globalCostDiff > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {globalCostDiff > 0 ? '+' : ''}¥{globalCostDiff.toLocaleString()}
                </div>
             </div>
             <div className="p-4 bg-slate-700/30 rounded-lg text-center">
                <p className="text-slate-400 text-xs">总商机变化</p>
                <div className={`text-xl font-bold mt-1 ${globalLeadsDiff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {globalLeadsDiff > 0 ? '+' : ''}{globalLeadsDiff}
                </div>
             </div>
        </div>
      </div>

      <div className="space-y-8">
        {categories.map(cat => {
            const countries = grouped[cat];
            if (countries.length === 0) return null;

            return (
                <div key={cat} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-700 flex items-center" style={{ borderLeft: `4px solid ${COLORS[cat]}`}}>
                        <h3 className="text-lg font-bold text-white">{cat === 'Uncategorized' ? '未分类' : cat} 对比</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-300">
                            <thead className="text-xs uppercase bg-slate-900/50 text-slate-400">
                                <tr>
                                    <th className="px-6 py-3 min-w-[120px]">国家/地区</th>
                                    <th className="px-6 py-3 text-right min-w-[100px]">花费 (旧)</th>
                                    <th className="px-6 py-3 text-right min-w-[100px]">花费 (新)</th>
                                    <th className="px-6 py-3 text-right min-w-[80px]">变化</th>
                                    
                                    <th className="px-6 py-3 text-right min-w-[80px] border-l border-slate-700">商机 (旧)</th>
                                    <th className="px-6 py-3 text-right min-w-[80px]">商机 (新)</th>
                                    <th className="px-6 py-3 text-right min-w-[80px]">变化</th>

                                    <th className="px-6 py-3 text-right min-w-[100px] border-l border-slate-700">CPL (旧)</th>
                                    <th className="px-6 py-3 text-right min-w-[100px]">CPL (新)</th>
                                    <th className="px-6 py-3 text-right min-w-[80px]">变化</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {countries.map(country => {
                                    const oldM = oldMap.get(country);
                                    const newM = newMap.get(country);

                                    const oldCost = oldM?.totalCost || 0;
                                    const newCost = newM?.totalCost || 0;
                                    
                                    const oldLeads = oldM?.totalLeads || 0;
                                    const newLeads = newM?.totalLeads || 0;

                                    const oldCPL = oldM?.promotionCost || 0;
                                    const newCPL = newM?.promotionCost || 0;

                                    return (
                                        <tr key={country} className="hover:bg-slate-700/30 transition-colors">
                                            <td className="px-6 py-3 font-medium text-white">{country}</td>
                                            
                                            {/* Cost */}
                                            <td className="px-6 py-3 text-right text-slate-500">¥{oldCost.toLocaleString()}</td>
                                            <td className="px-6 py-3 text-right font-medium text-slate-200">¥{newCost.toLocaleString()}</td>
                                            <td className="px-6 py-3 text-right">
                                                <MetricDiff oldVal={oldCost} newVal={newCost} type="cost" isCurrency />
                                            </td>

                                            {/* Leads */}
                                            <td className="px-6 py-3 text-right text-slate-500 border-l border-slate-700">{oldLeads}</td>
                                            <td className="px-6 py-3 text-right font-medium text-slate-200">{newLeads}</td>
                                            <td className="px-6 py-3 text-right">
                                                <MetricDiff oldVal={oldLeads} newVal={newLeads} type="leads" />
                                            </td>

                                            {/* CPL */}
                                            <td className="px-6 py-3 text-right text-slate-500 border-l border-slate-700">
                                                {oldLeads > 0 ? `¥${oldCPL.toFixed(1)}` : '-'}
                                            </td>
                                            <td className="px-6 py-3 text-right font-medium text-slate-200">
                                                {newLeads > 0 ? `¥${newCPL.toFixed(1)}` : '-'}
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                {(oldLeads > 0 && newLeads > 0) ? (
                                                    <MetricDiff oldVal={oldCPL} newVal={newCPL} type="cpl" isCurrency />
                                                ) : <span className="text-slate-600">-</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
};