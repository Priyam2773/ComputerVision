import { X, Image as ImageIcon, Download, Maximize2, Trash2, Pencil, Save, RotateCcw, FileVideo, Play, Loader2, ImageOff, CheckCircle2 } from "lucide-react";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { toast } from "react-toastify";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// --- SUB-COMPONENT: Robust Media Item (Upgraded) ---
// Handles Image vs Video, Loading States, and Hover-to-Play
const RobustMediaItem = ({ url, alt, onPreview, className }) => {
  const [status, setStatus] = useState("loading"); // loading | loaded | error
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);

  // Robust detection
  const isVideo = useMemo(() => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|ogg|mov|mkv)$/i);
  }, [url]);

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
      className={`relative w-full h-full bg-[#1C1C1E] group/media ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Loading Skeleton */}
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-800 animate-pulse z-20">
          <Loader2 className="text-zinc-600 animate-spin" size={20} />
        </div>
      )}

      {/* Error State */}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1C1C1E] z-20 text-zinc-600">
          <ImageOff size={24} className="mb-2 opacity-50" />
          <span className="text-[10px] uppercase tracking-widest">Unavailable</span>
        </div>
      )}

      {/* Media Render */}
      {isVideo ? (
        <>
          <video
            ref={videoRef}
            src={url}
            className={`w-full h-full object-cover transition-opacity duration-500 ${status === "loaded" ? "opacity-100" : "opacity-0"}`}
            onLoadedData={() => setStatus("loaded")}
            onError={() => setStatus("error")}
            muted
            loop
            playsInline
          />
          {/* Video Badge / Play Icon */}
          {status === 'loaded' && (
            <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 pointer-events-none ${isPlaying ? "opacity-0" : "opacity-100"}`}>
               <div className="bg-black/40 backdrop-blur-sm p-3 rounded-full border border-white/10 shadow-lg">
                 <Play className="text-white/90 fill-white/20" size={20} />
               </div>
               <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur rounded text-[9px] text-white flex items-center gap-1">
                 <FileVideo size={10} /> VIDEO
               </div>
            </div>
          )}
        </>
      ) : (
        <img
          src={url}
          alt={alt}
          className={`w-full h-full object-cover transition-transform duration-700 group-hover/media:scale-105 ${status === "loaded" ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
          onClick={status === "loaded" ? onPreview : undefined}
        />
      )}
    </div>
  );
};

// --- MAIN COMPONENT ---
export default function HistoryModal({ open, onClose, characterId }) {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [previewItem, setPreviewItem] = useState(null); // Stores full object for preview
  const [editingItem, setEditingItem] = useState(null); // Stores object being edited

  // --- Fetch Data ---
  const fetchHistory = useCallback(async () => {
    if (!characterId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/characters/${characterId}/history`);
      if (!res.ok) throw new Error("Failed to fetch history");
      const data = await res.json();
      setHistory(data.episodic_states || []);
    } catch (err) {
      console.error(err);
      toast.error("Could not load history");
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [characterId]);

  useEffect(() => {
    if (open) {
      fetchHistory();
      setEditingItem(null);
    }
  }, [open, fetchHistory]);

  // --- Actions ---

  const handleDownload = async (url, filename) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      
      const isVideo = url.match(/\.(mp4|webm|ogg|mov)$/i);
      toast.success(isVideo ? "Video downloaded" : "Image downloaded");

    } catch (err) {
      console.error("Download failed", err);
      toast.error("Download failed");
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this memory?")) return;
    
    // Optimistic UI Update
    const previousHistory = [...history];
    setHistory(prev => prev.filter(item => item.id !== itemId));

    try {
      const res = await fetch(`${API_BASE}/api/v1/episodic-states/${itemId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Memory deleted");
    } catch (error) {
      setHistory(previousHistory); // Revert on fail
      toast.error("Failed to delete memory");
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/v1/episodic-states/${editingItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: editingItem.notes,
          tags: typeof editingItem.tags === 'string' ? editingItem.tags.split(',').map(t => t.trim()) : editingItem.tags
        })
      });

      if (!res.ok) throw new Error("Update failed");
      
      toast.success("Memory updated");
      fetchHistory(); // Refresh list
      setEditingItem(null);
    } catch (error) {
      toast.error("Failed to update memory");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-6xl h-[85vh] bg-[#111111] border border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#111111]/50">
          <div className="flex items-center gap-3">
            <ImageIcon className="text-blue-500" size={20} />
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-300">
              {editingItem ? "Editing Memory" : "Generation History"}
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] text-zinc-400 font-mono">
              {history.length} ITEMS
            </span>
          </div>

          <button onClick={onClose} className="p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition">
            <X size={18} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#111111]">
          
          {/* MODE: EDIT FORM */}
          {editingItem ? (
            <div className="p-8 flex flex-col md:flex-row gap-8 h-full">
              {/* Preview Side */}
              <div className="w-full md:w-1/2 bg-[#1C1C1E] rounded-2xl overflow-hidden border border-zinc-800 shadow-xl aspect-video relative">
                 <RobustMediaItem 
                   url={`${API_BASE}${editingItem.image_url}`} 
                   alt="Edit Preview" 
                   className="object-contain"
                 />
              </div>

              {/* Form Side */}
              <form onSubmit={handleSaveEdit} className="w-full md:w-1/2 flex flex-col gap-6">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Notes</label>
                    <textarea 
                      className="w-full h-32 bg-[#1C1C1E]/50 border border-zinc-700 rounded-xl p-4 text-sm text-zinc-200 focus:border-blue-500 outline-none resize-none"
                      value={editingItem.notes || ""}
                      onChange={(e) => setEditingItem({...editingItem, notes: e.target.value})}
                      placeholder="Add scene notes..."
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Tags (Comma separated)</label>
                    <input 
                      className="w-full bg-[#1C1C1E]/50 border border-zinc-700 rounded-xl p-3 text-sm text-zinc-200 focus:border-blue-500 outline-none"
                      value={Array.isArray(editingItem.tags) ? editingItem.tags.join(", ") : (editingItem.tags || "")}
                      onChange={(e) => setEditingItem({...editingItem, tags: e.target.value})}
                      placeholder="cyberpunk, rainy, neon..."
                    />
                  </div>
                  
                  <div className="flex gap-3 mt-auto">
                    <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition">
                      <Save size={16} /> Save Changes
                    </button>
                    <button type="button" onClick={() => setEditingItem(null)} className="px-6 border border-zinc-700 hover:bg-zinc-800 text-zinc-400 py-3 rounded-xl transition">
                      <RotateCcw size={16} />
                    </button>
                  </div>
              </form>
            </div>
          ) : (
            
          /* MODE: GRID VIEW */
            <div className="p-6">
              {loading ? (
                <div className="h-64 flex flex-col items-center justify-center text-zinc-500 gap-3">
                  <Loader2 size={32} className="animate-spin text-blue-500" />
                  <span className="text-xs uppercase tracking-widest">Loading Memories...</span>
                </div>
              ) : history.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-zinc-600 gap-2">
                  <ImageIcon size={48} className="opacity-20" />
                  <span className="text-sm">No episodic memories found.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {history.map((item) => {
                    // Construct URL robustly
                    const rawUrl = item.image_url || "";
                    const fullUrl = rawUrl.startsWith("http") ? rawUrl : `${API_BASE}${rawUrl}`;

                    return (
                      <div
                        key={item.id}
                        className="group relative h-64 rounded-2xl border border-zinc-800 bg-[#1C1C1E] overflow-hidden hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] transition-all duration-300"
                      >
                        {/* Media Display */}
                        <RobustMediaItem 
                          url={fullUrl} 
                          alt={`Scene ${item.scene_index}`} 
                          onPreview={() => setPreviewItem({ ...item, fullUrl })}
                        />

                        {/* Hover Overlay Actions */}
                        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4 pointer-events-none group-hover:pointer-events-auto">
                          
                          {/* Top Right Actions */}
                          <div className="flex justify-end gap-2 translate-y-[-10px] group-hover:translate-y-0 transition-transform duration-300 delay-75">
                            <button onClick={() => setEditingItem(item)} className="p-2 rounded-lg bg-zinc-800 hover:bg-blue-600 text-white transition" title="Edit">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => handleDelete(item.id)} className="p-2 rounded-lg bg-zinc-800 hover:bg-red-500 text-white transition" title="Delete">
                              <Trash2 size={14} />
                            </button>
                          </div>

                          {/* Center Actions */}
                          <div className="flex justify-center gap-4 scale-90 group-hover:scale-100 transition-transform duration-300 delay-100">
                             <button onClick={() => setPreviewItem({ ...item, fullUrl })} className="p-3 bg-white/10 backdrop-blur rounded-xl hover:bg-blue-600 text-white transition" title="Fullscreen">
                               <Maximize2 size={20} />
                             </button>
                             <button 
                               // Smart filename with extension
                               onClick={() => handleDownload(fullUrl, `scene_${item.scene_index}${fullUrl.match(/\.(mp4|webm)$/i) ? '.mp4' : '.png'}`)} 
                               className="p-3 bg-white/10 backdrop-blur rounded-xl hover:bg-green-600 text-white transition"
                               title="Download"
                             >
                               <Download size={20} />
                             </button>
                          </div>

                          {/* Bottom Info */}
                          <div className="translate-y-[10px] group-hover:translate-y-0 transition-transform duration-300 delay-150">
                             <div className="flex justify-between items-end">
                                <span className="text-xs font-bold text-zinc-200 bg-blue-500/20 px-2 py-1 rounded border border-blue-500/30">
                                  Scene {item.scene_index || "#"}
                                </span>
                                <span className="text-[10px] text-zinc-500 font-mono">
                                  {new Date(item.created_at).toLocaleDateString()}
                                </span>
                             </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex items-center justify-center p-8" onClick={() => setPreviewItem(null)}>
          <button
            onClick={() => setPreviewItem(null)}
            className="absolute top-8 right-8 p-3 bg-zinc-800 hover:bg-red-500 text-white rounded-full transition shadow-xl z-50"
          >
            <X size={24} />
          </button>

          <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {previewItem.fullUrl?.match(/\.(mp4|webm|mov|ogg)$/i) ? (
               <video src={previewItem.fullUrl} controls autoPlay className="max-w-full max-h-full rounded-2xl shadow-2xl border border-white/10" />
            ) : (
               <img src={previewItem.fullUrl} alt="Preview" className="max-w-full max-h-full rounded-2xl shadow-2xl border border-white/10 object-contain" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}