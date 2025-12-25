import React from 'react';
import { AnalysisResult, CategoryResult, CategoryType } from '../types';

interface CoreMonitorProps {
  data: AnalysisResult;
}

const COLORS: Record<CategoryType, string> = {
  Primary: '#10b981', // Emerald
  Secondary: '#f59e0b', // Amber
  Test: '#6366f1', // Indigo
  Uncategorized: '#64748b' // Slate
};

const formatCurrency = (val: number) => `¥${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const formatNumber = (val: number) => val.toLocaleString();

// Helper to determine color for Cost Per Lead (Promotion Cost)
const getCPLStyle = (cost: number, leads: number, cpl: number) => {
    if (leads === 0) {
        // If Leads are 0, check if Cost is high (> 150)
        if (cost > 150) {
            return "text-red-500 font-extrabold"; // "重点标记红色突出"
        }
        return "text-slate-500"; // Low spend, no leads - neutral
    }

    // Leads > 0
    if (cpl < 100) return "text-emerald-600 font-extrabold"; // Deep Green
    if (cpl < 150) return "text-emerald-400 font-bold"; // Green
    
    // cpl >= 150
    return "text-red-500 font-bold"; // Red
};

export const CoreMonitor: React.FC<CoreMonitorProps> = ({ data }) => {
  const categories: CategoryType[] = ['Primary', 'Secondary', 'Test', 'Uncategorized'];

  return (
    <div className="space-y-8 pb-12">
      
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <p className="text-slate-400 text-sm">总花费 (Total Spend)</p>
          <p className="text-3xl font-bold text-white mt-1">{formatCurrency(data.global.totalCost)}</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <p className="text-slate-400 text-sm">总商机 (Total Leads)</p>
          <p className="text-3xl font-bold text-emerald-400 mt-1">{formatNumber(data.global.totalLeads)}</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <p className="text-slate-400 text-sm">平均推广成本 (Cost/Lead)</p>
          <p className="text-3xl font-bold text-indigo-400 mt-1">¥{data.global.promotionCost.toFixed(2)}</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <p className="text-slate-400 text-sm">L1+ 点击占比</p>
          <p className="text-3xl font-bold text-amber-400 mt-1">{(data.global.avgL1Ratio * 100).toFixed(1)}%</p>
        </div>
      </div>

      {/* Spend Share Data Visualization (Replacing Charts) */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
        <h3 className="text-lg font-bold text-white mb-6">花费占比 (Spend Share)</h3>
        <div className="grid grid-cols-1 gap-4">
          {categories.map(cat => {
            const percentage = data.byCategory[cat].costShare;
            if (percentage === 0) return null;
            return (
              <div key={cat} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300 font-medium">{cat === 'Uncategorized' ? '未分类' : cat}</span>
                  <span className="text-white font-bold">{percentage.toFixed(2)}%</span>
                </div>
                <div className="h-3 w-full bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full" 
                    style={{ width: `${percentage}%`, backgroundColor: COLORS[cat] }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Tables by Category */}
      <div className="space-y-8">
        {categories.map(cat => {
            const dataCat = data.byCategory[cat];
            if (dataCat.countries.length === 0) return null;

            return (
                <div key={cat} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center" style={{ borderLeft: `4px solid ${COLORS[cat]}`}}>
                        <div>
                            <h3 className="text-xl font-bold text-white">{cat === 'Uncategorized' ? '未分类' : cat} 国家/地区</h3>
                            <div className="flex gap-4 text-sm text-slate-400 mt-1">
                                <span>花费占比: {dataCat.costShare.toFixed(1)}%</span>
                                <span>商机占比: {dataCat.leadShare.toFixed(1)}%</span>
                            </div>
                        </div>
                        <div className="text-right flex gap-4">
                             <span className="text-xs font-mono bg-slate-700 text-slate-300 px-2 py-1 rounded">平均CPC: ¥{dataCat.avgFileCPC.toFixed(2)}</span>
                             <span className="text-xs font-mono bg-indigo-900/50 text-indigo-300 px-2 py-1 rounded border border-indigo-700/50">平均CPL: ¥{dataCat.promotionCost.toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-300">
                            <thead className="text-xs uppercase bg-slate-900/50 text-slate-400">
                                <tr>
                                    <th className="px-6 py-3">国家/地区</th>
                                    <th className="px-6 py-3 text-right">花费</th>
                                    <th className="px-6 py-3 text-right">花费占比</th>
                                    <th className="px-6 py-3 text-right">曝光量</th>
                                    <th className="px-6 py-3 text-right">点击量</th>
                                    <th className="px-6 py-3 text-right">商机量</th>
                                    <th className="px-6 py-3 text-right text-slate-500">CPC (文档)</th>
                                    <th className="px-6 py-3 text-right text-indigo-400">推广成本 (Cost/Lead)</th>
                                    <th className="px-6 py-3 text-right">L1+ 占比</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dataCat.countries.map((country, idx) => {
                                    const cplStyle = getCPLStyle(country.metrics.totalCost, country.metrics.totalLeads, country.metrics.promotionCost);
                                    
                                    return (
                                        <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                                            <td className="px-6 py-3 font-medium text-white">{country.name}</td>
                                            <td className="px-6 py-3 text-right">{formatCurrency(country.metrics.totalCost)}</td>
                                            <td className="px-6 py-3 text-right text-slate-500">{country.metrics.costShare.toFixed(1)}%</td>
                                            <td className="px-6 py-3 text-right">{formatNumber(country.metrics.totalImpressions)}</td>
                                            <td className="px-6 py-3 text-right">{formatNumber(country.metrics.totalClicks)}</td>
                                            <td className="px-6 py-3 text-right font-medium text-emerald-400">{formatNumber(country.metrics.totalLeads)}</td>
                                            <td className="px-6 py-3 text-right text-slate-500">¥{country.metrics.avgFileCPC.toFixed(2)}</td>
                                            <td className={`px-6 py-3 text-right ${cplStyle}`}>
                                                {country.metrics.totalLeads === 0 ? '-' : `¥${country.metrics.promotionCost.toFixed(2)}`}
                                            </td>
                                            <td className="px-6 py-3 text-right">{(country.metrics.avgL1Ratio * 100).toFixed(1)}%</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )
        })}
      </div>
    </div>
  );
};