import { useStudio } from '../Context/StudioContext';
import { useEffect, useRef } from 'react';
import { Terminal, Cpu, Database } from 'lucide-react';
import {useNavigate} from "react-router-dom";

export default function TechHUD() {
  const { logs, isGenerating } = useStudio();
  const logEndRef = useRef(null);
  const navigate = useNavigate();

  // Auto-scroll to the latest log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="flex items-center gap-6 bg-slate-950/50 border border-slate-800 px-4 py-2 rounded-xl">
      
      {/* System Status Indicators */}
      <div className="hidden md:flex items-center gap-4 border-r border-slate-800 pr-6">
        <div className="flex items-center gap-2">
          <Database size={14} className={isGenerating ? "text-blue-500 animate-pulse" : "text-slate-500"} />
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Memory: Active</span>
        </div>
        <div className="flex items-center gap-2">
          <Cpu size={14} className={isGenerating ? "text-green-500 animate-spin-slow" : "text-slate-500"} />
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">GPU: {isGenerating ? 'Computing' : 'Idle'}</span>
        </div>
      </div>

      {/* Scrolling Log Terminal */}
      <div className="w-64 h-8 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-transparent to-slate-950 z-10 pointer-events-none" />
        <div className="flex flex-col gap-1">
          {logs.map((log, i) => (
            <div key={i} className="text-[10px] font-mono text-blue-400/80 whitespace-nowrap overflow-hidden text-ellipsis">
              <span className="text-slate-600 mr-2">»</span>
              {log}
              {i === 0 && <span className="ml-1 inline-block w-1 h-3 bg-blue-500 animate-pulse" />}
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      </div>

      {/* Terminal Icon */}
      <div className={`p-1.5 rounded-md ${isGenerating ? 'bg-blue-500/20 text-blue-500' : 'bg-slate-800 text-slate-500'}`}>
        {/* <Terminal size={16} /> */}
        <button onClick={() => navigate("/auth")} className = "cursor-pointer">
          Login
        </button>
      </div>
    </div>
  );
}