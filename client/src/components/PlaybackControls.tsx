import { useCallback, useState, MutableRefObject } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Square, Volume2 } from "lucide-react";
import { AudioEffect } from "@shared/schema";

interface PlaybackControlsProps {
  audioBuffer: AudioBuffer | null;
  audioContext: AudioContext | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  effects: AudioEffect[];
  onPlayPause: (playing: boolean) => void;
  onTimeUpdate: (time: number) => void;
  onSeek: (time: number) => void;
  sourceNodeRef: MutableRefObject<AudioBufferSourceNode | null>;
  onLivePlay?: (startTime: number) => void;
  onLiveStop?: () => void;
}

export default function PlaybackControls({
  audioBuffer,
  audioContext,
  isPlaying,
  currentTime,
  duration,
  effects,
  onPlayPause,
  onTimeUpdate,
  onSeek,
  sourceNodeRef,
  onLivePlay,
  onLiveStop,
}: PlaybackControlsProps) {
  const [volume, setVolume] = useState([80]);

  const handlePlayPause = useCallback(() => {
    if (!audioBuffer || !audioContext) return;

    if (isPlaying) {
      onLiveStop?.();
      onPlayPause(false);
    } else {
      onLivePlay?.(currentTime);
      onPlayPause(true);
    }
  }, [audioBuffer, audioContext, isPlaying, currentTime, onLivePlay, onLiveStop, onPlayPause]);

  const handleStop = useCallback(() => {
    onLiveStop?.();
    onPlayPause(false);
    onSeek(0);
  }, [onLiveStop, onPlayPause, onSeek]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-2 sm:space-y-4">
      <div className="flex items-center justify-center gap-1 sm:gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handleStop}
          disabled={!audioBuffer}
          data-testid="button-stop"
          className="h-8 w-8 sm:h-10 sm:w-10"
          title="Stop (Space)"
        >
          <Square className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
        
        <Button
          size="icon"
          onClick={handlePlayPause}
          disabled={!audioBuffer}
          data-testid="button-play-pause"
          className="h-10 w-10 sm:h-12 sm:w-12"
          title="Play/Pause (Space)"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 sm:w-6 sm:h-6" />
          ) : (
            <Play className="w-6 h-6 ml-0.5" />
          )}
        </Button>
      </div>

      <div className="flex items-center justify-between text-sm font-mono">
        <span className="text-foreground font-medium" data-testid="text-current-time">
          {formatTime(currentTime)}
        </span>
        <span className="text-muted-foreground">
          {formatTime(duration)}
        </span>
      </div>

      <Slider
        value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
        onValueChange={(value) => onSeek((value[0] / 100) * duration)}
        max={100}
        step={0.1}
        disabled={!audioBuffer}
        data-testid="slider-seek"
        className="cursor-pointer"
      />

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
