import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Info, Music, Clock, Database } from "lucide-react";
import { motion } from "framer-motion";
import { AudioTrack } from "@shared/schema";

interface InfoPanelProps {
  tracks: AudioTrack[];
  duration: number;
  username?: string;
}

export default function InfoPanel({ tracks, duration, username }: InfoPanelProps) {
  const totalSize = tracks.reduce((sum, t) => sum + (t.fileSize || 0), 0);
  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + " " + sizes[i];
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="p-3 sm:p-4 bg-card/50 border border-border/50 space-y-3">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-primary" />
          <h3 className="text-xs sm:text-sm font-semibold">Project Info</h3>
        </div>

        <Separator className="my-2" />

        <div className="space-y-2 text-xs">
          {username && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center justify-between"
            >
              <span className="text-muted-foreground">User</span>
              <span className="font-medium text-foreground">{username}</span>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-1 text-muted-foreground">
              <Music className="w-3 h-3" />
              Tracks
            </div>
            <span className="font-medium text-foreground">{tracks.length}</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-3 h-3" />
              Duration
            </div>
            <span className="font-mono text-foreground">{duration.toFixed(1)}s</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-1 text-muted-foreground">
              <Database className="w-3 h-3" />
              Size
            </div>
            <span className="font-mono text-foreground">{formatSize(totalSize)}</span>
          </motion.div>
        </div>

        <Separator className="my-2" />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xs text-muted-foreground space-y-1"
        >
          <p className="font-medium text-foreground mb-2">Features</p>
          <p className="flex items-center gap-2">
            <span className="text-primary">✓</span> 8 Audio Effects
          </p>
          <p className="flex items-center gap-2">
            <span className="text-primary">✓</span> Live Editing
          </p>
          <p className="flex items-center gap-2">
            <span className="text-primary">✓</span> Multi-track Support
          </p>
          <p className="flex items-center gap-2">
            <span className="text-primary">✓</span> Undo/Redo History
          </p>
        </motion.div>
      </Card>
    </motion.div>
  );
}
