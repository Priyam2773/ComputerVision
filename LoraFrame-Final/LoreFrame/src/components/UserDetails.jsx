import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "react-toastify";
import { Cpu, RotateCcw, Save, X, Loader2, AlertCircle, Sparkles, ScanFace, Tv } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Updated icons for better visuals
const engineOptions = [
  { id: "story-diff", title: "StoryDiffusion", icon: Sparkles },
  { id: "face-detailer", title: "FaceDetailer", icon: ScanFace },
  { id: "upscale", title: "4K Upscale", icon: Tv },
];

const formSchema = z.object({
  name: z.string().min(1, "Character name is required"),
  age: z.string().min(1, "Age is required"),
  model: z.string(),
  specialInstructions: z.string().optional(),
  engines: z.array(z.string()),
  highPriority: z.boolean(),
});

export default function UserDetails({ file, character, onSave, onCancel }) {
  const isEditMode = Boolean(character);
  const [previewUrl, setPreviewUrl] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: character?.name || "",
      age: character?.age || "",
      model: character?.model || "flux-dev",
      specialInstructions: character?.description || character?.specialInstructions || "",
      engines: character?.engines || ["story-diff"],
      highPriority: character?.highPriority || false,
    },
  });

  // Handle Image Previews Robustly
  React.useEffect(() => {
    let objectUrl = null;

    if (file) {
      if (typeof file === "string") {
        setPreviewUrl(file);
      } else {
        objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
      }
    } else if (character?.base_image_url) {
      const url = character.base_image_url.startsWith('http')
        ? character.base_image_url
        : `${API_BASE_URL}${character.base_image_url}`;
      setPreviewUrl(url);
    }

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file, character]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      if (isEditMode) {
        // --- EDIT MODE ---
        const response = await fetch(`${API_BASE_URL}/api/v1/characters/${character.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.name,
            description: data.specialInstructions || "N/A"
          })
        });

        if (!response.ok) throw new Error("Update failed");
        toast.success(`Neural profile "${data.name}" updated`);

      } else {
        // --- CREATE MODE ---
        const formData = new FormData();
        formData.append("name", data.name);
        formData.append("consent", "true");
        formData.append("description", data.specialInstructions || "N/A");

        if (file) {
          formData.append("files", file);
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/characters`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error("Creation failed");
        toast.success(`Character "${data.name}" synced to neural cloud`);
      }

      onSave();
      form.reset();
      onCancel();

    } catch (error) {
      console.error("CineAI Error:", error);
      toast.error(isEditMode ? "Failed to update profile" : "Failed to sync with CineAI");
    } finally {
      setIsLoading(false);
    }
  };

  if (!previewUrl && !isEditMode) return null;

  return (
    <div className="flex items-center justify-center p-2 sm:p-6 w-full h-full backdrop-blur-sm bg-black/40">
      <div className="w-full max-h-[90vh] max-w-[900px] bg-[#030712] border border-indigo-500/20 rounded-3xl text-slate-200 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col relative overflow-hidden">
        
        {/* Background Glow Effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-600/10 rounded-full blur-[80px] pointer-events-none" />

        {/* Header */}
        <div className="p-6 border-b border-white/5 bg-white/5 backdrop-blur-md flex justify-between items-center shrink-0 z-10">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-3 text-white tracking-tight">
              <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-500/30 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                <Cpu size={20} />
              </div>
              {isEditMode ? "Edit Neural Profile" : "Neural Profile Sync"}
            </h2>
            <p className="text-[10px] text-cyan-500 uppercase tracking-[0.25em] mt-1.5 font-bold ml-12">
              Actor Identity Virtualization
            </p>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-slate-400 hover:text-white transition-all disabled:opacity-50 hover:rotate-90 duration-300"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto custom-scrollbar p-8 z-10">
          <div className="grid md:grid-cols-2 gap-8">

            {/* Left Column: Preview and Identity */}
            <div className="space-y-6">
              {/* Image Preview Card */}
              <div className="relative group rounded-2xl p-1 bg-gradient-to-br from-indigo-500/30 to-cyan-500/30">
                <div className="relative rounded-xl overflow-hidden bg-[#050b14] aspect-[4/5] md:aspect-auto md:h-72">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500"
                  />
                  {/* Grid Overlay */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[size:20px_20px] opacity-40 pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                  
                  {/* Floating ID Tag */}
                  <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 border border-white/10 backdrop-blur-md">
                     <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                     <span className="text-[10px] font-mono text-white/80">ID_VERIFIED</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-3 space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Character Name</label>
                  <input
                    {...form.register("name")}
                    disabled={isLoading}
                    className="w-full bg-[#0a0f1e] border border-white/10 rounded-xl p-3.5 text-sm text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 outline-none transition-all disabled:opacity-50 placeholder:text-slate-600 shadow-inner"
                    placeholder="e.g. Maya"
                  />
                  {form.formState.errors.name && (
                    <p className="text-[10px] text-red-400 flex items-center gap-1 pl-1">
                      <AlertCircle size={10} /> {form.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Age</label>
                  <input
                    {...form.register("age")}
                    type="number"
                    disabled={isLoading}
                    className="w-full bg-[#0a0f1e] border border-white/10 rounded-xl p-3.5 text-sm text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 outline-none transition-all disabled:opacity-50 shadow-inner"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Instructions and Engines */}
            <div className="space-y-6 flex flex-col h-full">
              <div className="flex-1 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 mb-1 block">Neural Instructions</label>
                <div className="relative h-full min-h-[140px]">
                  <textarea
                    {...form.register("specialInstructions")}
                    disabled={isLoading}
                    placeholder="Describe personality, visual traits, or specific details for the AI..."
                    className="w-full h-full bg-[#0a0f1e] border border-white/10 rounded-xl p-4 text-xs leading-relaxed text-slate-300 resize-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all disabled:opacity-50 custom-scrollbar shadow-inner"
                  />
                  <div className="absolute bottom-3 right-3 pointer-events-none text-slate-700">
                    <ScanFace size={16} />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 block">Processing Engines</label>
                <div className="grid grid-cols-1 gap-2.5">
                  {engineOptions.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = form.watch("engines").includes(opt.id);
                    return (
                      <label 
                        key={opt.id} 
                        className={`group flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-300 cursor-pointer relative overflow-hidden ${
                          isSelected 
                            ? "bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]" 
                            : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg transition-colors ${isSelected ? "bg-indigo-500 text-white" : "bg-white/10 text-slate-400 group-hover:text-white"}`}>
                          <Icon size={14} />
                        </div>
                        
                        <span className={`text-xs font-medium transition-colors ${isSelected ? "text-white" : "text-slate-400 group-hover:text-slate-200"}`}>
                          {opt.title}
                        </span>

                        {/* Hidden Checkbox */}
                        <input
                          type="checkbox"
                          disabled={isLoading}
                          checked={isSelected}
                          onChange={(e) => {
                            const current = form.getValues("engines");
                            form.setValue("engines", e.target.checked ? [...current, opt.id] : current.filter((id) => id !== opt.id));
                          }}
                          className="absolute opacity-0 w-0 h-0"
                        />
                        
                        {/* Status Indicator */}
                        <div className={`ml-auto w-2 h-2 rounded-full transition-all ${isSelected ? "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" : "bg-slate-700"}`} />
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4 mt-auto">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 via-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white py-4 rounded-2xl text-xs uppercase font-bold tracking-widest transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] active:scale-95 disabled:cursor-not-allowed overflow-hidden"
                >
                   {/* Shimmer Effect */}
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                   
                   <div className="relative flex items-center gap-2">
                     {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                     {isLoading ? "Processing..." : (isEditMode ? "Update Profile" : "Generate Profile")}
                   </div>
                </button>

                <button
                  type="button"
                  onClick={() => form.reset()}
                  disabled={isLoading}
                  className="px-5 border border-white/10 py-4 rounded-2xl text-slate-400 hover:bg-white/5 hover:text-white hover:border-white/20 transition-all disabled:opacity-50"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}