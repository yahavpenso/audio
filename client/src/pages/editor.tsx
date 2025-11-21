import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Download, Undo2, Redo2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AudioTrack, AudioEffect, AudioSelection, ExportSettings } from "@shared/schema";
import { useHistory } from "@/hooks/useHistory";
import WaveformVisualization from "@/components/WaveformVisualization";
import PlaybackControls from "@/components/PlaybackControls";
import TimelineEditor from "@/components/TimelineEditor";
import EffectsPanel from "@/components/EffectsPanel";
import TrackList from "@/components/TrackList";
import ExportModal from "@/components/ExportModal";
import EmptyState from "@/components/EmptyState";
import { encodeAudioBuffer, decodeAudioTrack } from "@/lib/audioMixing";
import { exportToWAV, exportToMP3, downloadBlob, mixAudioTracks } from "@/lib/audioProcessing";

interface EditorState {
  tracks: AudioTrack[];
  effects: AudioEffect[];
  selection: AudioSelection | null;
  zoom: number;
  selectedTrackId: string | null;
}

export default function Editor() {
  const initialState: EditorState = {
    tracks: [],
    effects: [],
    selection: null,
    zoom: 1,
    selectedTrackId: null,
  };

  const { state, setState, undo, redo, canUndo, canRedo } = useHistory(initialState);
  const [trackBuffers, setTrackBuffers] = useState<Map<string, AudioBuffer>>(new Map());
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showExportModal, setShowExportModal] = useState(false);
  
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

  // Get total project duration
  const projectDuration = Math.max(...state.tracks.map(t => t.duration), 0) || 0;

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !audioContextRef.current) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      const audioData = await encodeAudioBuffer(audioBuffer);
      
      const newTrack: AudioTrack = {
        id: crypto.randomUUID(),
        name: file.name.replace(/\.[^/.]+$/, ""),
        audioData,
        volume: 100,
        pan: 0,
        isMuted: false,
        isSolo: false,
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        numberOfChannels: audioBuffer.numberOfChannels,
      };

      setState(prevState => ({
        ...prevState,
        tracks: [...prevState.tracks, newTrack],
        selectedTrackId: newTrack.id,
      }));
      
      setTrackBuffers(prev => new Map(prev).set(newTrack.id, audioBuffer));
      
      toast({
        title: "Track added",
        description: `${file.name} (${audioBuffer.duration.toFixed(2)}s)`,
      });
    } catch (error) {
      toast({
        title: "Error loading audio",
        description: "Could not decode audio file.",
        variant: "destructive",
      });
    }
  }, [setState, toast]);

  const handleAddTrack = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleUpdateTrack = useCallback((id: string, updates: Partial<AudioTrack>) => {
    setState(prevState => ({
      ...prevState,
      tracks: prevState.tracks.map(t => t.id === id ? { ...t, ...updates } : t),
    }));
  }, [setState]);

  const handleRemoveTrack = useCallback((id: string) => {
    setState(prevState => ({
      ...prevState,
      tracks: prevState.tracks.filter(t => t.id !== id),
      selectedTrackId: prevState.selectedTrackId === id ? prevState.tracks[0]?.id || null : prevState.selectedTrackId,
    }));
    setTrackBuffers(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  }, [setState]);

  const handleAddEffect = useCallback((effect: AudioEffect) => {
    setState(prevState => ({
      ...prevState,
      effects: [...prevState.effects, effect],
    }));
    toast({
      title: `${effect.type} effect added`,
      description: `Applied at ${effect.startTime.toFixed(2)}s`,
    });
  }, [setState, toast]);

  const handleRemoveEffect = useCallback((id: string) => {
    setState(prevState => ({
      ...prevState,
      effects: prevState.effects.filter(e => e.id !== id),
    }));
  }, [setState]);

  const handleSelectionChange = useCallback((selection: AudioSelection | null) => {
    setState(prevState => ({
      ...prevState,
      selection,
    }));
  }, [setState]);

  const handleZoomChange = useCallback((zoom: number) => {
    setState(prevState => ({
      ...prevState,
      zoom,
    }));
  }, [setState]);

  const handleSelectTrack = useCallback((id: string) => {
    setState(prevState => ({
      ...prevState,
      selectedTrackId: id,
    }));
  }, [setState]);

  const handleExport = useCallback(async (settings: ExportSettings) => {
    if (state.tracks.length === 0 || !audioContextRef.current) return;
    
    toast({
      title: "Exporting audio...",
      description: "Mixing and processing tracks",
    });
    
    try {
      const trackData = await Promise.all(
        state.tracks.map(async (track) => ({
          buffer: trackBuffers.get(track.id) || await decodeAudioTrack(audioContextRef.current!, track.audioData),
          volume: track.volume,
          pan: track.pan,
          isMuted: track.isMuted,
          isSolo: track.isSolo,
        }))
      );

      const maxDuration = Math.max(...trackData.map(t => t.buffer.duration));
      const sampleRate = trackData[0]?.buffer.sampleRate || 44100;
      const offlineContext = new OfflineAudioContext(2, Math.ceil(maxDuration * sampleRate), sampleRate);
      
      const mixedBuffer = await mixAudioTracks(offlineContext, trackData);
      
      let finalBuffer = mixedBuffer;
      if (state.effects.length > 0) {
        const { applyAllEffects } = await import("@/lib/audioProcessing");
        finalBuffer = await applyAllEffects(mixedBuffer, state.effects);
      }
      
      let blob: Blob;
      let filename: string;
      
      if (settings.format === "wav") {
        blob = exportToWAV(finalBuffer, settings.sampleRate, settings.bitDepth);
        filename = "exported_audio.wav";
      } else {
        blob = exportToMP3(finalBuffer, settings.bitrate);
        filename = "exported_audio.mp3";
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
        variant: "destructive",
      });
    }
    
    setShowExportModal(false);
  }, [state.tracks, state.effects, trackBuffers, toast]);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top Navigation */}
      <header className="h-16 border-b border-border flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-semibold text-lg">A</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Audio Editor</h1>
          <span className="text-xs text-muted-foreground ml-4">{state.tracks.length} tracks</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={undo}
            disabled={!canUndo}
            variant="outline"
            size="icon"
            data-testid="button-undo"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </Button>
          
          <Button
            onClick={redo}
            disabled={!canRedo}
            variant="outline"
            size="icon"
            data-testid="button-redo"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </Button>

          <div className="w-px h-6 bg-border" />

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
            data-testid="input-audio-file"
          />
          <Button
            onClick={handleAddTrack}
            variant="outline"
            data-testid="button-add-track"
          >
            <Upload className="w-4 h-4" />
            Add Track
          </Button>

          {state.tracks.length > 0 && (
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

      {state.tracks.length === 0 ? (
        <EmptyState onUpload={handleAddTrack} />
      ) : (
        <>
          {/* Main Content Area */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Waveform and Playback */}
            <div className="flex-1 border-b border-border overflow-hidden flex flex-col p-6">
              <WaveformVisualization
                audioBuffer={trackBuffers.get(state.selectedTrackId || "") || null}
                currentTime={currentTime}
                panningEffects={state.effects.filter((e): e is any => e.type === "panning")}
                selection={state.selection}
                onSelectionChange={handleSelectionChange}
                zoom={state.zoom}
                isPlaying={isPlaying}
              />
              
              <div className="mt-6">
                <PlaybackControls
                  audioBuffer={trackBuffers.get(state.selectedTrackId || "") || null}
                  audioContext={audioContextRef.current}
                  isPlaying={isPlaying}
                  currentTime={currentTime}
                  duration={projectDuration}
                  effects={state.effects}
                  onPlayPause={setIsPlaying}
                  onTimeUpdate={setCurrentTime}
                  onSeek={setCurrentTime}
                  sourceNodeRef={sourceNodeRef}
                />
              </div>
            </div>

            {/* Timeline */}
            <div className="h-32 border-t border-border">
              <TimelineEditor
                duration={projectDuration}
                currentTime={currentTime}
                effects={state.effects}
                zoom={state.zoom}
                onZoomChange={handleZoomChange}
                onSeek={setCurrentTime}
              />
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-80 border-l border-border flex flex-col overflow-hidden bg-card">
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <TrackList
                tracks={state.tracks}
                onUpdateTrack={handleUpdateTrack}
                onRemoveTrack={handleRemoveTrack}
                onAddTrack={handleAddTrack}
                selectedTrackId={state.selectedTrackId}
                onSelectTrack={handleSelectTrack}
              />
              
              <div className="border-t pt-4">
                <EffectsPanel
                  duration={projectDuration}
                  currentTime={currentTime}
                  effects={state.effects}
                  onAddEffect={handleAddEffect}
                  onRemoveEffect={handleRemoveEffect}
                />
              </div>
            </div>
          </div>

          {/* Export Modal */}
          {showExportModal && (
            <ExportModal
              audioFile={{ id: "export", name: "Project", duration: projectDuration, sampleRate: 44100, numberOfChannels: 2 }}
              onClose={() => setShowExportModal(false)}
              onExport={handleExport}
            />
          )}
        </>
      )}

      {/* Keyboard Shortcuts */}
      <KeyboardShortcuts onUndo={undo} onRedo={redo} canUndo={canUndo} canRedo={canRedo} />
    </div>
  );
}

function KeyboardShortcuts({ onUndo, onRedo, canUndo, canRedo }: { onUndo: () => void; onRedo: () => void; canUndo: boolean; canRedo: boolean }) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && canUndo) {
        e.preventDefault();
        onUndo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.shiftKey && e.key === "Z")) && canRedo) {
        e.preventDefault();
        onRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onUndo, onRedo, canUndo, canRedo]);

  return null;
}
