import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const DoodleTv = () => {
  const [scene, setScene] = useState(0);

  const scenes = [
    { id: 0, color: "#000000", label: "STANDBY", glow: "#3b82f6" },
    { id: 1, color: "#22d3ee", label: "4K AQUA", glow: "#22d3ee" },
    { id: 2, color: "#fbbf24", label: "HDR DESERT", glow: "#fbbf24" },
    { id: 3, color: "#ef4444", label: "BOOST MODE", glow: "#ef4444" },
    { id: 4, color: "#a855f7", label: "SMART HUB", glow: "#a855f7" },
  ];

 

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-transparent font-sans">
      <div className="relative w-80 h-96 flex items-center justify-center">
        
        {/* Dynamic Ambilight Effect (Backlight) */}
        <motion.div
          className="absolute left-10 w-24 h-64 blur-[80px] rounded-full opacity-60"
          animate={{ backgroundColor: scenes[scene].glow }}
          transition={{ duration: 1 }}
        />

        {/* --- THE MODERN TV PROFILE --- */}
        <motion.div
          className="relative w-32 h-52 z-10 flex flex-col items-center"
          animate={
            scene === 3 
              ? { y: [0, -10, -1000], rotate: [2, -2, 2, 0] } 
              : scene === 4 
              ? { y: [-1000, 0], scale: [0.9, 1] } 
              : { y: 0, rotate: 2 } // Subtle 2-degree tilt common in modern stands
          }
          transition={{ type: "spring", stiffness: 50, damping: 15 }}
        >
          <svg viewBox="0 0 100 200" className="w-full h-full drop-shadow-xl">
            {/* The Ultra-Thin Panel */}
            <rect x="40" y="10" width="6" height="150" rx="1" fill="#0a0a0a" />
            
            {/* The "Brain" Box (Lower back part where ports are) */}
            <rect x="46" y="80" width="10" height="70" rx="2" fill="#171717" />

            {/* Glowing Screen Edge (Front) */}
            <motion.rect
              x="48" y="15" width="5" height="150" rx="1"
              animate={{ 
                fill: scenes[scene].color === "#000000" ? "#171717" : scenes[scene].color,
                opacity: [0.9, 1.2, 0.9]
              }}
              transition={{ repeat: Infinity, duration: 2 }}
            />

            {/* Modern Central Stand (Y-Shape or Neck) */}
          

            {/* Tiny Status LED */}
            <motion.circle 
              cx="43" cy="155" r="1" 
              animate={{ opacity: scene === 0 ? [0.3, 1, 0.3] : 1 }}
              fill={scene === 0 ? "red" : "#22c55e"} 
            />
          </svg>

          {/* Minimalist Floating UI (Floating next to TV) */}
        
        </motion.div>

        {/* Floor Reflection */}
        <motion.div 
          className="absolute bottom-10 w-48 h-8 bg-black/20 rounded-full blur-xl -z-10"
          animate={{ scale: scene === 3 ? 0 : 1 }}
        />
      </div>

      {/* Modern Remote Style Buttons */}
      <div className="mt-4 flex gap-4 p-2 bg-neutral-900/50 rounded-full border border-white/5">
        {scenes.map((s) => (
          <button
            key={s.id}
            onClick={() => setScene(s.id)}
            className={`h-2 w-2 rounded-full transition-all duration-500 ${scene === s.id ? 'bg-blue-500 shadow-[0_0_10px_#3b82f6]' : 'bg-neutral-600'}`}
          />
        ))}
      </div>
    </div>
  );
};

export default DoodleTv;