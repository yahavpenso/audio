import { useEffect, useCallback, useState, RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Square, Volume2 } from "lucide-react";
import { PanningEffect } from "@shared/schema";

interface PlaybackControlsProps {
  audioBuffer: AudioBuffer | null;
  audioContext: AudioContext | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  panningEffects: PanningEffect[];
  onPlayPause: (playing: boolean) => void;
  onTimeUpdate: (time: number) => void;
  onSeek: (time: number) => void;
  sourceNodeRef: RefObject<AudioBufferSourceNode | null>;
}

export default function PlaybackControls({
  audioBuffer,
  audioContext,
  isPlaying,
  currentTime,
  duration,
  panningEffects,
  onPlayPause,
  onTimeUpdate,
  onSeek,
  sourceNodeRef,
}: PlaybackControlsProps) {
  const [volume, setVolume] = useState([80]);
  const [playbackStartContextTime, setPlaybackStartContextTime] = useState(0);
  const [playbackOffset, setPlaybackOffset] = useState(0);

  // Update playback time - single source of truth
  useEffect(() => {
    if (!isPlaying || !audioContext) return;

    const interval = setInterval(() => {
      const currentPosition = audioContext.currentTime - playbackStartContextTime + playbackOffset;
      
      if (currentPosition >= duration) {
        onPlayPause(false);
        onTimeUpdate(duration);
      } else {
        onTimeUpdate(currentPosition);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying, playbackStartContextTime, playbackOffset, duration, audioContext, onPlayPause, onTimeUpdate]);

  const handlePlayPause = useCallback(async () => {
    if (!audioBuffer || !audioContext) return;

    if (isPlaying) {
      // Stop playback
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
        sourceNodeRef.current = null;
      }
      onPlayPause(false);
    } else {
      // Start playback with real-time panning effects
      const { createRealtimeAudioSource } = await import("@/lib/audioProcessing");
      
      const { source, gainNode } = createRealtimeAudioSource(
        audioContext,
        audioBuffer,
        panningEffects,
        currentTime,
        volume[0] / 100
      );
      
      source.start(0, currentTime);
      sourceNodeRef.current = source;
      
      // Set single source of truth for playback position
      setPlaybackStartContextTime(audioContext.currentTime);
      setPlaybackOffset(currentTime);
      onPlayPause(true);
      
      source.onended = () => {
        if (sourceNodeRef.current === source) {
          onPlayPause(false);
        }
      };
    }
  }, [audioBuffer, audioContext, isPlaying, currentTime, volume, panningEffects, onPlayPause, sourceNodeRef]);

  const handleStop = useCallback(() => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    onPlayPause(false);
    onSeek(0);
  }, [onPlayPause, onSeek, sourceNodeRef]);

  const handleSeek = useCallback(async (value: number[]) => {
    const newTime = (value[0] / 100) * duration;
    
    if (isPlaying && sourceNodeRef.current && audioBuffer && audioContext) {
      // Restart playback from new position with effects
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
      
      const { createRealtimeAudioSource } = await import("@/lib/audioProcessing");
      
      const { source } = createRealtimeAudioSource(
        audioContext,
        audioBuffer,
        panningEffects,
        newTime,
        volume[0] / 100
      );
      
      source.start(0, newTime);
      sourceNodeRef.current = source;
      
      // Update single source of truth for new position
      setPlaybackStartContextTime(audioContext.currentTime);
      setPlaybackOffset(newTime);
      
      source.onended = () => {
        if (sourceNodeRef.current === source) {
          onPlayPause(false);
        }
      };
    }
    
    onSeek(newTime);
  }, [duration, isPlaying, audioBuffer, audioContext, volume, panningEffects, onPlayPause, onSeek, sourceNodeRef]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Transport Controls */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handleStop}
          disabled={!audioBuffer}
          data-testid="button-stop"
          className="h-10 w-10"
        >
          <Square className="w-5 h-5" />
        </Button>
        
        <Button
          size="icon"
          onClick={handlePlayPause}
          disabled={!audioBuffer}
          data-testid="button-play-pause"
          className="h-12 w-12"
        >
          {isPlaying ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6 ml-0.5" />
          )}
        </Button>
      </div>

      {/* Time Display */}
      <div className="flex items-center justify-between text-sm font-mono">
        <span className="text-foreground font-medium" data-testid="text-current-time">
          {formatTime(currentTime)}
        </span>
        <span className="text-muted-foreground">
          {formatTime(duration)}
        </span>
      </div>

      {/* Progress Slider */}
      <Slider
        value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
        onValueChange={handleSeek}
        max={100}
        step={0.1}
        disabled={!audioBuffer}
        data-testid="slider-seek"
        className="cursor-pointer"
      />

      {/* Volume Control */}
      <div className="flex items-center gap-3">
        <Volume2 className="w-4 h-4 text-muted-foreground" />
        <Slider
          value={volume}
          onValueChange={setVolume}
          max={100}
          step={1}
          data-testid="slider-volume"
          className="flex-1"
        />
        <span className="text-sm font-mono text-muted-foreground w-10 text-right">
          {volume[0]}%
        </span>
      </div>
    </div>
  );
}
