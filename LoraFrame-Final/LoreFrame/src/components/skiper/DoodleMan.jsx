import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const DoodleMan = ({ className }) => {
  const containerCtrl = useAnimation();
  const bodyCtrl = useAnimation();
  const leftLegCtrl = useAnimation();
  const rightLegCtrl = useAnimation();
  const leftArmCtrl = useAnimation();
  const rightArmCtrl = useAnimation();
  const headCtrl = useAnimation();
  const groundCtrl = useAnimation();

  useEffect(() => {
    const sequence = async () => {
      while (true) {
        // --- RESET POSITIONS ---
        groundCtrl.set({ x: 0 });
        containerCtrl.set({ x: -50 }); // Start slightly left

        // --- LOOKING (0s - 2s) ---
        await Promise.all([
          bodyCtrl.start({ rotate: 0, y: 0, transition: { duration: 0.5 } }),
          leftLegCtrl.start({ d: "M 50 90 L 50 130", transition: { duration: 0.5 } }),
          rightLegCtrl.start({ d: "M 50 90 L 50 130", transition: { duration: 0.5 } }),
          rightArmCtrl.start({ d: "M 50 55 Q 75 55 80 30 L 65 20", transition: { duration: 0.5 } }), 
          leftArmCtrl.start({ d: "M 50 55 L 30 80", transition: { duration: 0.5 } }),
          headCtrl.start({ rotate: 0, transition: { duration: 0.5 } }),
        ]);

        await headCtrl.start({ 
          rotate: [0, 10, -10, 0], 
          transition: { duration: 1.5, ease: "easeInOut" } 
        });

        // --- RUNNING (2s - 6s) ---
        await bodyCtrl.start({ rotate: 15, y: -5, transition: { duration: 0.3 } });

        const runDuration = 0.3;
        
        // Loop Run Cycle
        leftLegCtrl.start({ 
          d: ["M 50 90 Q 30 110 20 100", "M 50 90 Q 60 110 50 130", "M 50 90 Q 80 80 80 100"],
          transition: { repeat: 12, duration: runDuration, ease: "linear" }
        });
        rightLegCtrl.start({ 
          d: ["M 50 90 Q 80 80 80 100", "M 50 90 Q 30 110 20 100", "M 50 90 Q 60 110 50 130"],
          transition: { repeat: 12, duration: runDuration, ease: "linear" }
        });
        rightArmCtrl.start({ 
          d: ["M 50 55 L 20 70", "M 50 55 L 80 40"], 
          transition: { repeat: 12, repeatType: "mirror", duration: runDuration / 2 } 
        });
        leftArmCtrl.start({ 
          d: ["M 50 55 L 80 40", "M 50 55 L 20 70"], 
          transition: { repeat: 12, repeatType: "mirror", duration: runDuration / 2 } 
        });

        // Move Ground (Fast) & Man (Slowly across width)
        groundCtrl.start({ x: -600, transition: { duration: 4, ease: "linear" } });
        await containerCtrl.start({ x: 150, transition: { duration: 4, ease: "easeInOut" } });

        // --- STOP & POINT (6s - 8s) ---
        leftLegCtrl.stop(); rightLegCtrl.stop(); leftArmCtrl.stop(); rightArmCtrl.stop();

        await Promise.all([
          bodyCtrl.start({ rotate: [15, -5, 0], y: 0, transition: { duration: 0.6, type: "spring" } }),
          leftLegCtrl.start({ d: "M 50 90 L 30 130", transition: { duration: 0.4 } }), 
          rightLegCtrl.start({ d: "M 50 90 L 70 130", transition: { duration: 0.4 } }),
          leftArmCtrl.start({ d: "M 50 55 L 20 60", transition: { duration: 0.4 } }),
          rightArmCtrl.start({ d: "M 50 55 L 80 60", transition: { duration: 0.4 } }) // Arms out balance
        ]);

        await Promise.all([
          rightArmCtrl.start({ d: "M 50 55 L 60 110", transition: { duration: 0.4 } }), // Point down
          headCtrl.start({ y: 5, rotate: 10, transition: { duration: 0.4 } })
        ]);

        await new Promise(r => setTimeout(r, 2000));
      }
    };
    sequence();
  }, []);

  return (
    <div className={cn("flex items-center justify-center overflow-hidden relative", className)}>
      <svg 
        viewBox="0 0 300 150" 
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full overflow-visible"
        style={{ filter: "url(#turbulence-paper)" }}
      >
        <defs>
          <filter id="turbulence-paper">
            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="5" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
          </filter>
        </defs>

        {/* Ground */}
        <motion.g animate={groundCtrl}>
           <line x1="-1000" y1="130" x2="2000" y2="130" stroke="#27272A" strokeWidth="2" strokeLinecap="round" />
           {/* Details moving by */}
           <path d="M 50 130 L 60 120 L 70 130" fill="none" stroke="#27272A" strokeWidth="2" />
           <path d="M 250 130 L 255 125 L 260 130" fill="none" stroke="#27272A" strokeWidth="2" />
           <path d="M 450 130 L 460 115 L 470 130" fill="none" stroke="#27272A" strokeWidth="2" />
        </motion.g>

        {/* Character Container */}
        <motion.g animate={containerCtrl} initial={{ x: -50 }}>
          <motion.g animate={bodyCtrl} style={{ originX: "50px", originY: "90px" }}>
            <motion.path animate={leftLegCtrl} stroke="#E4E4E7" strokeWidth="4" strokeLinecap="round" fill="none" />
            <motion.path animate={rightLegCtrl} stroke="#E4E4E7" strokeWidth="4" strokeLinecap="round" fill="none" />
            <line x1="50" y1="90" x2="50" y2="45" stroke="#E4E4E7" strokeWidth="4" strokeLinecap="round" />
            <motion.g animate={headCtrl} style={{ originX: "50px", originY: "45px" }}>
               <circle cx="50" cy="30" r="14" stroke="#E4E4E7" strokeWidth="3" fill="#111111" />
            </motion.g>
            <motion.path animate={leftArmCtrl} stroke="#E4E4E7" strokeWidth="3" strokeLinecap="round" fill="none" />
            <motion.path animate={rightArmCtrl} stroke="#E4E4E7" strokeWidth="3" strokeLinecap="round" fill="none" />
          </motion.g>
        </motion.g>
      </svg>
    </div>
  );
};

export default DoodleMan;