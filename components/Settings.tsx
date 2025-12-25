import React, { useState, useEffect } from 'react';
import { Save, Check } from 'lucide-react';
import { CountryConfig } from '../types';

interface SettingsProps {
  config: CountryConfig;
  onSave: (config: CountryConfig) => void;
  detectedCountries: string[];
}

export const Settings: React.FC<SettingsProps> = ({ config, onSave, detectedCountries }) => {
  const [primary, setPrimary] = useState(config.primary.join(', '));
  const [secondary, setSecondary] = useState(config.secondary.join(', '));
  const [test, setTest] = useState(config.test.join(', '));

  const handleSave = () => {
    onSave({
      primary: primary.split(',').map(s => s.trim()).filter(s => s),
      secondary: secondary.split(',').map(s => s.trim()).filter(s => s),
      test: test.split(',').map(s => s.trim()).filter(s => s),
    });
  };

  // Helper to get array from string state
  const getArray = (str: string) => str.split(',').map(s => s.trim()).filter(s => s && s.length > 0);

  // Determine current category for a country name
  const getCategoryColor = (country: string) => {
    const p = getArray(primary).map(s => s.toLowerCase());
    const s = getArray(secondary).map(s => s.toLowerCase());
    const t = getArray(test).map(s => s.toLowerCase());
    const c = country.toLowerCase();

    if (p.includes(c)) return { label: 'Primary', class: 'bg-emerald-600 border-emerald-400 text-white' };
    if (s.includes(c)) return { label: 'Secondary', class: 'bg-amber-600 border-amber-400 text-white' };
    if (t.includes(c)) return { label: 'Test', class: 'bg-indigo-600 border-indigo-400 text-white' };
    return { label: 'Uncategorized', class: 'bg-slate-700 border-slate-600 text-slate-300' };
  };

  // Cycle category: Uncategorized -> Primary -> Secondary -> Test -> Uncategorized
  const cycleCategory = (country: string) => {
    const pArr = getArray(primary);
    const sArr = getArray(secondary);
    const tArr = getArray(test);

    const norm = country.toLowerCase();
    
    // Check where it is currently
    if (pArr.some(x => x.toLowerCase() === norm)) {
      // Primary -> Secondary
      setPrimary(pArr.filter(x => x.toLowerCase() !== norm).join(', '));
      setSecondary([...sArr, country].join(', '));
    } else if (sArr.some(x => x.toLowerCase() === norm)) {
      // Secondary -> Test
      setSecondary(sArr.filter(x => x.toLowerCase() !== norm).join(', '));
      setTest([...tArr, country].join(', '));
    } else if (tArr.some(x => x.toLowerCase() === norm)) {
      // Test -> Uncategorized
      setTest(tArr.filter(x => x.toLowerCase() !== norm).join(', '));
    } else {
      // Uncategorized -> Primary
      setPrimary([...pArr, country].join(', '));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h2 className="text-2xl font-bold text-white mb-6">国家分类规则配置</h2>
      <p className="text-slate-400 mb-8">
        在此处定义哪些国家属于哪个层级。您可以手动输入，或点击下方识别到的国家标签进行快速分类。
      </p>

      {/* Manual Input Section */}
      <div className="grid gap-6 mb-8">
        <div className="bg-slate-800/50 p-6 rounded-xl border border-emerald-500/30">
          <label className="block text-emerald-400 font-semibold mb-2">主要国家 (Primary - 高优先级)</label>
          <textarea 
            value={primary}
            onChange={e => setPrimary(e.target.value)}
            className="w-full h-20 bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm"
            placeholder="例如：美国, 英国, 德国..."
          />
        </div>

        <div className="bg-slate-800/50 p-6 rounded-xl border border-amber-500/30">
          <label className="block text-amber-400 font-semibold mb-2">次要国家 (Secondary - 增长型)</label>
          <textarea 
            value={secondary}
            onChange={e => setSecondary(e.target.value)}
            className="w-full h-20 bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-amber-500 text-sm"
            placeholder="例如：法国, 意大利, 西班牙..."
          />
        </div>

        <div className="bg-slate-800/50 p-6 rounded-xl border border-indigo-500/30">
          <label className="block text-indigo-400 font-semibold mb-2">测试国家 (Test - 实验性)</label>
          <textarea 
            value={test}
            onChange={e => setTest(e.target.value)}
            className="w-full h-20 bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 text-sm"
            placeholder="例如：印度, 巴西..."
          />
        </div>
      </div>

      {/* Interactive Quick Classify Section */}
      {detectedCountries.length > 0 && (
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 mb-8">
          <h3 className="text-lg font-bold text-white mb-4">快速分类 - 已识别国家 (点击切换)</h3>
          <p className="text-xs text-slate-400 mb-4">
            点击标签可切换分类: <span className="text-emerald-400">主要</span> &rarr; <span className="text-amber-400">次要</span> &rarr; <span className="text-indigo-400">测试</span> &rarr; <span className="text-slate-400">未分类</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {detectedCountries.map(country => {
              const style = getCategoryColor(country);
              return (
                <button
                  key={country}
                  onClick={() => cycleCategory(country)}
                  className={`px-3 py-1 rounded-full text-sm border transition-all hover:opacity-80 active:scale-95 ${style.class}`}
                >
                  {country}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex justify-end pt-4">
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-lg transition-all"
        >
          <Save size={20} />
          保存并重新计算
        </button>
      </div>
    </div>
  );
};