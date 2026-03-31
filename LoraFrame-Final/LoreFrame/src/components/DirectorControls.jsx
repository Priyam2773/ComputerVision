import { useStudio } from '../Context/StudioContext';
import { Sparkles, Send, Eraser, Keyboard, Zap } from 'lucide-react';
import { useRef } from 'react';

const DirectorControls = () => {
  
  const { 
    prompt, 
    setPrompt, 
    generateScene, 
    isGenerating 
  } = useStudio();

  const textareaRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (!isGenerating && prompt?.trim()) {
        generateScene();
      }
    }
  };

  const handleClear = () => {
    setPrompt("");
    textareaRef.current?.focus();
  };

  return (
    <div className="bg-slate-950/80 backdrop-blur-xl border-t border-slate-800 p-5 relative z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
      <div className="max-w-5xl mx-auto flex flex-col gap-2">
        
        {/* Input Wrapper */}
        <div className="relative group flex gap-3 items-stretch">
          
          {/* Neural Icon Decorator */}
          <div className="absolute left-4 top-4 text-blue-500 pointer-events-none">
            <Sparkles size={18} className={isGenerating ? "animate-pulse" : ""} />
          </div>

          <textarea 
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isGenerating}
            placeholder="Describe the scene (e.g., Maya walking through a neon-lit rain, cyberpunk style, cinematic lighting...)"
            className="flex-1 bg-slate-900/50 border border-slate-700 rounded-2xl pl-12 pr-12 py-4 text-sm text-slate-200 placeholder:text-slate-600 focus:ring-2 focus:ring-blue-600/50 focus:border-blue-500 outline-none resize-none h-16 transition-all focus:h-24 focus:bg-slate-900 custom-scrollbar shadow-inner"
          />

          {/* Clear Button (Visible only when text exists) */}
          {prompt && !isGenerating && (
            <button 
              onClick={handleClear}
              className="absolute right-[140px] top-4 text-slate-600 hover:text-red-400 transition-colors"
              title="Clear Prompt"
            >
              <Eraser size={16} />
            </button>
          )}

          {/* Action Button */}
          <button 
            onClick={generateScene}
            disabled={isGenerating || !prompt?.trim()}
            className="w-32 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-2xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/25 active:scale-95 flex flex-col items-center justify-center gap-1"
          >
            {isGenerating ? (
              <>
                <Zap size={18} className="animate-bounce" />
                <span className="text-[10px] tracking-widest uppercase">Thinking</span>
              </>
            ) : (
              <>
                <Send size={18} />
                <span className="text-[10px] tracking-widest uppercase">Generate</span>
              </>
            )}
          </button>
        </div>

        {/* Footer: Hints & Stats */}
        <div className="flex justify-between items-center px-2 text-[10px] text-slate-500 font-mono uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <Keyboard size={12} />
            <span>Shortcut: <span className="text-slate-300">Ctrl + Enter</span></span>
          </div>
          <div>
            {prompt?.length || 0} Chars
          </div>
        </div>

      </div>
    </div>
  );
};

export default DirectorControls;