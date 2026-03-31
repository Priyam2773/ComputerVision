import { useState, useEffect, useRef } from 'react';
import { useStudio } from '../Context/StudioContext';
import { Sparkles, Send, History, Eraser, Keyboard, Zap, AlertCircle, Video } from 'lucide-react';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import HistoryModal from "./HistoryModal";
import "./DirectorPanel.css";

// 1. Define the Camera Options Data
const CAMERA_OPTIONS = [
  {
    label: "Eye-Level",
    value: "The camera is positioned at the subject’s eye height, creating a neutral and balanced perspective. This shot feels natural and objective, often used in dialogue scenes to foster realism and emotional connection without visual bias.",
    desc: "The camera is positioned at the subject’s eye height, creating a neutral and balanced perspective. This shot feels natural and objective, often used in dialogue scenes to foster realism and emotional connection without visual bias."
  },
  {
    label: "High Angle",
    value: "The camera is placed above the subject and angled downward. This perspective can make the subject appear smaller, weaker, or more vulnerable, often reinforcing themes of fear, submission, or loss of control.",
    desc: "The camera is placed above the subject and angled downward. This perspective can make the subject appear smaller, weaker, or more vulnerable, often reinforcing themes of fear, submission, or loss of control."
  },
  {
    label: "Low Angle",
    value: "The camera is positioned below the subject and angled upward. This shot emphasizes power, dominance, authority, or confidence, commonly used to elevate heroes, villains, or moments of triumph.",
    desc: "The camera is positioned below the subject and angled upward. This shot emphasizes power, dominance, authority, or confidence, commonly used to elevate heroes, villains, or moments of triumph."
  },
  {
    label: "Bird’s-Eye View",
    value: "The camera looks straight down from directly above the subject. This angle creates a detached, god-like perspective and is often used to reveal spatial relationships, patterns, chaos, or isolation within a scene.",
    desc: "The camera looks straight down from directly above the subject. This angle creates a detached, god-like perspective and is often used to reveal spatial relationships, patterns, chaos, or isolation within a scene."
  },
  {
    label: "Worm’s-Eye View",
    value: "The camera is placed extremely low, often near ground level, looking upward. This exaggerated perspective amplifies height and scale, making subjects appear towering, imposing, or overwhelming.",
    desc: "The camera is placed extremely low, often near ground level, looking upward. This exaggerated perspective amplifies height and scale, making subjects appear towering, imposing, or overwhelming."
  },
  {
    label: "Dutch Angle",
    value: "The camera is deliberately tilted off its horizontal axis. This technique introduces visual imbalance and is commonly used to convey psychological tension, disorientation, instability, or unease.",
    desc: "The camera is deliberately tilted off its horizontal axis. This technique introduces visual imbalance and is commonly used to convey psychological tension, disorientation, instability, or unease."
  },
  {
    label: "Over-the-Shoulder",
    value: "The camera is positioned behind one character, partially framing their shoulder while focusing on another subject. This shot is frequently used in conversations to establish spatial relationships and emotional dynamics between characters.",
    desc: "The camera is positioned behind one character, partially framing their shoulder while focusing on another subject. This shot is frequently used in conversations to establish spatial relationships and emotional dynamics between characters."
  },
  {
    label: "Point-of-View",
    value: "The camera adopts the visual perspective of a character, showing what they see. This approach immerses the audience directly into the character’s experience, enhancing identification and emotional engagement.",
    desc: "The camera adopts the visual perspective of a character, showing what they see. This approach immerses the audience directly into the character’s experience, enhancing identification and emotional engagement."
  },
  {
    label: "Oblique Angle",
    value: "The camera is positioned at a slight diagonal without a pronounced tilt. This subtle deviation from standard framing introduces mild visual tension or unease while maintaining a grounded, realistic feel.",
    desc: "The camera is positioned at a slight diagonal without a pronounced tilt. This subtle deviation from standard framing introduces mild visual tension or unease while maintaining a grounded, realistic feel."
  }
];


function RollingText({
  text = "ROLLING TEXT",
  speed = 0.05,
  duration = 0.5,
  className,
}) {
  const letters = text.split("");
  const centerIndex = Math.floor(letters.length / 2);

  return (
    <div className={cn("relative flex overflow-hidden", className)}>
      <span className="sr-only">{text}</span>
      {letters.map((letter, i) => {
        const distance = Math.abs(i - centerIndex);
        const delay = distance * speed;

        return (
          <motion.span
            key={`${text}-${i}`}
            initial={{ y: "100%", opacity: 0, rotateX: 90 }}
            animate={{ y: 0, opacity: 1, rotateX: 0 }}
            transition={{
              duration: duration,
              delay: delay,
              ease: [0.33, 1, 0.68, 1],
              type: "spring",
              stiffness: 100,
              damping: 20
            }}
            className="inline-block transform-style-3d origin-bottom"
          >
            {letter === " " ? "\u00A0" : letter}
          </motion.span>
        );
      })}
    </div>
  );
}

export default function DirectorPanel() {
  const {
    generateStoryboard,
    isGenerating,
    setPrompt,
    prompt: globalPrompt,
    userData,
    selectedCharacterId,
    Type,
    setType,
  } = useStudio();

  // Local state synced with global prompt
  const [input, setInput] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const textareaRef = useRef(null);

  // 🔄 Sync local input if global prompt changes 
  useEffect(() => {
    if (globalPrompt) setInput(globalPrompt);
  }, [globalPrompt]);

  // ⌨️ Handle Keyboard Shortcuts
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const handleClear = () => {
    setInput("");
    setPrompt(""); // Clear global as well
    textareaRef.current?.focus();
  };

  // 🎬 NEW: Handle Camera Suggestion Click
  const handleSuggestion = (value) => {
    // If input is empty, just set value. If not, add space then value.
    const newValue = input.trim().length === 0 ? value : `${input} ${value}`;

    setInput(newValue);
    setPrompt(newValue);

    // Focus back on text area so user can keep typing
    textareaRef.current?.focus();
  };

  const handleGenerate = async () => {
    if (!input.trim()) return;

    if (!selectedCharacterId) {
      toast.error("Please select a character from the locker first!");
      return;
    }

    const selectedCharacter = userData.find(
      (char) => char.id === selectedCharacterId
    );

    if (!selectedCharacter) {
      toast.error("Selected character data not found.");
      return;
    }

    setPrompt(input);

    try {
      await generateStoryboard({
        prompt: input,
        character: selectedCharacter
      });
    } catch (error) {
      console.error("Generation failed:", error);
      toast.error("Failed to generate storyboard.");
    }
  };

  return (
    <div className="p-4 sm:p-6 border-t bg-[#111111] border-zinc-900 relative z-10" >

      <div className="max-w-5xl mx-auto flex flex-col gap-2">

        {/* 🎬 NEW: Camera Suggestions Bar */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2 no-scrollbar mask-gradient">
          <div className="flex items-center gap-1 text-zinc-500 text-xs font-bold uppercase tracking-wider px-2 shrink-0">
            <Video size={12} />
            <span>Angles</span>
          </div>
          {CAMERA_OPTIONS.map((option) => (
            <motion.button
              key={option.label}
              onClick={() => handleSuggestion(option.value)}
              title={option.desc}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="
    shrink-0 relative px-3 py-1.5 text-xs text-zinc-400 font-medium transition-all overflow-hidden rounded-md group
    bg-zinc-900/50 border border-zinc-800/50 hover:border-blue-500/50 hover:text-zinc-100 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)]
  "
            >
              <span className="relative z-10">{option.label}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            </motion.button>
          ))}
        </div>

        {/* Input Container */}

        <div className="relative group flex gap-3 items-stretch bg-[#1C1C1E] border border-zinc-800 rounded-2xl p-2 backdrop-blur-xl shadow-2xl hover:border-zinc-700 transition-colors z-0 items-center ">

          {/* Dropdown/Select (Iska z-index high rakha hai taaki ye hamesha upar rahe) */}
          <select
            className="bg-blue-400 outline-none cursor-pointer rounded-xl pl-4 pr-3 text-black font-medium h-12 flex items-center justify-center relative z-20 mt-2"
            value={Type}
            onChange={(e) => setType(e.target.value === "true")}
          >
            <option value="true">Image</option>
            <option value="false">Video</option>
          </select>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setPrompt(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            disabled={isGenerating}
            placeholder={selectedCharacterId
              ? "Script your scene..."
              : "⚠️ Select a character to start scripting..."}
            className="flex-1 bg-transparent px-4 py-3 resize-none outline-none text-zinc-200 placeholder:text-zinc-600 text-sm h-16 custom-scrollbar transition-all"
          />

          {/* Right Side Actions: Buttons ko z-20 diya hai taaki click hamesha work kare */}
          <div className="flex items-center gap-2 pr-2 relative z-20">
            {input && !isGenerating && (
              <button
                onClick={handleClear}
                className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
                title="Clear Script"
              >
                <Eraser size={18} />
              </button>
            )}

            <button
              onClick={() => setShowHistory(true)}
              className="p-3 rounded-xl bg-[#111111] text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all border border-zinc-800"
            >
              <History size={18} />
            </button>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !input.trim() || !selectedCharacterId}
              className="h-full px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:scale-95 flex items-center gap-2"
            >
              {isGenerating ? <Zap size={16} className="animate-bounce" /> : <Send size={16} />}
              <span className="hidden sm:inline">
                <RollingText text={isGenerating ? "PROCESSING..." : "GENERATE"} speed={0.1} />
              </span>
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="flex justify-between items-center px-4 text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <Keyboard size={12} />
            <span>Ctrl + Enter to Submit</span>
          </div>

          {/* Validation Warning - Animated */}
          {!selectedCharacterId && (
            <div className="flex items-center gap-1 text-amber-500">
              <AlertCircle size={12} className="animate-pulse" />
              <RollingText
                text="SELECT CHARACTER FIRST"
                speed={0.03}
                className="text-amber-500 font-bold"
              />
            </div>
          )}

          <div>{input.length} Chars</div>
        </div>

      </div>

      <HistoryModal
        open={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </div>
  );
}