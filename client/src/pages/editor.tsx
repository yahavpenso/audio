import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Download, Save, Folder } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AudioFile, PanningEffect, AudioSelection, ExportSettings } from "@shared/schema";
import WaveformVisualization from "@/components/WaveformVisualization";
import PlaybackControls from "@/components/PlaybackControls";
import TimelineEditor from "@/components/TimelineEditor";
import PanningEffectPanel from "@/components/PanningEffectPanel";
import CuttingTools from "@/components/CuttingTools";
import ExportModal from "@/components/ExportModal";
import EmptyState from "@/components/EmptyState";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Editor() {
  const [audioFile, setAudioFile] = useState<AudioFile | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [panningEffects, setPanningEffects] = useState<PanningEffect[]>([]);
  const [selection, setSelection] = useState<AudioSelection | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();

  // Initialize AudioContext
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  // Fetch projects list
  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      try {
        const result = await apiRequest("/api/projects?userId=default");
        return Array.isArray(result) ? result : [];
      } catch {
        return [];
      }
    },
  });

  // Save project mutation
  const saveProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      if (projectId) {
        return await apiRequest(`/api/projects/${projectId}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });
      } else {
        return await apiRequest("/api/projects", {
          method: "POST",
          body: JSON.stringify(data),
        });
      }
    },
    onSuccess: (result: any) => {
      setProjectId(result.id);
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Project saved",
        description: projectName,
      });
      setShowSaveDialog(false);
    },
  });

  // Load project mutation
  const loadProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      return await apiRequest(`/api/projects/${projectId}`);
    },
    onSuccess: async (result: any) => {
      if (result.audioData && audioContextRef.current) {
        try {
          const binaryString = atob(result.audioData.split(",")[1]);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const audioBuffer = await audioContextRef.current.decodeAudioData(bytes.buffer);
          
          setAudioFile({
            id: result.id,
            name: result.audioFileName || "Loaded Project",
            duration: result.duration || 0,
            sampleRate: result.sampleRate || 44100,
            numberOfChannels: result.numberOfChannels || 2,
          });
          setAudioBuffer(audioBuffer);
          setPanningEffects(result.effects || []);
          setSelection(result.selection || null);
          setProjectId(result.id);
          setProjectName(result.name);
          
          toast({
            title: "Project loaded",
            description: result.name,
          });
        } catch (error) {
          toast({
            title: "Error loading project",
            variant: "destructive",
          });
        }
      }
    },
  });

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContextRef.current!.decodeAudioData(arrayBuffer);
      
      const audioFileData: AudioFile = {
        id: crypto.randomUUID(),
        name: file.name,
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        numberOfChannels: audioBuffer.numberOfChannels,
      };

      setAudioFile(audioFileData);
      setAudioBuffer(audioBuffer);
      setCurrentTime(0);
      setPanningEffects([]);
      setSelection(null);
      setProjectId(null);
      setProjectName("");
      
      toast({
        title: "Audio loaded successfully",
        description: `${file.name} (${audioBuffer.duration.toFixed(2)}s)`,
      });
    } catch (error) {
      toast({
        title: "Error loading audio",
        description: "Could not decode audio file. Please try a different file.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleAddPanningEffect = useCallback((effect: PanningEffect) => {
    setPanningEffects(prev => [...prev, effect]);
    toast({
      title: "Panning effect added",
      description: `Applied at ${effect.startTime.toFixed(2)}s for ${effect.duration.toFixed(2)}s`,
    });
  }, [toast]);

  const handleRemovePanningEffect = useCallback((id: string) => {
    setPanningEffects(prev => prev.filter(e => e.id !== id));
    toast({
      title: "Effect removed",
      description: "Panning effect has been removed",
    });
  }, [toast]);

  const handleSaveProject = useCallback(() => {
    if (!audioBuffer || !projectName) {
      toast({
        title: "Error",
        description: "Please enter a project name",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      
      saveProjectMutation.mutate({
        id: projectId || crypto.randomUUID(),
        name: projectName,
        userId: "default",
        audioFileName: audioFile?.name,
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        numberOfChannels: audioBuffer.numberOfChannels,
        audioData: base64,
        effects: panningEffects,
        selection: selection,
      });
    };

    const offlineContext = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );
    const offlineBuffer = offlineContext.createBuffer(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );
    
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const sourceData = audioBuffer.getChannelData(channel);
      const destData = offlineBuffer.getChannelData(channel);
      destData.set(sourceData);
    }

    const wavBlob = new Blob([audioBuffer], { type: "audio/wav" });
    reader.readAsDataURL(wavBlob);
  }, [audioBuffer, audioFile, projectName, panningEffects, selection, projectId, toast, saveProjectMutation]);

  const handleExport = useCallback(async (settings: ExportSettings) => {
    if (!audioBuffer) return;
    
    toast({
      title: "Exporting audio...",
      description: "Processing your audio file with effects",
    });
    
    try {
      const { applyPanningEffects, exportToWAV, exportToMP3, downloadBlob } = await import("@/lib/audioProcessing");
      
      const processedBuffer = await applyPanningEffects(audioBuffer, panningEffects);
      
      let blob: Blob;
      let filename: string;
      
      if (settings.format === "wav") {
        blob = exportToWAV(processedBuffer, settings.sampleRate, settings.bitDepth);
        filename = `${audioFile?.name.replace(/\.[^/.]+$/, "") || "audio"}_export.wav`;
      } else {
        blob = exportToMP3(processedBuffer, settings.bitrate);
        filename = `${audioFile?.name.replace(/\.[^/.]+$/, "") || "audio"}_export.mp3`;
      }
      
      downloadBlob(blob, filename);
      
      toast({
        title: "Export complete!",
        description: `Saved as ${filename}`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "Could not export audio file. Please try again.",
        variant: "destructive",
      });
    }
    
    setShowExportModal(false);
  }, [audioBuffer, audioFile, panningEffects, toast]);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top Navigation */}
      <header className="h-16 border-b border-border flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-semibold text-lg">A</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Audio Editor</h1>
          {projectId && <span className="text-sm text-muted-foreground ml-4">{projectName}</span>}
        </div>
        
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
            data-testid="input-audio-file"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            data-testid="button-upload"
          >
            <Upload className="w-4 h-4" />
            Import Audio
          </Button>

          {audioFile && (
            <>
              <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" data-testid="button-save-project">
                    <Save className="w-4 h-4" />
                    Save Project
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Save Project</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Project name"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      data-testid="input-project-name"
                    />
                    <Button onClick={handleSaveProject} data-testid="button-confirm-save">
                      Save
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" data-testid="button-load-project">
                    <Folder className="w-4 h-4" />
                    Load Project
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Load Project</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {projects.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No saved projects</p>
                    ) : (
                      projects.map((project: any) => (
                        <Button
                          key={project.id}
                          onClick={() => loadProjectMutation.mutate(project.id)}
                          variant="ghost"
                          className="w-full justify-start"
                          data-testid={`button-load-project-${project.id}`}
                        >
                          <div className="text-left">
                            <div className="font-medium">{project.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {project.duration?.toFixed(2)}s • {new Date(project.updatedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </Button>
                      ))
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button
                onClick={() => setShowExportModal(true)}
                data-testid="button-export"
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
            </>
          )}
        </div>
      </header>

      {!audioFile ? (
        <EmptyState onUpload={() => fileInputRef.current?.click()} />
      ) : (
        <>
          {/* Main Content Area */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Waveform Visualization */}
            <div className="flex-1 border-b border-border overflow-x-auto">
              <WaveformVisualization
                audioBuffer={audioBuffer}
                currentTime={currentTime}
                panningEffects={panningEffects}
                selection={selection}
                onSelectionChange={setSelection}
                zoom={zoom}
                isPlaying={isPlaying}
                data-testid="waveform-visualization"
              />
            </div>

            {/* Playback Controls */}
            <PlaybackControls
              audioBuffer={audioBuffer}
              audioContext={audioContextRef.current}
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={audioBuffer?.duration || 0}
              panningEffects={panningEffects}
              onPlayPause={setIsPlaying}
              onTimeUpdate={setCurrentTime}
              onSeek={setCurrentTime}
              sourceNodeRef={sourceNodeRef}
            />

            {/* Timeline and Controls */}
            <div className="flex gap-4 border-t border-border p-4 bg-muted/30">
              <div className="flex-1">
                <TimelineEditor
                  duration={audioBuffer?.duration || 0}
                  currentTime={currentTime}
                  zoom={zoom}
                  onZoomChange={setZoom}
                  panningEffects={panningEffects}
                  onSeek={setCurrentTime}
                />
              </div>

              {/* Right Sidebar */}
              <div className="w-80 border-l border-border pl-4 space-y-4 overflow-y-auto">
                <PanningEffectPanel
                  duration={audioBuffer?.duration || 0}
                  currentTime={currentTime}
                  panningEffects={panningEffects}
                  onAddEffect={handleAddPanningEffect}
                  onRemoveEffect={handleRemovePanningEffect}
                  data-testid="panning-panel"
                />

                <CuttingTools
                  duration={audioBuffer?.duration || 0}
                  selection={selection}
                  onSelectionChange={setSelection}
                  audioBuffer={audioBuffer}
                  setAudioBuffer={setAudioBuffer}
                  setAudioFile={setAudioFile}
                  data-testid="cutting-tools"
                />
              </div>
            </div>
          </div>

          {/* Export Modal */}
          {audioFile && (
            <ExportModal
              audioFile={audioFile}
              onClose={() => setShowExportModal(false)}
              onExport={handleExport}
            />
          )}
        </>
      )}
    </div>
  );
}
