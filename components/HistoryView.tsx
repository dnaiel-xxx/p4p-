import React, { useState } from 'react';
import { HistoryItem } from '../types';
import { Trash2, Eye, ArrowRightLeft, FileClock, ArrowUpDown } from 'lucide-react';

interface HistoryViewProps {
  history: HistoryItem[];
  onLoad: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  onCompare: (item: HistoryItem) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ history, onLoad, onDelete, onCompare }) => {
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if(window.confirm('确定要删除这条记录吗？')) {
        onDelete(id);
    }
  };

  // Sort history based on ID (which is a timestamp)
  const sortedHistory = [...history].sort((a, b) => {
    const timeA = parseInt(a.id) || 0;
    const timeB = parseInt(b.id) || 0;
    return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
  });

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <FileClock size={64} className="mb-4 opacity-50" />
        <h3 className="text-xl font-bold mb-2">暂无历史记录</h3>
        <p>在分析页面点击“保存数据”后，记录将显示在这里。</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileClock /> 历史记录 ({history.length})
        </h2>
        <button
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-300 transition-colors"
        >
            <ArrowUpDown size={16} />
            {sortOrder === 'desc' ? '时间: 新 → 旧' : '时间: 旧 → 新'}
        </button>
      </div>

      <div className="grid gap-4">
        {sortedHistory.map((item) => (
          <div key={item.id} className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:border-slate-600">
            <div>
              <h3 className="text-lg font-bold text-white">{item.fileName}</h3>
              <p className="text-sm text-slate-400 mb-2">保存时间: {item.dateSaved}</p>
              <div className="flex gap-4 text-sm">
                <span className="bg-slate-900/50 px-2 py-1 rounded text-emerald-400 border border-slate-700">
                   总花费: ¥{item.analysis.global.totalCost.toLocaleString()}
                </span>
                <span className="bg-slate-900/50 px-2 py-1 rounded text-indigo-400 border border-slate-700">
                   总商机: {item.analysis.global.totalLeads}
                </span>
              </div>
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
              <button 
                onClick={() => onLoad(item)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
              >
                <Eye size={16} /> 查看
              </button>
              <button 
                onClick={() => onCompare(item)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors text-sm"
              >
                <ArrowRightLeft size={16} /> 对比新数据
              </button>
              <button 
                onClick={(e) => handleDelete(e, item.id)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 rounded-lg transition-colors text-sm"
              >
                <Trash2 size={16} /> 删除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};