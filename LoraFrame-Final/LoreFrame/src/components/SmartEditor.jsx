import React, { useState, useRef, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { 
  Upload, Scissors, Wand2, Type, Download, Play, Pause, 
  RotateCw, Loader2, Film, Music, Layers, Zap, X, SlidersHorizontal,
  Smartphone, Monitor, Square, LayoutTemplate
} from 'lucide-react';

// Accepted props: initialFile (passed from Timeline)
export default function SmartEditor({ initialFile }) {
  // --- STATE MANAGEMENT ---
  const [loaded, setLoaded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('visuals');
  
  // Media State
  const [file, setFile] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [mediaSrc, setMediaSrc] = useState(null);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Audio State
  const [musicFile, setMusicFile] = useState(null);
  const [volumes, setVolumes] = useState({ video: 1.0, music: 0.5 });

  // Edit Settings
  const [trimRange, setTrimRange] = useState([0, 10]);
  const [rotation, setRotation] = useState(0); 
  const [speed, setSpeed] = useState(1.0);
  const [aspectRatio, setAspectRatio] = useState('original'); // original, 16:9, 9:16, 1:1, 4:5
  
  const [filters, setFilters] = useState({
    brightness: 1.0, contrast: 1.0, saturation: 1.0, blur: 0, grayscale: 0, sepia: 0,
  });

  const [textOverlay, setTextOverlay] = useState({
    text: "", x: 50, y: 50, fontSize: 30, color: "#ffffff", bgColor: "#000000", bgOpacity: 0.5
  });

  // Refs
  const ffmpegRef = useRef(new FFmpeg());
  const videoRef = useRef(null);

  // --- INITIALIZATION ---
  const loadFFmpeg = async () => {
    try {
      const ffmpeg = ffmpegRef.current;
      ffmpeg.on('log', ({ message }) => setLogs(prev => [...prev.slice(-4), message]));

      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      
      await ffmpeg.writeFile('arial.ttf', await fetchFile('https://raw.githubusercontent.com/ffmpegwasm/testdata/master/arial.ttf'));
      setLoaded(true);
      console.log("FFmpeg Ready");
    } catch (error) {
      console.error(error);
      setLogs(prev => [...prev, "Error loading FFmpeg"]);
    }
  };

  useEffect(() => { loadFFmpeg(); }, []);

  // --- NEW: AUTO-LOAD INITIAL FILE FROM PROPS ---
  useEffect(() => {
    if (initialFile) {
      const url = URL.createObjectURL(initialFile);
      setFile(initialFile);
      setMediaSrc(url);

      if (initialFile.type.startsWith('image/')) {
        setMediaType('image');
        setDuration(0); 
      } else {
        setMediaType('video');
        // Note: Duration is set via onLoadedMetadata in the video tag
      }
    }
  }, [initialFile]);

  // --- HANDLERS ---
  const handleUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;
    const url = URL.createObjectURL(uploadedFile);
    setFile(uploadedFile);
    setMediaSrc(url);
    if (uploadedFile.type.startsWith('image/')) {
      setMediaType('image');
      setDuration(0); 
    } else {
      setMediaType('video');
    }
  };

  const handleMusicUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) setMusicFile(uploadedFile);
  };

  const togglePlay = () => {
    if(!videoRef.current) return;
    if (isPlaying) videoRef.current.pause();
    else videoRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const applyPreset = (type) => {
    switch(type) {
      case 'reset': setFilters({ brightness: 1, contrast: 1, saturation: 1, blur: 0, grayscale: 0, sepia: 0 }); break;
      case 'noir': setFilters({ brightness: 1.1, contrast: 1.2, saturation: 0, blur: 0, grayscale: 1, sepia: 0 }); break;
      case 'vintage': setFilters({ brightness: 0.9, contrast: 1.1, saturation: 0.6, blur: 0, grayscale: 0, sepia: 1 }); break;
      case 'cinematic': setFilters({ brightness: 0.9, contrast: 1.3, saturation: 1.2, blur: 0, grayscale: 0, sepia: 0 }); break;
      default: break;
    }
  };

  // UI Helper: Get aspect ratio styles for preview container
  const getContainerAspect = () => {
    switch(aspectRatio) {
      case '16:9': return { aspectRatio: '16/9' };
      case '9:16': return { aspectRatio: '9/16' };
      case '1:1': return { aspectRatio: '1/1' };
      case '4:5': return { aspectRatio: '4/5' };
      default: return { height: '100%', width: '100%' }; // Original (fills parent)
    }
  };

  const getPreviewStyle = () => ({
    filter: `brightness(${filters.brightness}) contrast(${filters.contrast}) saturate(${filters.saturation}) blur(${filters.blur}px) grayscale(${filters.grayscale}) sepia(${filters.sepia})`,
    transform: `rotate(${rotation}deg)`,
    transition: 'filter 0.2s ease-out, transform 0.3s ease',
    // Important: Object contain ensures the image fits INSIDE the ratio box
    width: '100%',
    height: '100%',
    objectFit: 'contain'
  });

  // --- EXPORT LOGIC ---
  const exportMedia = async () => {
    if (!loaded) return;
    setProcessing(true);
    const ffmpeg = ffmpegRef.current;

    try {
      const inputExt = file.name.split('.').pop();
      const internalInputName = `input.${inputExt}`;
      await ffmpeg.writeFile(internalInputName, await fetchFile(file));

      if (musicFile && mediaType === 'video') {
        await ffmpeg.writeFile('music.mp3', await fetchFile(musicFile));
      }

      let filterChain = [];
      
      // 1. Color Filters
      filterChain.push(`eq=brightness=${filters.brightness - 1}:contrast=${filters.contrast}:saturation=${filters.saturation}`);
      if (filters.blur > 0) filterChain.push(`gblur=sigma=${filters.blur}`);
      if (filters.grayscale) filterChain.push(`hue=s=0`);
      
      // 2. Rotation
      if (rotation === 90) filterChain.push("transpose=1");
      if (rotation === 180) filterChain.push("transpose=1,transpose=1");
      if (rotation === 270) filterChain.push("transpose=2");

      // 3. Aspect Ratio Enhancement
      if (aspectRatio !== 'original') {
        let w = 1920, h = 1080;
        if (aspectRatio === '9:16') { w = 1080; h = 1920; }
        else if (aspectRatio === '1:1') { w = 1080; h = 1080; }
        else if (aspectRatio === '4:5') { w = 1080; h = 1350; }
        
        // This magic filter scales the video to fit INSIDE the target box, 
        // then adds black padding (pads) to fill the rest.
        filterChain.push(`scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2`);
      } else if (mediaType === 'video') {
        // Just ensure even dimensions for codecs if keeping original
        filterChain.push("scale=trunc(iw/2)*2:trunc(ih/2)*2");
      }

      // 4. Text Overlay
      if (textOverlay.text) {
        const safeText = textOverlay.text.replace(/:/g, "\\:").replace(/'/g, "");
        const boxColor = textOverlay.bgColor.replace('#', '0x') + Math.floor(textOverlay.bgOpacity * 255).toString(16).padStart(2,'0');
        filterChain.push(
          `drawtext=fontfile=arial.ttf:text='${safeText}':x=${textOverlay.x}:y=${textOverlay.y}:fontsize=${textOverlay.fontSize}:fontcolor=${textOverlay.color}:box=1:boxcolor=${boxColor}@${textOverlay.bgOpacity}`
        );
      }

      let command = [];
      let outputFilename = mediaType === 'image' ? "pro_image.png" : "pro_video.mp4";
      let outputType = mediaType === 'image' ? "image/png" : "video/mp4";

      const finalFilter = filterChain.join(",");

      if (mediaType === 'image') {
        command = [
          "-i", internalInputName,
          "-vf", finalFilter || "null",
          "-frames:v", "1",
          "-update", "1",
          outputFilename
        ];
      } else {
        let videoFilters = filterChain; // Array for video
        let audioFilter = "";
        
        // Speed affects timestamps (setpts) and audio (atempo)
        if (speed !== 1.0) {
           // Insert speed filter before the final scale if possible, but order matters less here
           // Actually it's safer to use complex filter for speed to handle A/V sync
           videoFilters.push(`setpts=${1/speed}*PTS`);
           audioFilter = `atempo=${speed}`;
        }

        const vFilterStr = videoFilters.join(",");
        let complexFilter = `[0:v]${vFilterStr}[v]`; 
        let mapCmd = ["-map", "[v]"];

        if (musicFile) {
           const originalAudio = audioFilter ? `[0:a]${audioFilter},volume=${volumes.video}[a1]` : `[0:a]volume=${volumes.video}[a1]`;
           const musicAudio = `[1:a]volume=${volumes.music}[a2]`;
           complexFilter += `;${originalAudio};${musicAudio};[a1][a2]amix=inputs=2:duration=first[aout]`;
           mapCmd.push("-map", "[aout]");
           
           command = [
            "-i", internalInputName,
            "-i", "music.mp3",
            "-ss", `${trimRange[0]}`,
            "-to", `${trimRange[1]}`,
            "-filter_complex", complexFilter,
            ...mapCmd,
            "-c:v", "libx264",
            "-preset", "ultrafast",
            outputFilename
           ];
        } else {
           if (speed !== 1.0 || volumes.video !== 1.0) {
              command = [
                "-i", internalInputName,
                "-ss", `${trimRange[0]}`,
                "-to", `${trimRange[1]}`,
                "-vf", vFilterStr,
                "-af", `${audioFilter ? audioFilter+',' : ''}volume=${volumes.video}`,
                "-c:v", "libx264",
                "-preset", "ultrafast",
                outputFilename
              ];
           } else {
              command = [
                "-i", internalInputName,
                "-ss", `${trimRange[0]}`,
                "-to", `${trimRange[1]}`,
                "-vf", vFilterStr,
                "-c:v", "libx264",
                "-c:a", "copy",
                "-preset", "ultrafast",
                outputFilename
              ];
           }
        }
      }

      console.log("Exec:", command);
      const exitCode = await ffmpeg.exec(command);
      if (exitCode !== 0) throw new Error("FFmpeg Error");

      const data = await ffmpeg.readFile(outputFilename);
      const url = URL.createObjectURL(new Blob([data.buffer], { type: outputType }));
      const a = document.createElement('a');
      a.href = url;
      a.download = outputFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

    } catch (e) {
      console.error(e);
      setLogs(prev => [...prev, `Error: ${e.message}`]);
      alert("Export failed.");
    }
    setProcessing(false);
  };

  const TabButton = ({ id, icon: Icon, label }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`flex-1 py-4 flex flex-col items-center justify-center gap-1 transition-all border-b-2
        ${activeTab === id 
          ? 'bg-blue-600/10 text-blue-400 border-blue-500' 
          : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
    >
      <Icon size={18} />
      <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-[#09090b] text-gray-100 font-sans p-2 md:p-6 lg:p-8">
      
      <div className="max-w-7xl mx-auto flex flex-col h-full gap-4 md:gap-6">
        {/* HEADER */}
        <div className="flex justify-between items-center shrink-0 mb-2">
          <h1 className="text-xl md:text-2xl font-black italic tracking-tighter flex items-center gap-2">
             <div className="bg-blue-600 p-1.5 rounded-lg"><Film className="text-white w-5 h-5" /></div>
             STUDIO<span className="text-blue-500">PRO</span>
          </h1>
          <div className="flex items-center gap-3">
             {loaded ? (
               <span className="flex items-center gap-2 text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full">
                 <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> ENGINE ONLINE
               </span>
             ) : (
               <span className="flex items-center gap-2 text-[10px] font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 rounded-full">
                 <Loader2 className="animate-spin w-3 h-3" /> LOADING CORE
               </span>
             )}
          </div>
        </div>

        {/* MAIN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:h-[calc(100vh-140px)] h-auto">
          
          {/* --- LEFT: PREVIEW AREA --- */}
          <div className="lg:col-span-8 flex flex-col gap-4 h-auto lg:h-full order-1 min-h-[400px]">
            <div className="relative flex-1 bg-[#121214] rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex flex-col">
               
               {/* Canvas Area - Flex Center */}
               <div className="flex-1 relative w-full h-full p-6 md:p-10 flex items-center justify-center bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:16px_16px]">
                  {!file ? (
                    <label className="cursor-pointer group flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 rounded-xl transition-all">
                      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-600 group-hover:scale-110 transition mb-4 shadow-lg">
                        <Upload className="w-6 h-6 text-gray-400 group-hover:text-white" />
                      </div>
                      <p className="text-gray-400 font-medium text-sm">Drag & Drop or Click to Upload</p>
                      <input type="file" className="hidden" accept="image/*,video/*" onChange={handleUpload} />
                    </label>
                  ) : (
                    // ASPECT RATIO CONTAINER
                    // This div physically resizes to match the aspect ratio
                    <div 
                      className={`relative shadow-2xl overflow-hidden transition-all duration-300 ease-in-out border border-white/5
                        ${aspectRatio === 'original' ? 'w-full h-full' : 'bg-black'}`}
                      style={getContainerAspect()}
                    >
                      {mediaType === 'video' ? (
                        <video
                          ref={videoRef}
                          src={mediaSrc}
                          className="w-full h-full"
                          style={getPreviewStyle()}
                          onLoadedMetadata={(e) => {
                            setDuration(e.target.duration);
                            setTrimRange([0, e.target.duration]);
                          }}
                          onEnded={() => setIsPlaying(false)}
                          onRateChange={(e) => setSpeed(e.target.playbackRate)}
                          playsInline
                        />
                      ) : (
                        <img 
                          src={mediaSrc} 
                          className="w-full h-full"
                          style={getPreviewStyle()}
                          alt="Preview" 
                        />
                      )}

                      {/* Text Overlay (inside the aspect box) */}
                      {textOverlay.text && (
                        <div 
                          className="absolute pointer-events-none px-2 rounded backdrop-blur-sm z-10"
                          style={{
                            left: `${textOverlay.x}px`,
                            top: `${textOverlay.y}px`,
                            color: textOverlay.color,
                            fontSize: `${textOverlay.fontSize}px`,
                            backgroundColor: `${textOverlay.bgColor}${Math.floor(textOverlay.bgOpacity * 255).toString(16).padStart(2,'0')}`,
                            fontFamily: 'Arial',
                            fontWeight: 'bold',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {textOverlay.text}
                        </div>
                      )}
                    </div>
                  )}
               </div>

               {/* Video Timeline Bar */}
               {file && mediaType === 'video' && (
                 <div className="p-4 bg-[#09090b] border-t border-white/10 z-10">
                   <div className="flex items-center gap-4">
                     <button onClick={togglePlay} className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition">
                       {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                     </button>
                     <div className="flex-1">
                        <div className="flex justify-between text-[10px] text-gray-500 font-mono mb-2">
                           <span>{trimRange[0].toFixed(1)}s</span>
                           <span>{trimRange[1].toFixed(1)}s</span>
                        </div>
                        <div className="relative h-8 bg-white/5 rounded-md overflow-hidden touch-none group"> 
                           <div className="absolute top-0 bottom-0 bg-blue-600/30 border-x border-blue-500" style={{ left: `${(trimRange[0]/duration)*100}%`, right: `${100-(trimRange[1]/duration)*100}%` }} />
                           <input type="range" min="0" max={duration} step="0.1" value={trimRange[0]} onChange={(e) => setTrimRange([parseFloat(e.target.value), trimRange[1]])} className="absolute inset-0 opacity-0 cursor-ew-resize z-20" />
                           <input type="range" min="0" max={duration} step="0.1" value={trimRange[1]} onChange={(e) => setTrimRange([trimRange[0], parseFloat(e.target.value)])} className="absolute inset-0 opacity-0 cursor-ew-resize z-20" />
                        </div>
                     </div>
                   </div>
                 </div>
               )}
            </div>
          </div>

          {/* --- RIGHT: CONTROL PANEL --- */}
          <div className="lg:col-span-4 bg-[#121214] border border-white/10 rounded-2xl flex flex-col overflow-hidden h-[600px] lg:h-full order-2 shadow-xl">
            {/* Tabs */}
            <div className="flex border-b border-white/5 bg-black/20 shrink-0">
              <TabButton id="visuals" icon={SlidersHorizontal} label="Adjust" />
              {mediaType === 'video' && <TabButton id="audio" icon={Music} label="Audio" />}
              <TabButton id="text" icon={Type} label="Text" />
            </div>

            {/* Scrollable Controls */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              {activeTab === 'visuals' && (
                <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-300">
                  
                  {/* Canvas Ratio Selection */}
                  <div className="space-y-3">
                     <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                       <LayoutTemplate size={12} /> Canvas Ratio
                     </h3>
                     <div className="grid grid-cols-5 gap-2">
                        {[
                          { id: 'original', label: 'Orig', icon: LayoutTemplate },
                          { id: '16:9', label: '16:9', icon: Monitor },
                          { id: '9:16', label: '9:16', icon: Smartphone },
                          { id: '1:1', label: '1:1', icon: Square },
                          { id: '4:5', label: '4:5', icon: Square }
                        ].map(r => (
                          <button 
                            key={r.id} 
                            onClick={() => setAspectRatio(r.id)}
                            className={`flex flex-col items-center justify-center py-2 rounded-lg border text-[10px] transition-all
                              ${aspectRatio === r.id 
                                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20' 
                                : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:border-white/20'}`}
                          >
                            <r.icon size={14} className="mb-1" />
                            {r.label}
                          </button>
                        ))}
                     </div>
                  </div>

                  <div className="space-y-3 border-t border-white/5 pt-6">
                     <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Filters</h3>
                     <div className="grid grid-cols-2 gap-2">
                        {['Reset', 'Noir', 'Vintage', 'Cinematic'].map(p => (
                          <button key={p} onClick={() => applyPreset(p.toLowerCase())} 
                            className="py-2.5 text-xs bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 rounded-lg transition-all font-medium">
                            {p}
                          </button>
                        ))}
                     </div>
                  </div>

                  <div className="space-y-5">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Corrections</h3>
                    <ControlRow label="Brightness" value={filters.brightness} min={0} max={2} step={0.1} fn={(v)=>setFilters(p=>({...p, brightness:v}))} />
                    <ControlRow label="Contrast" value={filters.contrast} min={0} max={2} step={0.1} fn={(v)=>setFilters(p=>({...p, contrast:v}))} />
                    <ControlRow label="Saturation" value={filters.saturation} min={0} max={3} step={0.1} fn={(v)=>setFilters(p=>({...p, saturation:v}))} />
                    <ControlRow label="Blur" value={filters.blur} min={0} max={20} step={1} fn={(v)=>setFilters(p=>({...p, blur:v}))} />
                  </div>

                  <div className="pt-4 border-t border-white/10">
                     <button onClick={() => setRotation(r => (r + 90) % 360)} className="w-full py-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-center gap-2 text-xs font-bold hover:bg-white/10 transition">
                        <RotateCw size={14} /> ROTATE 90°
                     </button>
                  </div>
                </div>
              )}

              {activeTab === 'audio' && mediaType === 'video' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                  <div className="space-y-4">
                     <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2"><Zap size={14}/> Speed</h3>
                     <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                        <span className="text-xs font-mono text-gray-400">0.5x</span>
                        <input type="range" min="0.5" max="2.0" step="0.25" value={speed} onChange={(e) => { const s = parseFloat(e.target.value); setSpeed(s); if(videoRef.current) videoRef.current.playbackRate = s; }} className="flex-1 accent-blue-500 h-1.5 bg-gray-700 rounded-lg cursor-pointer" />
                        <span className="text-xs font-mono text-blue-400 w-8 text-right">{speed}x</span>
                     </div>
                  </div>
                  
                  <div className="space-y-4">
                     <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2"><Layers size={14}/> Mixer</h3>
                     <div className="space-y-4 p-4 bg-white/5 rounded-xl border border-white/5">
                        <div className="space-y-2">
                           <div className="flex justify-between text-xs text-gray-400"><span>Video Sound</span><span>{Math.round(volumes.video * 100)}%</span></div>
                           <input type="range" min="0" max="2" step="0.1" value={volumes.video} onChange={(e) => setVolumes(p => ({...p, video: parseFloat(e.target.value)}))} className="w-full accent-blue-500 h-1.5 bg-gray-700 rounded-lg cursor-pointer" />
                        </div>
                        {!musicFile ? (
                          <label className="flex items-center gap-3 p-3 border border-dashed border-gray-600 rounded-lg cursor-pointer hover:bg-white/5 transition">
                             <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center"><Music size={14} /></div>
                             <div className="text-xs"><span className="font-bold block text-gray-300">Add Track</span><span className="text-gray-500">MP3 / WAV</span></div>
                             <input type="file" accept="audio/*" className="hidden" onChange={handleMusicUpload} />
                          </label>
                        ) : (
                          <div className="space-y-2 pt-2 border-t border-white/10">
                             <div className="flex justify-between items-center text-xs"><span className="text-green-400 flex items-center gap-1"><Music size={12}/> {musicFile.name.slice(0,15)}...</span><button onClick={() => setMusicFile(null)} className="text-gray-500 hover:text-red-400"><X size={14}/></button></div>
                             <input type="range" min="0" max="2" step="0.1" value={volumes.music} onChange={(e) => setVolumes(p => ({...p, music: parseFloat(e.target.value)}))} className="w-full accent-green-500 h-1.5 bg-gray-700 rounded-lg cursor-pointer" />
                          </div>
                        )}
                     </div>
                  </div>
                </div>
              )}

              {activeTab === 'text' && (
                <div className="space-y-5 animate-in slide-in-from-right-4 fade-in duration-300">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Content</label>
                    <input type="text" placeholder="Type text overlay..." value={textOverlay.text} onChange={(e) => setTextOverlay(p => ({...p, text: e.target.value}))} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Position X</label>
                        <input type="number" value={textOverlay.x} onChange={(e)=>setTextOverlay(p=>({...p, x:e.target.value}))} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Position Y</label>
                        <input type="number" value={textOverlay.y} onChange={(e)=>setTextOverlay(p=>({...p, y:e.target.value}))} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm" />
                     </div>
                  </div>
                  <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Background Opacity</label>
                      <input type="range" min="0" max="1" step="0.1" value={textOverlay.bgOpacity} onChange={(e) => setTextOverlay(p => ({...p, bgOpacity: parseFloat(e.target.value)}))} className="w-full accent-purple-500 h-1.5 bg-gray-700 rounded-lg cursor-pointer" />
                  </div>
                </div>
              )}
            </div>

            {/* Export Footer */}
            <div className="p-6 border-t border-white/5 bg-black/40 shrink-0">
               <button onClick={exportMedia} disabled={!file || processing || !loaded} className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${processing ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white'}`}>
                 {processing ? <Loader2 className="animate-spin" size={16}/> : <Download size={16}/>}
                 {processing ? "RENDERING MEDIA..." : "EXPORT FINAL MEDIA"}
               </button>
               {logs.length > 0 && (
                  <div className="mt-3 text-[10px] font-mono text-gray-600 truncate text-center">
                     Status: {logs[logs.length-1]}
                  </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ControlRow({ label, value, min, max, step, fn }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-medium text-gray-400">
        <span>{label}</span>
        <span className="text-blue-400 font-mono bg-blue-400/10 px-1.5 rounded">{value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => fn(parseFloat(e.target.value))} className="w-full accent-blue-500 h-1.5 bg-gray-700 rounded-lg cursor-pointer" />
    </div>
  );
}