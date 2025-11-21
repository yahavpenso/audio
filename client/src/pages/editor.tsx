import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AudioTrack, AudioEffect, AudioSelection, ExportSettings } from "@shared/schema";
import WaveformVisualization from "@/components/WaveformVisualization";
import PlaybackControls from "@/components/PlaybackControls";
import TimelineEditor from "@/components/TimelineEditor";
import EffectsPanel from "@/components/EffectsPanel";
import TrackList from "@/components/TrackList";
import ExportModal from "@/components/ExportModal";
import EmptyState from "@/components/EmptyState";
import { encodeAudioBuffer, decodeAudioTrack, mixAudioTracks } from "@/lib/audioMixing";
import { exportToWAV, exportToMP3, downloadBlob, mixAudioTracks as mixTracks } from "@/lib/audioProcessing";

export default function Editor() {
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [trackBuffers, setTrackBuffers] = useState<Map<string, AudioBuffer>>(new Map());
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [effects, setEffects] = useState<AudioEffect[]>([]);
  const [selection, setSelection] = useState<AudioSelection | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodesRef = useRef<Map<string, AudioBufferSourceNode>>(new Map());
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
  const projectDuration = Math.max(...tracks.map(t => t.duration), 0) || 0;

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

      setTracks(prev => [...prev, newTrack]);
      setTrackBuffers(prev => new Map(prev).set(newTrack.id, audioBuffer));
      setSelectedTrackId(newTrack.id);
      
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
  }, [toast]);

  const handleAddTrack = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleUpdateTrack = useCallback((id: string, updates: Partial<AudioTrack>) => {
    setTracks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const handleRemoveTrack = useCallback((id: string) => {
    setTracks(prev => prev.filter(t => t.id !== id));
    setTrackBuffers(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
    if (selectedTrackId === id) {
      setSelectedTrackId(tracks[0]?.id || null);
    }
  }, [tracks, selectedTrackId]);

  const handleAddEffect = useCallback((effect: AudioEffect) => {
    setEffects(prev => [...prev, effect]);
    toast({
      title: `${effect.type} effect added`,
      description: `Applied at ${effect.startTime.toFixed(2)}s`,
    });
  }, [toast]);

  const handleRemoveEffect = useCallback((id: string) => {
    setEffects(prev => prev.filter(e => e.id !== id));
  }, []);

  const handleExport = useCallback(async (settings: ExportSettings) => {
    if (tracks.length === 0 || !audioContextRef.current) return;
    
    toast({
      title: "Exporting audio...",
      description: "Mixing and processing tracks",
    });
    
    try {
      // Decode all tracks
      const trackData = await Promise.all(
        tracks.map(async (track) => ({
          buffer: trackBuffers.get(track.id) || await decodeAudioTrack(audioContextRef.current!, track.audioData),
          volume: track.volume,
          pan: track.pan,
          isMuted: track.isMuted,
          isSolo: track.isSolo,
        }))
      );

      // Create offline context and mix
      const maxDuration = Math.max(...trackData.map(t => t.buffer.duration));
      const sampleRate = trackData[0]?.buffer.sampleRate || 44100;
      const offlineContext = new OfflineAudioContext(2, Math.ceil(maxDuration * sampleRate), sampleRate);
      
      const mixedBuffer = await mixTracks(offlineContext, trackData);
      
      // Apply effects
      let finalBuffer = mixedBuffer;
      if (effects.length > 0) {
        const { applyAllEffects } = await import("@/lib/audioProcessing");
        finalBuffer = await applyAllEffects(mixedBuffer, effects);
      }
      
      // Export
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
  }, [tracks, trackBuffers, effects, toast]);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top Navigation */}
      <header className="h-16 border-b border-border flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-semibold text-lg">A</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Audio Editor</h1>
          <span className="text-xs text-muted-foreground ml-4">{tracks.length} tracks</span>
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
            onClick={handleAddTrack}
            variant="outline"
            data-testid="button-add-track"
          >
            <Upload className="w-4 h-4" />
            Add Track
          </Button>

          {tracks.length > 0 && (
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

      {tracks.length === 0 ? (
        <EmptyState onUpload={handleAddTrack} />
      ) : (
        <>
          {/* Main Content Area */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Waveform and Playback */}
            <div className="flex-1 border-b border-border overflow-hidden flex flex-col p-6">
              <WaveformVisualization
                audioBuffer={trackBuffers.get(selectedTrackId || "") || null}
                currentTime={currentTime}
                panningEffects={effects.filter((e): e is any => e.type === "panning")}
                selection={selection}
                onSelectionChange={setSelection}
                zoom={zoom}
                isPlaying={isPlaying}
              />
              
              <div className="mt-6">
                <PlaybackControls
                  audioBuffer={trackBuffers.get(selectedTrackId || "") || null}
                  audioContext={audioContextRef.current}
                  isPlaying={isPlaying}
                  currentTime={currentTime}
                  duration={projectDuration}
                  effects={effects}
                  onPlayPause={setIsPlaying}
                  onTimeUpdate={setCurrentTime}
                  onSeek={setCurrentTime}
                  sourceNodeRef={{ current: sourceNodesRef.current.get(selectedTrackId || "") || null } as any}
                />
              </div>
            </div>

            {/* Timeline */}
            <div className="h-32 border-t border-border">
              <TimelineEditor
                duration={projectDuration}
                currentTime={currentTime}
                effects={effects}
                zoom={zoom}
                onZoomChange={setZoom}
                onSeek={setCurrentTime}
              />
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-80 border-l border-border flex flex-col overflow-hidden bg-card">
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <TrackList
                tracks={tracks}
                onUpdateTrack={handleUpdateTrack}
                onRemoveTrack={handleRemoveTrack}
                onAddTrack={handleAddTrack}
                selectedTrackId={selectedTrackId}
                onSelectTrack={setSelectedTrackId}
              />
              
              <div className="border-t pt-4">
                <EffectsPanel
                  duration={projectDuration}
                  currentTime={currentTime}
                  effects={effects}
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
    </div>
  );
}
