import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Download, Scissors, Undo2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AudioFile, PanningEffect, AudioSelection, ExportSettings } from "@shared/schema";
import WaveformVisualization from "@/components/WaveformVisualization";
import PlaybackControls from "@/components/PlaybackControls";
import TimelineEditor from "@/components/TimelineEditor";
import PanningEffectPanel from "@/components/PanningEffectPanel";
import CuttingTools from "@/components/CuttingTools";
import ExportModal from "@/components/ExportModal";
import EmptyState from "@/components/EmptyState";

export default function Editor() {
  const [audioFile, setAudioFile] = useState<AudioFile | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [panningEffects, setPanningEffects] = useState<PanningEffect[]>([]);
  const [selection, setSelection] = useState<AudioSelection | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
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

  const handleExport = useCallback(async (settings: ExportSettings) => {
    if (!audioBuffer) return;
    
    toast({
      title: "Exporting audio...",
      description: "Processing your audio file with effects",
    });
    
    try {
      // Import audio processing utilities
      const { applyPanningEffects, exportToWAV, exportToMP3, downloadBlob } = await import("@/lib/audioProcessing");
      
      // Apply all panning effects to the audio
      const processedBuffer = await applyPanningEffects(audioBuffer, panningEffects);
      
      // Export based on format
      let blob: Blob;
      let filename: string;
      
      if (settings.format === "wav") {
        blob = exportToWAV(processedBuffer, settings.sampleRate, settings.bitDepth);
        filename = `${audioFile?.name.replace(/\.[^/.]+$/, "") || "audio"}_export.wav`;
      } else {
        blob = exportToMP3(processedBuffer, settings.bitrate);
        filename = `${audioFile?.name.replace(/\.[^/.]+$/, "") || "audio"}_export.mp3`;
      }
      
      // Download the file
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
            <Button
              onClick={() => setShowExportModal(true)}
              data-testid="button-export"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {!audioFile ? (
          <EmptyState onUpload={() => fileInputRef.current?.click()} />
        ) : (
          <>
            {/* Central Workspace */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Waveform Display */}
              <div className="flex-1 flex flex-col p-6 overflow-auto">
                <WaveformVisualization
                  audioBuffer={audioBuffer}
                  currentTime={currentTime}
                  panningEffects={panningEffects}
                  selection={selection}
                  onSelectionChange={setSelection}
                  zoom={zoom}
                  isPlaying={isPlaying}
                />
                
                {/* Playback Controls */}
                <div className="mt-6">
                  <PlaybackControls
                    audioBuffer={audioBuffer}
                    audioContext={audioContextRef.current}
                    isPlaying={isPlaying}
                    currentTime={currentTime}
                    duration={audioFile.duration}
                    panningEffects={panningEffects}
                    onPlayPause={setIsPlaying}
                    onTimeUpdate={setCurrentTime}
                    onSeek={setCurrentTime}
                    sourceNodeRef={sourceNodeRef}
                  />
                </div>
              </div>

              {/* Timeline Editor */}
              <div className="h-32 border-t border-border">
                <TimelineEditor
                  duration={audioFile.duration}
                  currentTime={currentTime}
                  panningEffects={panningEffects}
                  zoom={zoom}
                  onZoomChange={setZoom}
                  onSeek={setCurrentTime}
                />
              </div>
            </div>

            {/* Right Sidebar - Effect Controls */}
            <div className="w-80 border-l border-border flex flex-col overflow-hidden bg-card">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Cutting Tools */}
                <CuttingTools
                  selection={selection}
                  duration={audioFile.duration}
                  onSelectionChange={setSelection}
                  audioBuffer={audioBuffer}
                  setAudioBuffer={setAudioBuffer}
                  setAudioFile={setAudioFile}
                />

                {/* Panning Effect Panel */}
                <PanningEffectPanel
                  duration={audioFile.duration}
                  currentTime={currentTime}
                  panningEffects={panningEffects}
                  onAddEffect={handleAddPanningEffect}
                  onRemoveEffect={handleRemovePanningEffect}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Export Modal */}
      {showExportModal && audioFile && (
        <ExportModal
          audioFile={audioFile}
          onClose={() => setShowExportModal(false)}
          onExport={handleExport}
        />
      )}
    </div>
  );
}
