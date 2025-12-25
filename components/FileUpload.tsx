import React, { useRef } from 'react';
import { UploadCloud, FileSpreadsheet } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div 
        className="w-full max-w-xl p-12 bg-slate-800/50 border-2 border-dashed border-slate-600 rounded-2xl flex flex-col items-center text-center hover:border-emerald-500/50 hover:bg-slate-800 transition-all cursor-pointer group"
        onClick={() => inputRef.current?.click()}
      >
        <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
          <UploadCloud size={40} className="text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Upload Data File</h2>
        <p className="text-slate-400 mb-8">
          Drag & drop your Excel file here, or click to browse.<br/>
          <span className="text-sm opacity-70">Supports .xlsx, .xls</span>
        </p>
        
        <div className="bg-slate-900 rounded-lg p-4 text-left w-full border border-slate-700">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Expected Columns:</p>
          <div className="flex flex-wrap gap-2">
            {["Country", "Spend", "Impressions", "Clicks", "Leads", "L1+"].map(t => (
               <span key={t} className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded border border-slate-700">{t}</span>
            ))}
          </div>
        </div>
        
        <input 
          ref={inputRef} 
          type="file" 
          accept=".xlsx, .xls" 
          className="hidden" 
          onChange={handleChange} 
        />
      </div>

       <div className="mt-8 text-center text-slate-500 text-sm">
          <p>Don't have a file?</p>
          <button onClick={() => {
              // Create a mock file and pass it
              // This is a bit hacky for a pure frontend demo, but useful
              alert("Please upload a real Excel file to see the analysis.");
          }} className="text-emerald-400 hover:underline">
              Download Sample Template
          </button>
       </div>
    </div>
  );
};