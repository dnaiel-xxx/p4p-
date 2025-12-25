import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface TrendAnalysisProps {
  trendData: any[] | null;
}

export const TrendAnalysis: React.FC<TrendAnalysisProps> = ({ trendData }) => {
  if (!trendData || trendData.length === 0) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center bg-slate-800 rounded-xl border border-slate-700 border-dashed p-8 text-center">
        <h3 className="text-xl font-bold text-slate-300 mb-2">No Trend Data Available</h3>
        <p className="text-slate-500 max-w-md">
          We couldn't find a valid 'Date', 'Time' or 'Period' column in your Excel file. 
          Please ensure your data includes time information to visualize trends.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
        <h3 className="text-xl font-bold text-white mb-6">Spend Trend by Category</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{backgroundColor: '#1e293b', borderColor: '#334155'}} />
              <Legend />
              <Line type="monotone" dataKey="PrimaryCost" name="Primary Spend" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="SecondaryCost" name="Secondary Spend" stroke="#f59e0b" strokeWidth={2} />
              <Line type="monotone" dataKey="TestCost" name="Test Spend" stroke="#6366f1" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
        <h3 className="text-xl font-bold text-white mb-6">Lead Trend by Category</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{backgroundColor: '#1e293b', borderColor: '#334155'}} />
              <Legend />
              <Line type="monotone" dataKey="PrimaryLeads" name="Primary Leads" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="SecondaryLeads" name="Secondary Leads" stroke="#f59e0b" strokeWidth={2} />
              <Line type="monotone" dataKey="TestLeads" name="Test Leads" stroke="#6366f1" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};