import { useStudio } from '../Context/StudioContext';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, Maximize2, Download, X, Clock, Trash2, Copy, Loader2, ImageOff, CheckCircle2, Play, Pause, Wand2 } from 'lucide-react';
import Hyperspeed from './ReactBits/HyperSpeed/HyperSpeed';
import { useState, useRef, useMemo } from 'react';
import { toast } from 'react-toastify';
import { cn } from '../lib/utils';
import DoodleMovieWatcher from './skiper/DoodleMovieWatcher';
import DoodleTv from './skiper/DoodleTv';
import SmartEditor from './SmartEditor'; // <--- IMPORT YOUR EDITOR HERE

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// --- HELPER: Convert URL to File for FFmpeg ---
async function urlToFile(url, filename, mimeType) {
  const res = await fetch(url);
  const blob = await res.blob();
  return new File([blob], filename, { type: mimeType });
}

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
            exit={{ y: "-100%", opacity: 0, rotateX: -90 }}
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

// --- NEW SMART MEDIA COMPONENT (Handles Images & Videos) ---
const RobustMedia = ({ src, alt, onPreview }) => {
  const [status, setStatus] = useState("loading"); // loading | loaded | error
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);

  // Detect if the source is likely a video based on extension
  const isVideo = useMemo(() => {
    if (!src) return false;
    return src.match(/\.(mp4|webm|ogg|mov)$/i);
  }, [src]);

  const handleMouseEnter = () => {
    if (isVideo && videoRef.current && status === 'loaded') {
      videoRef.current.play().catch(e => console.warn("Autoplay blocked", e));
      setIsPlaying(true);
    }
  };

  const handleMouseLeave = () => {
    if (isVideo && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0; // Reset to start
      setIsPlaying(false);
    }
  };

  return (
    <div
      className="relative w-full h-full bg-[#1C1C1E] cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={status === "loaded" ? onPreview : undefined}
    >
      {/* Loading Skeleton */}
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#27272A] animate-pulse z-20">
          <Loader2 className="text-zinc-600 animate-spin" size={24} />
        </div>
      )}

      {/* Error Fallback */}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1C1C1E] z-20 text-zinc-600">
          <ImageOff size={32} className="mb-2 opacity-50" />
          <span className="text-[10px] uppercase tracking-widest">Load Failed</span>
        </div>
      )}

      {/* Media Renderer */}
      {isVideo ? (
        <>
          <video
            ref={videoRef}
            src={src}
            className={cn(
              "w-full h-full object-cover transition-all duration-700",
              status === "loaded" ? "opacity-100 scale-100" : "opacity-0 scale-105"
            )}
            muted
            loop
            playsInline
            onLoadedData={() => setStatus("loaded")}
            onError={() => setStatus("error")}
          />
          {/* Video Indicator / Play Icon */}
          {status === 'loaded' && (
            <div className={cn(
              "absolute inset-0 flex items-center justify-center transition-opacity duration-300 pointer-events-none",
              isPlaying ? "opacity-0" : "opacity-100"
            )}>
              <div className="bg-black/30 backdrop-blur-sm p-3 rounded-full border border-white/10 shadow-lg">
                <Play className="text-white/80 fill-white/20" size={24} />
              </div>
            </div>
          )}
        </>
      ) : (
        <img
          src={src}
          alt={alt}
          className={cn(
            "w-full h-full object-cover transition-all duration-700",
            status === "loaded" ? "opacity-100 scale-100" : "opacity-0 scale-105"
          )}
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
        />
      )}
    </div>
  );
};

// ------------------------------------------------------------------
// 🎬 MAIN COMPONENT
// ------------------------------------------------------------------
export default function Timeline() {
  const { timeline, setTimeline, prompt, isGenerating } = useStudio();
  const [previewMedia, setPreviewMedia] = useState(null);

  // --- NEW: State for Editor ---
  const [editingMedia, setEditingMedia] = useState(null); // Stores the file object for the editor
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const isLoading = (!timeline || timeline.length === 0) && !isGenerating;

  // --- ACTIONS ---

  const handleDownload = async (url, filename) => {
    console.log(`⬇️ Downloading: ${url}`);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);

      const isVideo = url.match(/\.(mp4|webm|ogg|mov)$/i);
      toast.success(isVideo ? "Video downloaded" : "Image downloaded");

    } catch (err) {
      console.error('Download failed:', err);
      toast.error("Download failed");
    }
  };

  const handleDelete = (id) => {
    if (!id) return;
    setTimeline(prev => prev.filter(item => (item.id !== id && item.job_id !== id)));
    toast.info("Scene removed from timeline");
  };

  const handleCopyPrompt = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Prompt copied to clipboard");
  };

  // --- NEW: Edit Handler ---
  const handleEdit = async (url, id) => {
    const toastId = toast.loading("Preparing studio...");
    try {
      // Determine file type and name
      const isVideo = url.match(/\.(mp4|webm|ogg|mov)$/i);
      const filename = `edit_scene_${id}${isVideo ? '.mp4' : '.png'}`;
      const mimeType = isVideo ? 'video/mp4' : 'image/png';

      // Convert URL to File object for the SmartEditor
      const file = await urlToFile(url, filename, mimeType);

      setEditingMedia({ file, url, type: isVideo ? 'video' : 'image' });
      setIsEditorOpen(true);
      toast.dismiss(toastId);
    } catch (error) {
      console.error("Failed to load editor", error);
      toast.update(toastId, { render: "Failed to load media", type: "error", isLoading: false, autoClose: 3000 });
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto formScroll custom-scrollbar relative bg-[#111111]">

      {/* Empty State Background Animation */}
      {isLoading && (
        <div className="absolute inset-0 opacity-40 pointer-events-none">
          <Hyperspeed
            effectOptions={{
              distortion: "turbulentDistortion",
              length: 200,
              roadWidth: 10,
              islandWidth: 2,
              lanesPerRoad: 3,
              fov: 90,
              fovSpeedUp: 150,
              speedUp: 2,
              carLightsFade: 0.4,
              totalSideLightSticks: 20,
              lightPairsPerRoadWay: 40,
              colors: {
                roadColor: 0x080808,
                islandColor: 0x0a0a0a,
                background: 0x000000,
                shoulderLines: 0x131318,
                brokenLines: 0x131318,
                leftCars: [0xd856bf, 0x6750a2, 0xc247ac],
                rightCars: [0x03b3c3, 0x0e5ea5, 0x324555],
                sticks: 0x03b3c3,
              }
            }}
          />
        </div>
      )}

      <div className="p-6 relative z-10 min-h-full flex flex-col items-center">

        {/* Active Prompt Indicator */}
        <div className="mb-8 p-4 bg-[#1C1C1E]/80 border border-zinc-800 rounded-2xl backdrop-blur-md shadow-xl sticky top-0 z-40 transition-all hover:border-blue-500/30 w-full max-w-3xl">
          <div className="flex justify-between items-start">
            <div className="overflow-hidden w-full">
              <div className="text-[10px] text-blue-400 font-bold uppercase mb-1 tracking-widest flex items-center gap-2">
                <Loader2 size={10} className={isGenerating ? "animate-spin" : "hidden"} />
                <RollingText
                  text={isGenerating ? "PROCESSING DATA STREAM..." : "NEURAL BUFFER READY"}
                  speed={0.03}
                  className="text-blue-400"
                />
              </div>
              <p className="text-sm text-zinc-300 italic truncate max-w-2xl">
                {prompt || 'Waiting for director input...'}
              </p>
            </div>
          </div>
        </div>

        {/* Timeline List */}
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="relative h-[40vh] w-[60vw] max-w-3xl border border-zinc-800 bg-[#1C1C1E]/30 rounded-3xl backdrop-blur-sm overflow-hidden flex items-center justify-center shadow-2xl"
            >
              <div className="absolute flex justify-center items-center inset-0 z-0 opacity-80">
                <div> <DoodleMovieWatcher /></div>
                <div> <DoodleTv /></div>
              </div>
            </motion.div>
          ) : (
            <motion.div className="space-y-8 pb-32 w-full max-w-3xl flex flex-col-reverse">

              {timeline?.map((scene, index) => {

                const rawUrl = scene.result_url || scene.image || "";
                let fullMediaUrl = "";
                if (rawUrl.startsWith("http")) {
                  fullMediaUrl = rawUrl;
                } else if (rawUrl) {
                  fullMediaUrl = `${API_BASE_URL}${rawUrl}`;
                }

                const itemId = scene.id || scene.job_id || index;
                const idrString = scene.idr_score ? `IDR LEVEL: ${(scene.idr_score * 100).toFixed(1)}%` : null;
                const isNewest = index === 0;

                return (
                  <motion.div
                    layout
                    key={itemId}
                    initial={{ opacity: 0, y: 60, scale: 0.85, rotateX: 5 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: isNewest ? 1 : 0.96 + (0.01 * Math.max(0, 5 - index)),
                      rotateX: 0,
                      filter: isNewest ? 'blur(0px) brightness(1)' : 'grayscale(20%) brightness(0.9)',
                    }}
                    exit={{ opacity: 0, x: -100, scale: 0.7, rotateY: -10 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 25,
                      mass: 0.8,
                      delay: index * 0.05
                    }}
                    whileHover={!isNewest ? {
                      scale: 0.98,
                      filter: 'grayscale(0%) brightness(1)',
                      transition: { duration: 0.3 }
                    } : undefined}
                    className={cn(
                      "relative group transition-all duration-500",
                      isNewest ? "z-30 mb-8" : "z-0 opacity-80"
                    )}
                  >
                    {/* Scene Header */}
                    <div className="flex justify-between items-center mb-3 px-1">
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-tighter shadow-lg",
                          scene.identityUsed && scene.identityUsed !== 'Generic' ? 'bg-blue-600' : 'bg-zinc-700'
                        )}>
                          <RollingText text={scene.identityUsed || 'GENERIC'} speed={0.05} />
                        </span>
                        <span className="text-zinc-500 text-[10px] flex items-center gap-1 font-mono uppercase">
                          <Clock size={10} />
                          {scene.timestamp || scene.createdAt || 'RECENT'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {idrString && (
                          <div className="text-[10px] font-mono text-zinc-500 bg-[#1C1C1E] px-2 py-0.5 rounded border border-zinc-800 flex items-center">
                            <RollingText
                              text={idrString}
                              className="text-blue-500 font-bold"
                              speed={0.02}
                            />
                          </div>
                        )}
                        <button
                          onClick={() => handleDelete(itemId)}
                          className="text-zinc-600 hover:text-red-500 transition-colors p-1"
                          title="Remove from timeline"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Media Container */}
                    <div className={cn(
                      "relative aspect-video rounded-3xl overflow-hidden border bg-[#1C1C1E] shadow-2xl group transition-all",
                      isNewest ? "border-blue-500/30 shadow-blue-500/10" : "border-zinc-800"
                    )}>

                      <RobustMedia
                        src={fullMediaUrl}
                        alt={scene.prompt}
                        onPreview={() => setPreviewMedia(fullMediaUrl)}
                      />

                      {/* Hover Overlay Controls */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-4 backdrop-blur-[2px] z-30">

                        {/* 1. Fullscreen Button */}
                        <button
                          onClick={() => setPreviewMedia(fullMediaUrl)}
                          className="p-4 bg-white/10 rounded-2xl hover:bg-blue-600 text-white transition-all hover:scale-110 shadow-lg border border-white/5"
                          title="Fullscreen"
                        >
                          <Maximize2 size={24} />
                        </button>

                        {/* 2. NEW Edit Button */}
                        <button
                          onClick={() => handleEdit(fullMediaUrl, itemId)}
                          className="p-4 bg-white/10 rounded-2xl hover:bg-indigo-600 text-white transition-all hover:scale-110 shadow-lg border border-white/5"
                          title="Edit in Studio"
                        >
                          <Wand2 size={24} />
                        </button>

                        {/* 3. Download Button */}
                        <button
                          onClick={() => handleDownload(fullMediaUrl, `cineai_${itemId}${fullMediaUrl.endsWith('.mp4') ? '.mp4' : '.png'}`)}
                          className="p-4 bg-white/10 rounded-2xl hover:bg-green-600 text-white transition-all hover:scale-110 shadow-lg border border-white/5"
                          title="Download"
                        >
                          <Download size={24} />
                        </button>

                      </div>
                    </div>

                    {/* Prompt Footer */}
                    <div className="mt-4 p-4 rounded-2xl bg-[#1C1C1E]/40 border border-zinc-800 hover:border-zinc-700 transition-colors group/prompt">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                          <CheckCircle2 size={10} className="text-green-500/50" />
                          Neural Prompt
                        </p>
                        <button
                          onClick={() => handleCopyPrompt(scene.prompt)}
                          className="opacity-0 group-hover/prompt:opacity-100 transition-opacity text-zinc-500 hover:text-blue-400"
                          title="Copy Prompt"
                        >
                          <Copy size={10} />
                        </button>
                      </div>
                      <p className="text-xs text-zinc-300 italic leading-relaxed">
                        "{scene.prompt}"
                      </p>
                    </div>

                    {/* Divider */}
                    <div className="mt-8 h-px bg-gradient-to-r from-transparent via-zinc-900 to-transparent opacity-50" />
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fullscreen Preview Modal */}
      {createPortal(
        <AnimatePresence>
          {previewMedia && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewMedia(null)}
              className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex items-center justify-center p-8 cursor-zoom-out"
            >
              <button
                onClick={() => setPreviewMedia(null)}
                className="absolute top-8 right-8 p-3 bg-zinc-800 hover:bg-red-500 text-white rounded-full transition shadow-xl z-50"
              >
                <X size={24} />
              </button>

              {previewMedia.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                <motion.video
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  src={previewMedia}
                  controls
                  autoPlay
                  onClick={(e) => e.stopPropagation()}
                  className="max-w-full max-h-full rounded-3xl shadow-2xl border border-white/10"
                />
              ) : (
                <motion.img
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  src={previewMedia}
                  onClick={(e) => e.stopPropagation()}
                  className="max-w-full max-h-full rounded-3xl shadow-2xl border border-white/10"
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* NEW: Smart Editor Modal Popup */}
      {createPortal(
        <AnimatePresence>
          {isEditorOpen && editingMedia && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
            >
              {/* Close Button for Editor */}
              <button
                onClick={() => setIsEditorOpen(false)}
                className="absolute top-4 right-4 z-[9999] p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-full transition-all border border-red-500/20"
              >
                <X size={24} />
              </button>

              {/* Editor Container - Needs to set the file into the SmartEditor */}
              <div className="w-full h-full max-w-[90vw] max-h-[90vh] bg-[#09090b] rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative">

                {/* IMPORTANT: 
                       You need to modify your SmartEditor component slightly to accept a `initialFile` prop.
                       If SmartEditor doesn't support props yet, you need to use a Ref or Effect inside it to load this file.
                       For now, I am passing `initialFile` assuming you update SmartEditor to use:
                       useEffect(() => { if(initialFile) handleUpload({target: {files: [initialFile]}}) }, [])
                    */}
                <SmartEditorWithPropInjection initialFile={editingMedia.file} />

              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

    </div>
  );
}

const SmartEditorWithPropInjection = ({ initialFile }) => {

  return <SmartEditor initialFile={initialFile} />;
};