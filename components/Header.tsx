import React from 'react';
import { BarChart3, Settings, UploadCloud, FileClock } from 'lucide-react';

interface HeaderProps {
  currentView: 'dashboard' | 'trends' | 'settings' | 'upload' | 'history' | 'comparison';
  setView: (view: 'dashboard' | 'trends' | 'settings' | 'upload' | 'history' | 'comparison') => void;
  hasData: boolean;
}

export const Header: React.FC<HeaderProps> = ({ currentView, setView, hasData }) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-700 bg-slate-900/95 backdrop-blur">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 text-emerald-400 cursor-pointer" onClick={() => setView(hasData ? 'dashboard' : 'upload')}>
          <BarChart3 size={28} />
          <span className="text-xl font-bold tracking-tight text-white hidden sm:block">
            P4P Data Monitor
          </span>
        </div>
        
        <nav className="flex items-center gap-2">
          {hasData && (
            <>
               <button 
                onClick={() => setView('dashboard')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentView === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
              >
                Core Monitor
              </button>
              <button 
                onClick={() => setView('trends')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentView === 'trends' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
              >
                Trends
              </button>
            </>
          )}

          <button 
            onClick={() => setView('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentView === 'history' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            title="Saved History"
          >
            <FileClock size={18} />
            <span className="hidden md:inline">History</span>
          </button>
          
          <button 
            onClick={() => setView('settings')}
            className={`p-2 rounded-lg transition-colors ${currentView === 'settings' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-white'}`}
            title="Country Categories"
          >
            <Settings size={20} />
          </button>
           <button 
            onClick={() => setView('upload')}
            className={`p-2 rounded-lg transition-colors ${currentView === 'upload' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-white'}`}
            title="Upload New Data"
          >
            <UploadCloud size={20} />
          </button>
        </nav>
      </div>
    </header>
  );
};