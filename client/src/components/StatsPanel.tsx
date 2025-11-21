import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { AudioTrack, AudioEffect } from "@shared/schema";
import { BarChart3, Zap, Music } from "lucide-react";

interface StatsPanelProps {
  tracks: AudioTrack[];
  effects: AudioEffect[];
  duration: number;
  isPlaying: boolean;
  currentTime: number;
}

export default function StatsPanel({ tracks, effects, duration, isPlaying, currentTime }: StatsPanelProps) {
  const totalSize = tracks.reduce((sum, t) => sum + (t.fileSize || 0), 0);
  const effectsByType = effects.reduce(
    (acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + " " + sizes[i];
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="space-y-3 text-xs"
    >
      <Card className="p-3 bg-card/50 border border-border/50 space-y-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-3.5 h-3.5 text-chart-1" />
          <h4 className="font-semibold">Statistics</h4>
        </div>
        <Separator className="my-1" />

        <div className="grid grid-cols-2 gap-2">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="space-y-1">
            <p className="text-muted-foreground">Total Tracks</p>
            <p className="text-sm font-bold text-primary">{tracks.length}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="space-y-1">
            <p className="text-muted-foreground">Total Effects</p>
            <p className="text-sm font-bold text-chart-2">{effects.length}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="space-y-1">
            <p className="text-muted-foreground">Duration</p>
            <p className="text-sm font-bold font-mono">{formatTime(duration)}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="space-y-1">
            <p className="text-muted-foreground">Position</p>
            <p className="text-sm font-bold font-mono">
              {formatTime(currentTime)} {duration > 0 && `(${((currentTime / duration) * 100).toFixed(0)}%)`}
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="space-y-1">
            <p className="text-muted-foreground">Total Size</p>
            <p className="text-sm font-bold text-chart-3">{formatSize(totalSize)}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="space-y-1">
            <p className="text-muted-foreground">Status</p>
            <Badge variant="secondary" className="text-xs">
              {isPlaying ? "Playing" : "Stopped"}
            </Badge>
          </motion.div>
        </div>
      </Card>

      {/* Effects Summary */}
      {effects.length > 0 && (
        <Card className="p-3 bg-card/50 border border-border/50 space-y-2">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-chart-1" />
            <h4 className="font-semibold">Effects Breakdown</h4>
          </div>
          <Separator className="my-1" />

          <div className="space-y-1">
            {Object.entries(effectsByType).map(([type, count], idx) => (
              <motion.div
                key={type}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 * (idx + 1) }}
                className="flex items-center justify-between"
              >
                <span className="text-muted-foreground capitalize">{type}</span>
                <Badge variant="outline" className="text-xs">
                  {count}
                </Badge>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* Track Details */}
      {tracks.length > 0 && (
        <Card className="p-3 bg-card/50 border border-border/50 space-y-2">
          <div className="flex items-center gap-2">
            <Music className="w-3.5 h-3.5 text-chart-2" />
            <h4 className="font-semibold">Track Details</h4>
          </div>
          <Separator className="my-1" />

          <div className="space-y-2 max-h-32 overflow-y-auto">
            {tracks.map((track, idx) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.05 * idx }}
                className="p-2 rounded bg-muted/30 border border-muted/50 text-xs space-y-1"
              >
                <p className="font-semibold truncate">{track.name}</p>
                <div className="grid grid-cols-2 gap-1 text-muted-foreground">
                  <p>Duration: {track.duration.toFixed(2)}s</p>
                  <p>Rate: {track.sampleRate}Hz</p>
                  <p>Ch: {track.numberOfChannels}</p>
                  <p>Size: {formatSize(track.fileSize || 0)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      )}
    </motion.div>
  );
}
