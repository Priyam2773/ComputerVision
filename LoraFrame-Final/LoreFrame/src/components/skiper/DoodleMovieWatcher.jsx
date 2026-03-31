import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';

const DoodleMovieWatcher = () => {
  const leftArmCtrl = useAnimation(); 
  const rightArmCtrl = useAnimation(); 
  const headCtrl = useAnimation();
  const bodyCtrl = useAnimation();
  const popcornCtrl = useAnimation();
  const lightCtrl = useAnimation();

  useEffect(() => {
    const playMovie = async () => {
      // Screen Flicker Loop
      lightCtrl.start({
        opacity: [0.1, 0.3, 0.1, 0.4, 0.2],
        scale: [1, 1.05, 1, 1.02, 1],
        transition: { duration: 2, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }
      });

      while (true) {
        // WATCHING
        await Promise.all([
          bodyCtrl.start({ y: [0, 1, 0], transition: { duration: 2, ease: "easeInOut" } }),
          rightArmCtrl.start({ d: "M 50 60 Q 60 70 65 85", transition: { duration: 0.5 } }),
        ]);

        // EATING
        for (let i = 0; i < 2; i++) {
          await rightArmCtrl.start({ d: "M 50 60 Q 60 70 65 85", transition: { duration: 0.3 } });
          await rightArmCtrl.start({ d: "M 50 60 Q 70 50 55 40", transition: { duration: 0.3 } });
          headCtrl.start({ rotate: [0, -5, 0], transition: { duration: 0.2 } });
          await new Promise(r => setTimeout(r, 200));
        }

        // LAUGHING
        bodyCtrl.start({ rotate: -5, y: 0, transition: { duration: 0.3 } });
        headCtrl.start({ rotate: -15, y: -2, transition: { duration: 0.3 } });
        bodyCtrl.start({ x: [-1, 1, -1, 1, 0], transition: { duration: 0.5, repeat: 2 } });
        leftArmCtrl.start({ rotate: [0, -5, 0], transition: { duration: 0.5, repeat: 2 } });
        rightArmCtrl.start({ d: "M 50 60 Q 80 40 90 60", transition: { duration: 0.5 } }); 

        popcornCtrl.start({ 
          opacity: [0, 1, 0], y: [0, -30, 10], x: [0, 10, 20], rotate: [0, 180],
          transition: { duration: 0.8, ease: "easeOut" }
        });

        await new Promise(r => setTimeout(r, 2000));

        // RESET
        await Promise.all([
          bodyCtrl.start({ rotate: 0, x: 0, transition: { duration: 0.5 } }),
          headCtrl.start({ rotate: 0, y: 0, transition: { duration: 0.5 } }),
          rightArmCtrl.start({ d: "M 50 60 Q 60 70 65 85", transition: { duration: 0.5 } }),
        ]);
      }
    };
    playMovie();
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden relative">
      {/* Screen Glow */}
      <motion.div 
        animate={lightCtrl}
        className="absolute top-0 right-0 w-full h-full pointer-events-none"
        style={{ background: "radial-gradient(circle at 80% 30%, rgba(59, 130, 246, 0.15) 0%, transparent 60%)" }}
      />

      <svg 
        viewBox="0 0 150 150" 
        // Changed to 'slice' so it covers the whole box like a background image
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full overflow-visible opacity-50" // Lower opacity so text pops
        style={{ filter: "url(#turbulence-doodle)" }} 
      >
        <defs>
          <filter id="turbulence-doodle">
            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="4" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
          </filter>
        </defs>

        {/* Beanbag */}
        <path d="M 20 130 Q 10 90 40 80 Q 90 70 100 110 Q 110 140 20 130" fill="none" stroke="#3F3F46" strokeWidth="3" strokeLinecap="round"/>

        {/* Viewer Group */}
        <motion.g animate={bodyCtrl} style={{ originX: "50px", originY: "100px" }}>
          {/* Legs */}
          <path d="M 50 100 Q 70 90 90 105" stroke="#E4E4E7" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M 50 100 Q 65 85 85 95" stroke="#E4E4E7" strokeWidth="4" strokeLinecap="round" fill="none" />
          {/* Torso */}
          <path d="M 50 100 C 40 90 40 70 50 50" stroke="#E4E4E7" strokeWidth="4" strokeLinecap="round" fill="none" />

          {/* Head */}
          <motion.g animate={headCtrl} style={{ originX: "50px", originY: "40px" }}>
             <circle cx="50" cy="35" r="14" stroke="#E4E4E7" strokeWidth="3" fill="#111111" />
             <circle cx="56" cy="32" r="1.5" fill="#E4E4E7" />
             <path d="M 52 40 Q 56 43 60 40" stroke="#E4E4E7" strokeWidth="2" fill="none" />
          </motion.g>

          {/* Arms & Bucket */}
          <motion.path animate={leftArmCtrl} d="M 50 60 Q 40 70 55 85" stroke="#E4E4E7" strokeWidth="3" strokeLinecap="round" fill="none" />
          <motion.g animate={leftArmCtrl} style={{ originX: "55px", originY: "85px" }}>
             <path d="M 50 85 L 55 105 L 75 105 L 80 85 Z" stroke="#3B82F6" strokeWidth="2" fill="#111111" />
             <path d="M 52 85 Q 65 75 78 85" stroke="#E4E4E7" strokeWidth="1" fill="none" />
          </motion.g>
          <motion.path animate={rightArmCtrl} d="M 50 60 Q 60 70 65 85" stroke="#E4E4E7" strokeWidth="3" strokeLinecap="round" fill="none" />
        </motion.g>

        {/* Popcorn Particles */}
        <motion.g animate={popcornCtrl} initial={{ opacity: 0 }}>
           <circle cx="65" cy="50" r="2" fill="#facc15" />
           <circle cx="70" cy="45" r="2" fill="#facc15" />
           <circle cx="60" cy="55" r="1.5" fill="#facc15" />
        </motion.g>
      </svg>
    </div>
  );
};

export default DoodleMovieWatcher;