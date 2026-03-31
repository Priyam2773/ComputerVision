import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Activity, Layers, MoreHorizontal, X,
  Cpu, HardDrive, ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Import your existing components
import CastLocker from './components/CastLocker';
import DirectorPanel from './components/DirectorPanel';
import Timeline from './components/Timeline';
import DoodleMan from './components/skiper/DoodleMan'; // Ensure this path matches your folder structure

// --- UTILITY ---
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// ------------------------------------------------------------------
// 🎛️ COMPONENT: TechHUD (Skiper 23 Implementation with Fixes)
// ------------------------------------------------------------------
const TechHUD = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsExpanded(false);
      }
    };
    if (isExpanded) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isExpanded]);

  return (
    <div className="relative" ref={containerRef}>

      {/* 1. Trigger / Collapsed State (Always Visible Placeholders) */}
      {!isExpanded && (
        <motion.div
          layoutId="techHud"
          onClick={() => setIsExpanded(true)}
          className="h-10 rounded-full px-4 flex items-center justify-center bg-[#1C1C1E] border border-zinc-800 cursor-pointer hover:border-zinc-700 transition-colors"
        >
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>SYSTEM ONLINE</span>
            <span className="text-zinc-600">|</span>
            <span className="text-white font-bold">1,024 CR</span>
          </div>
        </motion.div>
      )}

      {/* 2. Expanded State (Absolute Positioned Overlay) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            layoutId="techHud"
            className="absolute top-0 right-0 z-[100] w-[340px] bg-[#1C1C1E] border border-zinc-800 rounded-[32px] overflow-hidden shadow-2xl p-2"
          >
            <div className="flex flex-col gap-2">
              {/* Header */}
              <div className="flex justify-between items-center px-4 pt-3 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-500/10 rounded-lg">
                    <Activity size={14} className="text-blue-500" />
                  </div>
                  <span className="text-sm font-bold text-white tracking-tight">Resource Monitor</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
                  className="p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Grid of Cards */}
              <div className="grid grid-cols-2 gap-2 p-1">

                {/* Card 1: Credits */}
                <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl p-4 flex flex-col justify-between h-28 relative overflow-hidden group">
                  <div className="absolute top-2 right-2 opacity-50"><MoreHorizontal size={16} className="text-white" /></div>
                  <Zap className="text-white/90 mb-2" size={20} fill="currentColor" />
                  <div>
                    <p className="text-xs font-medium text-white/80">Neural Credits</p>
                    <p className="text-xl font-bold text-white">1.03k</p>
                  </div>
                </div>

                {/* Card 2: Storage */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between h-28 relative group">
                  <div className="absolute top-2 right-2 text-zinc-600"><MoreHorizontal size={16} /></div>
                  <HardDrive className="text-zinc-400 mb-2" size={20} />
                  <div>
                    <p className="text-xs font-medium text-zinc-500">Storage</p>
                    <p className="text-xl font-bold text-zinc-200">25.8 GB</p>
                  </div>
                  <div className="w-full h-1 bg-zinc-800 rounded-full mt-2 overflow-hidden">
                    <div className="h-full w-[40%] bg-white rounded-full" />
                  </div>
                </div>

                {/* Card 3: GPU */}
                <div className="bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl p-4 flex flex-col justify-between h-28 relative">
                  <div className="absolute top-2 right-2 opacity-50"><MoreHorizontal size={16} className="text-white" /></div>
                  <Cpu className="text-white/90 mb-2" size={20} />
                  <div>
                    <p className="text-xs font-medium text-white/80">GPU Status</p>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      <p className="text-sm font-bold text-white">Active</p>
                    </div>
                  </div>
                </div>

                {/* Card 4: Jobs */}
                <div className="bg-[#3B82F6] rounded-2xl p-4 flex flex-col justify-between h-28 relative">
                  <div className="absolute top-2 right-2 opacity-50"><MoreHorizontal size={16} className="text-white" /></div>
                  <Layers className="text-white/90 mb-2" size={20} />
                  <div>
                    <p className="text-xs font-medium text-white/80">Queue</p>
                    <p className="text-xl font-bold text-white">0 Jobs</p>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ------------------------------------------------------------------
// 🎬 MAIN LAYOUT: StudioDashboard
// ------------------------------------------------------------------
export default function StudioDashboard() {
  return (
    // Outer Container: Forces full viewport height and prevents page scroll
    <div className="flex h-screen w-screen bg-transparent text-slate-200 font-sans overflow-hidden">

      {/* Left Sidebar: Fixed width */}
      <CastLocker />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative h-full min-w-0">

        {/* --- HEADER --- */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="shrink-0 h-16 px-6 border-b border-zinc-900 bg-[#111111]/50 backdrop-blur-md z-50 flex items-center gap-4"
        >

          {/* 1. Left: Brand */}
          <Link to="/" className="flex items-center gap-2 group cursor-pointer text-zinc-400 hover:text-white transition-colors">
            <div className="p-2 rounded-lg bg-zinc-800/50 group-hover:bg-zinc-700/50 transition-colors">
              <ArrowLeft size={18} />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm leading-none">Lora<span className="text-blue-500">Frame</span></span>
              <span className="text-[10px] text-zinc-500">Dashboard</span>
            </div>
          </Link>
          {/* 2. Middle: Doodle Animation (Full Width of available space) */}
          {/* Constrained height (h-14) ensures it fits in header without pushing layout */}
          <div className="flex-1 h-14 relative overflow-hidden flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity duration-500">
            <DoodleMan className="w-full h-full" />
          </div>

          {/* 3. Right: Tech HUD */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="shrink-0"
          >
            <TechHUD />
          </motion.div>

        </motion.header>

        {/* Scrollable Timeline Area */}
        <div className="flex-1 min-h-0 relative z-10">
          <Timeline />
        </div>

        {/* Bottom Input Area */}
        <div className="shrink-0 w-full z-30 bg-gradient-to-t from-[#111111] via-[#111111]/90 to-transparent pt-4">
          <DirectorPanel />
        </div>

      </main>
    </div>
  );
}