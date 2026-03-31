import { useStudio } from '../Context/StudioContext';
import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2, Plus, UserCircle2, Pencil, AlertTriangle, Fingerprint,
  Clock, Activity, Wrench, Loader2, ImageOff, X,
  // Icons for the Dock
  MessageCircle, Inbox, ToggleLeft, Eye, Upload, Menu, MoreHorizontal, Info, BrainCircuit, ScanFace
} from 'lucide-react';
import { toast } from 'react-toastify';
import { cn } from '../lib/utils';

import UserDetails from './UserDetails';
import HistoryModal from './HistoryModal';
import "./CastLocker.css";


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
            key={i}
            initial={{ y: "100%", opacity: 0, rotateX: 90 }}
            whileInView={{ y: 0, opacity: 1, rotateX: 0 }}
            viewport={{ once: true, margin: "-10%" }}
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

// --- SUB-COMPONENT: Robust Image Loader ---
const CharacterImage = ({ src, alt }) => {
  const [status, setStatus] = useState("loading");

  return (
    <div className="relative w-full h-full bg-[#1C1C1E]">
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#27272A] animate-pulse z-10">
          <Loader2 className="text-zinc-500 animate-spin" size={20} />
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1C1C1E] z-10 text-zinc-600">
          <ImageOff size={24} className="mb-1 opacity-50" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-500",
          status === "loaded" ? "opacity-100" : "opacity-0"
        )}
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("error")}
      />
    </div>
  );
};

export default function CastLocker() {
  const { userData, setUserData, selectedCharacterId, setSelectedCharacterId } = useStudio();

  // Local State
  const [isLoading, setIsLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [editingChar, setEditingChar] = useState(null);
  const [characterToDelete, setCharacterToDelete] = useState(null);
  const [infoChar, setInfoChar] = useState(null); // State for Individual Info Modal
  const [isDeleting, setIsDeleting] = useState(false);

  const [showHistory, setShowHistory] = useState(false);
  const [historyCharId, setHistoryCharId] = useState(null);
  const fileInputRef = useRef(null);

  // State for Memory Health
  const [memoryStatus, setMemoryStatus] = useState({});

  /* ---------------------------- Handlers ---------------------------- */

  const fetchCharacters = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/characters`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error("Failed to load");

      const data = await response.json();
      setUserData(data);
    } catch (error) {
      console.error("Failed to fetch characters:", error);
      toast.error("Could not load neural cast");
    } finally {
      setIsLoading(false);
    }
  }, [setUserData]);

  useEffect(() => {
    fetchCharacters();
  }, [fetchCharacters]);

  const checkMemoryHealth = async (id) => {
    if (memoryStatus[id]) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/characters/${id}/memory-status`);
      const data = await response.json();
      setMemoryStatus(prev => ({ ...prev, [id]: data }));
    } catch (error) {
      console.error("Memory check failed:", error);
    }
  };

  const handleFixMemory = async (e, id) => {
  e.stopPropagation();
  const toastId = toast.loading("Recalibrating Neural Identity...");
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/characters/${id}/reextract-identity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      toast.update(toastId, { render: "Identity Recalibrated", type: "success", isLoading: false, autoClose: 3000 });
      
      const statusRes = await fetch(`${API_BASE_URL}/api/v1/characters/${id}/memory-status`);
      const statusData = await statusRes.json();
      
      setMemoryStatus(prev => ({ ...prev, [id]: statusData }));
      
      setUserData(prev => 
        prev.map(char =>
          char.id === id ? { ...char, memoryStatus: statusData } : char
        )
      );
    } else {
      throw new Error("API Error");
    }
  } catch (error) {
    toast.update(toastId, { render: "Failed to repair memory", type: "error", isLoading: false, autoClose: 3000 });
  }
};

  const handleUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setEditingChar(null);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const selectCharacter = (id) => setSelectedCharacterId(id);
  const confirmDelete = (id) => setCharacterToDelete(id);
  const cancelDelete = () => setCharacterToDelete(null);

  const deleteCharacter = async () => {
    if (!characterToDelete) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/characters/${characterToDelete}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setUserData((prev) => prev.filter((char) => char.id !== characterToDelete));
        if (selectedCharacterId === characterToDelete) setSelectedCharacterId(null);
        toast.success("Character deleted");
      } else {
        throw new Error("Delete failed");
      }
    } catch (error) {
      console.error("Failed to delete character:", error);
      toast.error("Failed to delete character");
    } finally {
      setIsDeleting(false);
      setCharacterToDelete(null);
    }
  };

  const openHistory = (e, id) => {
    e.stopPropagation();
    setHistoryCharId(id);
    setShowHistory(true);
  };

  const openInfo = (e, char) => {
    e.stopPropagation();
    // Ensure we have the latest health status when opening info
    checkMemoryHealth(char.id);
    setInfoChar(char);
  }

  const closeModal = () => {
    setFile(null);
    setEditingChar(null);
  };

  return (
    <aside className="relative w-72 bg-[#111111] border-r border-zinc-900 flex flex-col h-full overflow-hidden font-sans text-zinc-100">

      {/* --- HISTORY MODAL --- */}
      <AnimatePresence>
        {showHistory && (
          <HistoryModal
            open={showHistory}
            onClose={() => setShowHistory(false)}
            characterId={historyCharId}
          />
        )}
      </AnimatePresence>

      {/* --- HEADER --- */}
      <div className="p-5 border-b border-zinc-900 bg-[#111111]/80 backdrop-blur-md">
        <h2 className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">
         <div className="flex items-baseline gap-2 shrink-0">
                     <motion.h1
                       whileHover={{ scale: 1.05 }}
                       className="text-xl font-bold tracking-tighter text-blue-500 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)] cursor-pointer"
                     >
                       LoraFrame
                     </motion.h1>
                   </div>
          <RollingText text="NEURAL CAST" speed={0.1} />
        </h2>
      </div>

      {/* --- MODAL: CREATE / EDIT --- */}
      <AnimatePresence>
        {(file || editingChar) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative w-full max-w-[850px] bg-[#111111] border border-zinc-900 rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-1">
                <UserDetails
                  file={file}
                  character={editingChar}
                  onSave={fetchCharacters}
                  onCancel={closeModal}
                />
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL: DELETE CONFIRMATION --- */}
      <AnimatePresence>
        {characterToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="relative w-full max-w-[400px] bg-[#111111] rounded-[32px] overflow-hidden border border-zinc-900 shadow-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-semibold text-white">Delete Identity?</h1>
                <button onClick={cancelDelete} className="p-2 text-zinc-500 hover:text-white bg-[#1C1C1E] rounded-full transition-colors">
                  <X size={18} />
                </button>
              </div>
              <div className="flex flex-col items-center mb-6">
                <div className="w-16 h-16 bg-[#1C1C1E] rounded-full flex items-center justify-center mb-4 text-red-500">
                  <AlertTriangle size={32} />
                </div>
                <p className="text-center text-zinc-400 text-sm">
                  This action cannot be undone. All neural data associated with this character will be permanently lost.
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={cancelDelete} disabled={isDeleting} className="flex-1 h-12 rounded-2xl bg-[#1C1C1E] hover:bg-[#2C2C2E] text-white font-medium transition-colors">
                  Cancel
                </button>
                <button onClick={deleteCharacter} disabled={isDeleting} className="flex-1 h-12 flex items-center justify-center gap-2 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors shadow-[0_0_20px_rgba(220,38,38,0.2)]">
                  {isDeleting ? <Loader2 className="animate-spin" size={18} /> : "Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL: INDIVIDUAL CHARACTER INFO (New) --- */}
      <AnimatePresence>
        {infoChar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="relative w-full max-w-[400px] bg-[#111111] rounded-[32px] overflow-hidden border border-zinc-900 shadow-2xl p-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-lg font-bold text-white uppercase tracking-tight">{infoChar.name}</h1>
                  <p className="text-[10px] text-zinc-500 font-mono">ID: {infoChar.id}</p>
                </div>
                <button onClick={() => setInfoChar(null)} className="p-2 text-zinc-500 hover:text-white bg-[#1C1C1E] rounded-full transition-colors">
                  <X size={18} />
                </button>
              </div>

              {/* Health Status Block */}
              <div className="p-4 bg-[#1C1C1E] rounded-2xl border border-zinc-800 mb-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <BrainCircuit size={64} />
                </div>
                <span className="text-xs text-zinc-500 uppercase tracking-widest block mb-2">Neural Health</span>
                <div className="flex items-baseline gap-2">
                  <span className={cn("text-4xl font-black", memoryStatus[infoChar.id]?.health_score > 80 ? 'text-green-500' : 'text-amber-500')}>
                    {memoryStatus[infoChar.id]?.health_score || 0}%
                  </span>
                  <span className="text-xs font-bold text-zinc-400">
                    {memoryStatus[infoChar.id]?.health_status || "ANALYZING"}
                  </span>
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <ScanFace size={14} className="text-blue-500" />
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Identity Metadata</span>
                </div>

                <div className="bg-[#1C1C1E] rounded-2xl p-4 border border-zinc-800 space-y-3">
                  <div className="flex justify-between items-center border-b border-zinc-800/50 pb-2">
                    <span className="text-xs text-zinc-500">Face Structure</span>
                    <span className="text-xs font-medium text-white">{infoChar.char_metadata?.face || "N/A"}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-zinc-800/50 pb-2">
                    <span className="text-xs text-zinc-500">Hair Style</span>
                    <span className="text-xs font-medium text-white">{infoChar.char_metadata?.hair || "N/A"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500">Eye Color</span>
                    <span className="text-xs font-medium text-white">{infoChar.char_metadata?.eyes || "N/A"}</span>
                  </div>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MAIN LIST --- */}
      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-4 custom-scrollbar">

        {/* Upload Area */}
        <label className="group relative flex flex-col items-center justify-center h-32 border-2 border-dashed border-zinc-800 bg-[#1C1C1E]/30 rounded-2xl hover:border-blue-500/50 hover:bg-blue-500/5 cursor-pointer transition-all">
          <div className="p-3 rounded-full bg-[#1C1C1E] group-hover:bg-[#27272A] transition-colors mb-2">
            <Plus className="text-zinc-500 group-hover:text-blue-500 transition-colors" size={20} />
          </div>
          <span className="text-xs font-medium text-zinc-500 group-hover:text-blue-400 transition-colors">Add New Identity</span>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleUpload}
          />
        </label>

        {/* Loading State */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 rounded-2xl bg-[#1C1C1E] animate-pulse border border-zinc-900" />
            ))}
          </div>
        ) : userData && userData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-zinc-600">
            <UserCircle2 size={32} className="opacity-20 mb-2" />
            <span className="text-xs uppercase tracking-widest">No Cast Members</span>
          </div>
        ) : (
          userData && userData.map((char) => {
            const isSelected = selectedCharacterId === char.id;
            const meta = char.char_metadata;
            const health = memoryStatus[char.id];

            const imageUrl = char?.base_image_url
              ? (char.base_image_url.startsWith('http') ? char.base_image_url : `${API_BASE_URL}${char.base_image_url}`)
              : null;

            return (
              <motion.div
                layoutId={char.id}
                key={char.id}
                onClick={() => selectCharacter(char.id)}
                onMouseEnter={() => checkMemoryHealth(char.id)}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 25,
                  mass: 0.8
                }}
                whileHover={{
                  scale: 1.02,
                  y: -4,
                  transition: { duration: 0.2 }
                }}
                className={cn(
                  "group relative rounded-2xl border overflow-hidden transition-all cursor-pointer",
                  isSelected
                    ? "border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.25)] bg-[#111111]"
                    : "border-zinc-900 bg-[#1C1C1E] hover:border-zinc-700 hover:shadow-lg"
                )}
              >
                {/* ACTIONS DOCK (Floating Pill) */}
                <div className="absolute top-3 right-3 z-30 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                  <div className="flex items-center gap-1 p-1.5 bg-[#111111]/90 backdrop-blur-md border border-zinc-800 rounded-full shadow-xl">

                    {/* INDIVIDUAL INFO BUTTON (New) */}
                    <div className="relative group/tooltip">
                      <button
                        onClick={(e) => openInfo(e, char)}
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-all"
                      >
                        <Info size={14} />
                      </button>
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover/tooltip:opacity-100 pointer-events-none whitespace-nowrap">
                        Info
                      </span>
                    </div>

                    <div className="w-px h-3 bg-zinc-800" /> {/* Divider */}

                    {/* History Button */}
                    <div className="relative group/tooltip">
                      <button
                        onClick={(e) => openHistory(e, char.id)}
                        className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 rounded-full transition-all"
                      >
                        <Clock size={14} />
                      </button>
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover/tooltip:opacity-100 pointer-events-none whitespace-nowrap">
                        History
                      </span>
                    </div>

                    <div className="w-px h-3 bg-zinc-800" /> {/* Divider */}

                    {/* Edit Button */}
                    <div className="relative group/tooltip">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingChar(char); }}
                        className="p-1.5 text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 rounded-full transition-all"
                      >
                        <Pencil size={14} />
                      </button>
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover/tooltip:opacity-100 pointer-events-none whitespace-nowrap">
                        Edit
                      </span>
                    </div>

                    <div className="w-px h-3 bg-zinc-800" /> {/* Divider */}

                    {/* Delete Button */}
                    <div className="relative group/tooltip">
                      <button
                        onClick={(e) => { e.stopPropagation(); confirmDelete(char.id); }}
                        className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-zinc-800 rounded-full transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover/tooltip:opacity-100 pointer-events-none whitespace-nowrap">
                        Delete
                      </span>
                    </div>

                  </div>
                </div>

                {/* Info Overlay (Hover) */}
                <div className="absolute inset-0 z-20 bg-black/90 p-4 flex flex-col justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto">
                  <div className="flex items-center justify-between text-blue-400 mb-1 border-b border-zinc-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Fingerprint size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">
                        <RollingText text="NEURAL STATS" speed={0.05} />
                      </span>
                    </div>
                    {health && (
                      <span className={cn("text-[10px] font-bold", health.health_score > 80 ? 'text-green-500' : 'text-amber-500')}>
                        {health.health_score}%
                      </span>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-zinc-500">
                      <span>Face:</span> <span className="text-zinc-300 truncate">{meta?.face || "-"}</span>
                      <span>Hair:</span> <span className="text-zinc-300 truncate">{meta?.hair || "-"}</span>
                      <span>Eyes:</span> <span className="text-zinc-300 truncate">{meta?.eyes || "-"}</span>
                    </div>
                    <div className="pt-2 border-t border-zinc-800 mt-1 flex items-center justify-between">
                      <p className="text-[9px] text-zinc-500 uppercase flex items-center gap-1">
                        <Activity size={10} className={health?.health_status === 'HEALTHY' ? 'text-green-500' : 'text-amber-500'} />
                        {health?.health_status || "Scanning..."}
                      </p>
                      <button onClick={(e) => handleFixMemory(e, char.id)} className="p-1.5 rounded bg-zinc-900 hover:bg-blue-600 text-zinc-400 hover:text-white transition-colors" title="Fix Memory Vector">
                        <Wrench size={10} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Image Section */}
                <div className="relative h-44 overflow-hidden">
                  <CharacterImage src={imageUrl} alt={char.name} />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C1E] via-transparent to-transparent opacity-80" />
                </div>

                {/* Card Footer */}
                <div className="p-3 flex justify-between items-center bg-[#1C1C1E]/95 absolute bottom-0 w-full backdrop-blur-md border-t border-zinc-800">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-zinc-200 truncate w-32">{char.name}</span>
                    <span className="text-[9px] text-zinc-600 font-mono">ID: {char.id.slice(-4)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#111111] border border-zinc-800">
                    <div className="h-1 w-1 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-tighter">
                      <RollingText text="READY" speed={0.05} />
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* --- GLOBAL FLOATING DOCK (Bottom) --- */}
   

    </aside>
  );
}