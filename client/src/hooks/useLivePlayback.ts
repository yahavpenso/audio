import { useRef, useCallback, useEffect, useState } from "react";
import { AudioTrack, AudioEffect } from "@shared/schema";

interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  startTime: number;
}

interface TrackNode {
  source: AudioBufferSourceNode;
  gainNode: GainNode;
  pannerNode: StereoPannerNode;
  id: string;
}

export function useLivePlayback(
  audioContext: AudioContext | null,
  tracks: AudioTrack[],
  trackBuffers: Map<string, AudioBuffer>,
  effects: AudioEffect[]
) {
  const playbackStateRef = useRef<PlaybackState>({
    isPlaying: false,
    currentTime: 0,
    startTime: 0,
  });

  const trackNodesRef = useRef<Map<string, TrackNode>>(new Map());
  const animationFrameRef = useRef<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

  // Update current time during playback
  useEffect(() => {
    if (!playbackStateRef.current.isPlaying || !audioContext) return;

    const updateTime = () => {
      const elapsed = audioContext.currentTime - playbackStateRef.current.startTime;
      playbackStateRef.current.currentTime += elapsed / 1000;
      setCurrentTime(playbackStateRef.current.currentTime);
      animationFrameRef.current = requestAnimationFrame(updateTime);
    };

    animationFrameRef.current = requestAnimationFrame(updateTime);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [playbackStateRef.current.isPlaying, audioContext]);

  const start = useCallback(
    async (startTime: number = 0) => {
      if (!audioContext) return;

      // Stop any existing playback
      Array.from(trackNodesRef.current.values()).forEach((node) => {
        try {
          node.source.stop();
          node.source.disconnect();
        } catch (e) {
          // Already stopped
        }
      });
      trackNodesRef.current.clear();

      // Create master gain node
      const masterGain = audioContext.createGain();
      masterGain.connect(audioContext.destination);

      // Start all tracks
      for (const track of tracks) {
        const buffer = trackBuffers.get(track.id);
        if (!buffer) continue;

        const source = audioContext.createBufferSource();
        source.buffer = buffer;

        const gainNode = audioContext.createGain();
        gainNode.gain.value = track.isMuted ? 0 : track.volume / 100;

        const pannerNode = audioContext.createStereoPanner();
        pannerNode.pan.value = track.pan / 100;

        source.connect(gainNode);
        gainNode.connect(pannerNode);
        pannerNode.connect(masterGain);

        source.start(0, startTime);

        trackNodesRef.current.set(track.id, {
          source,
          gainNode,
          pannerNode,
          id: track.id,
        });
      }

      playbackStateRef.current = {
        isPlaying: true,
        currentTime: startTime,
        startTime: audioContext.currentTime - startTime,
      };
    },
    [audioContext, tracks, trackBuffers]
  );

  const stop = useCallback(() => {
    Array.from(trackNodesRef.current.values()).forEach((node) => {
      try {
        node.source.stop();
        node.source.disconnect();
      } catch (e) {
        // Already stopped
      }
    });
    trackNodesRef.current.clear();
    playbackStateRef.current.isPlaying = false;
    setCurrentTime(0);
  }, []);

  // Live update track volume
  const updateTrackVolume = useCallback((trackId: string, volume: number) => {
    const node = trackNodesRef.current.get(trackId);
    if (node) {
      const isMuted = tracks.find((t) => t.id === trackId)?.isMuted ?? false;
      node.gainNode.gain.setValueAtTime(isMuted ? 0 : volume / 100, audioContext!.currentTime);
    }
  }, [audioContext, tracks]);

  // Live update track pan
  const updateTrackPan = useCallback((trackId: string, pan: number) => {
    const node = trackNodesRef.current.get(trackId);
    if (node) {
      node.pannerNode.pan.setValueAtTime(pan / 100, audioContext!.currentTime);
    }
  }, [audioContext]);

  // Live update track mute
  const updateTrackMute = useCallback((trackId: string, isMuted: boolean) => {
    const node = trackNodesRef.current.get(trackId);
    if (node) {
      const track = tracks.find((t) => t.id === trackId);
      node.gainNode.gain.setValueAtTime(isMuted ? 0 : (track?.volume ?? 100) / 100, audioContext!.currentTime);
    }
  }, [audioContext, tracks]);

  // Live update track solo
  const updateTrackSolo = useCallback(() => {
    const hasSolo = tracks.some((t) => t.isSolo);
    for (const track of tracks) {
      const node = trackNodesRef.current.get(track.id);
      if (node) {
        const shouldPlay = !track.isMuted && (!hasSolo || track.isSolo);
        node.gainNode.gain.setValueAtTime(shouldPlay ? track.volume / 100 : 0, audioContext!.currentTime);
      }
    }
  }, [audioContext, tracks]);

  return {
    start,
    stop,
    isPlaying: playbackStateRef.current.isPlaying,
    currentTime,
    updateTrackVolume,
    updateTrackPan,
    updateTrackMute,
    updateTrackSolo,
  };
}
