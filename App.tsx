import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { CoreMonitor } from './components/CoreMonitor';
import { Settings } from './components/Settings';
import { TrendAnalysis } from './components/TrendAnalysis';
import { HistoryView } from './components/HistoryView';
import { ComparisonView } from './components/ComparisonView';
import { CountryConfig, AnalysisResult, P4PRow, HistoryItem } from './types';
import { parseExcelData, processAnalysis, generateTrendData } from './services/dataProcessor';
import { saveHistoryItem, getHistory, deleteHistoryItem } from './services/storage';
import { Save } from 'lucide-react';

// Default Config with Chinese support based on user screenshot
const DEFAULT_CONFIG: CountryConfig = {
  primary: [
    '美国', '英国', '德国', '澳大利亚', '加拿大', '法国', 
    'United States', 'UK', 'Germany', 'Australia', 'Canada', 'France'
  ],
  secondary: [
    '意大利', '西班牙', '荷兰', '墨西哥', '巴西', '沙特', '阿联酋', '韩国', '日本',
    'Italy', 'Spain', 'Netherlands', 'Mexico', 'Brazil', 'Saudi Arabia', 'UAE', 'Korea', 'Japan'
  ],
  test: [
    '印度', '波兰', '瑞典', '俄罗斯', '越南', '新加坡', '土耳其', '以色列',
    'India', 'Poland', 'Sweden', 'Russia', 'Vietnam', 'Singapore', 'Turkey', 'Israel'
  ]
};

const App: React.FC = () => {
  const [view, setView] = useState<'dashboard' | 'trends' | 'settings' | 'upload' | 'history' | 'comparison'>('upload');
  const [config, setConfig] = useState<CountryConfig>(DEFAULT_CONFIG);
  
  // Current Active Data
  const [rawData, setRawData] = useState<P4PRow[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [trendData, setTrendData] = useState<any[] | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string>("");

  // History & Comparison
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [comparisonBase, setComparisonBase] = useState<HistoryItem | null>(null);

  useEffect(() => {
    // Load history on mount
    setHistory(getHistory());
  }, []);

  const handleFileSelect = async (file: File) => {
    try {
      const rows = await parseExcelData(file);
      setRawData(rows);
      setCurrentFileName(file.name);

      // Automatically process
      const result = processAnalysis(rows, config);
      const trends = generateTrendData(rows, config);
      
      setAnalysis(result);
      setTrendData(trends);

      // If we are in "Comparison Mode" (waiting for new file), go to comparison view
      if (comparisonBase) {
        setView('comparison');
      } else {
        setView('dashboard');
      }
    } catch (e) {
      console.error(e);
      alert("解析文件时出错，请检查格式。");
    }
  };

  const handleConfigSave = (newConfig: CountryConfig) => {
    setConfig(newConfig);
    if (rawData.length > 0) {
      const result = processAnalysis(rawData, newConfig);
      const trends = generateTrendData(rawData, newConfig);
      setAnalysis(result);
      setTrendData(trends);
      alert("配置已保存，数据已重新计算！");
    } else {
      alert("配置已保存！");
    }
  };

  const handleSaveData = () => {
    if (!analysis) return;
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      fileName: currentFileName,
      dateSaved: new Date().toLocaleString(),
      analysis: analysis,
      config: config
    };
    const updatedHistory = saveHistoryItem(newItem);
    setHistory(updatedHistory);
    alert(`已保存记录: ${currentFileName}`);
  };

  const handleDeleteHistory = (id: string) => {
    const updated = deleteHistoryItem(id);
    setHistory(updated);
  };

  const handleLoadHistory = (item: HistoryItem) => {
    setAnalysis(item.analysis);
    setConfig(item.config);
    setCurrentFileName(item.fileName);
    // Note: We don't recover raw rows or trend data fully from history item unless we store them. 
    // AnalysisResult is enough for Dashboard. Trend data might be missing if we don't store it.
    // For now, let's assume we just view the dashboard snapshot.
    setTrendData(null); 
    setRawData([]); 
    setView('dashboard');
  };

  const handleInitCompare = (item: HistoryItem) => {
    setComparisonBase(item);
    // Reset current data so user uploads fresh
    setAnalysis(null);
    setCurrentFileName("");
    setView('upload');
  };

  // Extract unique countries for the settings quick-select
  const detectedCountries = React.useMemo(() => {
    if (!rawData || rawData.length === 0) return [];
    return Array.from(new Set(rawData.map(r => r.Country))).sort();
  }, [rawData]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <Header currentView={view} setView={setView} hasData={!!analysis} />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        {view === 'upload' && (
          <div className="space-y-4">
             {comparisonBase && (
                <div className="bg-indigo-900/40 border border-indigo-500/50 p-4 rounded-lg text-center mb-6">
                    <p className="text-indigo-200 font-bold mb-2">正在进行对比模式</p>
                    <p className="text-sm text-indigo-300">
                        基准数据: <span className="text-white">{comparisonBase.fileName}</span>
                    </p>
                    <p className="text-sm text-indigo-300 mt-1">
                        请上传 <span className="text-white font-bold">新文件</span> 进行对比
                    </p>
                    <button 
                        onClick={() => { setComparisonBase(null); setView('history'); }}
                        className="mt-3 text-xs underline text-indigo-400 hover:text-white"
                    >
                        取消对比
                    </button>
                </div>
             )}
             <FileUpload onFileSelect={handleFileSelect} />
          </div>
        )}
        
        {view === 'settings' && (
          <Settings 
            config={config} 
            onSave={handleConfigSave} 
            detectedCountries={detectedCountries}
          />
        )}

        {view === 'history' && (
          <HistoryView 
            history={history} 
            onLoad={handleLoadHistory}
            onDelete={handleDeleteHistory}
            onCompare={handleInitCompare}
          />
        )}

        {view === 'dashboard' && analysis && (
          <div className="relative">
             <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white">当前分析: {currentFileName}</h2>
                    <p className="text-slate-400 text-sm">配置: {Object.values(config).flat().length} 个国家规则</p>
                </div>
                <button 
                    onClick={handleSaveData}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium shadow-lg shadow-emerald-900/20 transition-all"
                >
                    <Save size={18} />
                    保存数据
                </button>
             </div>
             <CoreMonitor data={analysis} />
          </div>
        )}

        {view === 'comparison' && comparisonBase && analysis && (
            <ComparisonView 
                baseData={comparisonBase.analysis}
                baseName={comparisonBase.fileName}
                newData={analysis}
                newName={currentFileName}
                config={config}
            />
        )}

        {view === 'trends' && (
           <TrendAnalysis trendData={trendData} />
        )}
      </main>
    </div>
  );
};

export default App;