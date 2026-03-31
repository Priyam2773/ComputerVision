import React, { createContext, useContext, useState, useCallback } from 'react';

const StudioContext = createContext();
const API_BASE_URL =import.meta.env.VITE_API_BASE_URL; 

export const StudioProvider = ({ children }) => {

  // --- GLOBAL STATE ---
  const [isLoading, setIsLoading] = useState(false); // For initial data fetching
  const [isGenerating, setIsGenerating] = useState(false); // For generation process
  
  // Data Containers
  const [cast, setCast] = useState([]); // Local cast (deprecated if using userData exclusively)
  const [userData, setUserData] = useState([]); // API fetched characters
  const [timeline, setTimeline] = useState([]); // Generated images history
  const [logs, setLogs] = useState(["System Ready..."]);

  // UI State
  const [prompt, setPrompt] = useState("");
  const [selectedCharacterId, setSelectedCharacterId] = useState(null);

  const [Type, setType] = useState(true);

  // --- HELPERS ---

  const addLog = (msg) => {
    console.log(`[StudioLog] ${msg}`);
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 20));
  };

  const addCharacter = (name, file, age) => {
    const localUrl = URL.createObjectURL(file); 
    const newChar = { id: Date.now().toString(), name , refImage: localUrl , age };
    setCast([...cast, newChar]);
    addLog(`Character "${name}" added locally.`);
  };

  /**
   * 🧠 ROBUST GENERATION FUNCTION
   * Handles the entire lifecycle: Identity Refresh -> Job Dispatch -> Polling -> Result
   */
  const generateStoryboard = useCallback(async ({ prompt, character }) => {
    if (!character || !prompt) {
      addLog("❌ Generation Aborted: Missing character or prompt");
      throw new Error("Missing requirements");
    }

    setIsGenerating(true);
    addLog(`🚀 Starting generation for ${character.name}...`);

    try {
      // ---------------------------------------------------------
      // STEP 1: RE-EXTRACT IDENTITY (Ensure face vectors are fresh)
      // ---------------------------------------------------------
      addLog("Step 1: Recalibrating Identity...");
      try {
        await fetch(`${API_BASE_URL}/api/v1/characters/${character.id}/reextract-identity`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (e) {
        console.warn("Identity refresh skipped (non-fatal)");
      }

      // ---------------------------------------------------------
      // STEP 2: DISPATCH JOB
      // ---------------------------------------------------------
      addLog("Step 2: Dispatching Job...");

      if(Type){
      const startRes = await fetch(`${API_BASE_URL}/api/v1/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify({
            character_id: character.id,
            prompt: prompt,
            // Fallback to empty string if no image url, though API might require it
            pose_image_url: character.base_image_url || "", 
            options: {
              video: false,
              refine_face: true,
              aspect_ratio: "16:9",
              style_overrides: []
            }
          })
        }
      );

      if (!startRes.ok) throw new Error("Failed to start generation job");
      const { job_id } = await startRes.json();
      addLog(`✅ Job started: ${job_id}`);

      // ---------------------------------------------------------
      // STEP 3: POLL FOR COMPLETION
      // ---------------------------------------------------------
      let jobResult = null;
      let attempts = 0;
      const maxAttempts = 60; // 3 minutes timeout

      while (!jobResult && attempts < maxAttempts) {
        await new Promise(res => setTimeout(res, 3000)); // Wait 3s
        attempts++;

        const jobRes = await fetch(`${API_BASE_URL}/api/v1/jobs/${job_id}`);
        if(jobRes.ok) {
           const data = await jobRes.json();
           if (data.status === "success") {
             jobResult = data;
             break;
           }
           if (data.status === "failed") {
             throw new Error(data.error_message || "Server reported job failure");
           }
           addLog(`...Rendering (${attempts * 3}s)`);
        }
      }

      if (!jobResult) throw new Error("Generation timed out");

      // ---------------------------------------------------------
      // SUCCESS: UPDATE TIMELINE
      // ---------------------------------------------------------
      // Normalize URL: Ensure it starts with base URL if it's relative
      let resultUrl = jobResult.result_url || jobResult.output?.url || "";
      if (resultUrl && !resultUrl.startsWith("http")) {
        resultUrl = `${API_BASE_URL}${resultUrl}`;
      }

      const newScene = {
        id: jobResult.id || job_id, // Fallback ID
        job_id: job_id,
        prompt: prompt,
        image: resultUrl, // Used by DirectorPanel logic
        result_url: resultUrl, // Used by Timeline logic (normalized)
        identityUsed: character.name,
        metrics: jobResult.metrics || { idr_score: 0.99 },
        timestamp: new Date().toLocaleTimeString(),
        createdAt: new Date().toISOString()
      };

      setTimeline(prev => [newScene, ...prev]);
      addLog("✨ Storyboard generated successfully!");
      return newScene;

    } else {
  // --- VIDEO GENERATION BRANCH ---
  addLog("Step 2: Dispatching Image Generation for Video...");

  const startRes = await fetch(`${API_BASE_URL}/api/v1/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      character_id: character.id,
      prompt: prompt,
      pose_image_url: character.base_image_url || "",
      options: {
        video: false, 
        refine_face: true,
        aspect_ratio: "16:9",
        style_overrides: []
      }
    })
  });

  if (!startRes.ok) throw new Error("Failed to start initial generation");
  const { job_id } = await startRes.json();

  // --- POLLING: Wait for Image to be ready ---
  let imageResult = null;
  let attempts = 0;
  const maxAttempts = 60; 

  while (!imageResult && attempts < maxAttempts) {
    await new Promise(res => setTimeout(res, 3000)); // 3 sec ka gap
    attempts++;

    const jobRes = await fetch(`${API_BASE_URL}/api/v1/jobs/${job_id}`);
    if (jobRes.ok) {
      const data = await jobRes.json();
      if (data.status === "success") {
        imageResult = data;
        break; 
      }
      if (data.status === "failed") {
        throw new Error(data.error_message || "Image generation failed");
      }
      addLog(`...Generating Image (${attempts * 3}s)`);
    }
  }

  if (!imageResult) throw new Error("Image generation timed out");

  // --- EXTRACT IMAGE URL ---
  let fetchedImageUrl = imageResult.result_url || imageResult.output?.url || "";
  if (fetchedImageUrl && !fetchedImageUrl.startsWith("http")) {
    fetchedImageUrl = `${API_BASE_URL}${fetchedImageUrl}`;
  }

  // --- STEP 4: GENERATE VIDEO FROM FETCHED IMAGE ---
  addLog("Step 4: Image ready. Converting to motion video...");
  const videoRes = await fetch(`${API_BASE_URL}/api/v1/generate-video-from-image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: prompt,
      image_url: fetchedImageUrl 
    })
  });

  if (!videoRes.ok) throw new Error("Video conversion failed");
  const videoData = await videoRes.json();

  const finalVideoUrl = videoData.video_path.startsWith("http") 
    ? videoData.video_path 
    : `${API_BASE_URL}${videoData.video_path}`;

  // Update Timeline with both Thumbnail (image) and Video (result_url)
  const newScene = {
    id: `vid-${Date.now()}`,
    prompt: prompt,
    image: fetchedImageUrl, 
    result_url: finalVideoUrl,
    identityUsed: character.name,
    type: 'video',
    timestamp: new Date().toLocaleTimeString()
  };

  setTimeline(prev => [newScene, ...prev]);
  addLog("✨ Video generated successfully!");
  return newScene;
}

    } catch (err) {
      console.error(err);
      addLog(`❌ Generation Failed: ${err.message}`);
      throw err; // Re-throw so components can show Toast errors
    } finally {
      setIsGenerating(false);
    }
  }, []);


  return (
    <StudioContext.Provider value={{ 
      // State
      cast, 
      setCast,
      userData, 
      setUserData,
      timeline, 
      setTimeline,
      isLoading, 
      setIsLoading, 
      isGenerating, 
      logs, 
      prompt, 
      setPrompt, // Updated to camelCase
      selectedCharacterId, 
      setSelectedCharacterId,
      Type,
      setType,
      // Functions
      addCharacter, 
      addLog,
      generateStoryboard 
    }}>
      {children}
    </StudioContext.Provider>
  );
};

export const useStudio = () => useContext(StudioContext);