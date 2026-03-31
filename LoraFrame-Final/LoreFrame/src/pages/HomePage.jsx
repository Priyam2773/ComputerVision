import React from 'react';
import { StudioProvider } from '../Context/StudioContext.jsx';
import { ToastContainer } from 'react-toastify';

import StudioDashboard from '../StudioDashboard';

// You might need to install 'lucide-react' if not already present for icons used in StudioDashboard
// npm install lucide-react

function HomePage() {
  return (
    <StudioProvider>
 
      <ToastContainer 
        className="z-[9999]" 
        position="top-right"
        autoClose={3000}
        theme="dark"
        limit={3} // Prevents screen clutter if too many errors occur
      />

      {/* Main Background Container */}
      {/* Updated background to a dark mode gradient as per the request */}
      <div className="h-screen w-screen relative overflow-hidden bg-[#111111] text-zinc-200 font-sans selection:bg-blue-500/30">
        
        {/* Background Effects Layer - Optional visual enhancement */}
        <div className="absolute inset-0 z-0 pointer-events-none">
           <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px]" />
           <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/5 blur-[120px]" />
        </div>

        {/* Content Layer */}
        <div className="relative z-10 h-full w-full">
          <StudioDashboard />
        </div>
        
      </div>
    </StudioProvider>
  );
}

export default HomePage;