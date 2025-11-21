import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Volume2, Music, Radio } from "lucide-react";
import { AudioTrack } from "@shared/schema";

interface TrackListProps {
  tracks: AudioTrack[];
  onUpdateTrack: (id: string, updates: Partial<AudioTrack>) => void;
  onRemoveTrack: (id: string) => void;
  onAddTrack: () => void;
  selectedTrackId: string | null;
  onSelectTrack: (id: string) => void;
}

export default function TrackList({
  tracks,
  onUpdateTrack,
  onRemoveTrack,
  onAddTrack,
  selectedTrackId,
  onSelectTrack,
}: TrackListProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Tracks ({tracks.length})</h3>
        <Button
          onClick={onAddTrack}
          size="sm"
          variant="outline"
          className="text-xs"
          data-testid="button-add-track"
        >
          <Music className="w-3 h-3" /> Add Track
        </Button>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {tracks.length === 0 ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-muted-foreground py-4 text-center"
          >
            No tracks added yet
          </motion.p>
        ) : (
          <motion.div className="space-y-2">
            {tracks.map((track, index) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={`p-3 cursor-pointer transition-smooth ${
                    selectedTrackId === track.id
                      ? "ring-2 ring-primary bg-primary/5"
                      : "hover-elevate"
                  }`}
                  onClick={() => onSelectTrack(track.id)}
                  data-testid={`card-track-${track.id}`}
                >
              <div className="space-y-3">
                {/* Track Header */}
                <div className="flex items-center justify-between gap-2">
                  <Input
                    value={track.name}
                    onChange={(e) => onUpdateTrack(track.id, { name: e.target.value })}
                    className="h-7 text-xs font-medium flex-1"
                    placeholder={`Track ${index + 1}`}
                    onClick={(e) => e.stopPropagation()}
                    data-testid={`input-track-name-${track.id}`}
                  />
                  <Badge variant="secondary" className="text-xs">
                    {track.duration.toFixed(1)}s
                  </Badge>
                </div>

                {/* Volume Control */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Volume</span>
                    <span className="font-mono">{track.volume}%</span>
                  </div>
                  <Slider
                    value={[track.volume]}
                    onValueChange={(value) =>
                      onUpdateTrack(track.id, { volume: value[0] })
                    }
                    min={0}
                    max={100}
                    step={1}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                {/* Pan Control */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Pan</span>
                    <span className="font-mono">{track.pan > 0 ? "+" : ""}{track.pan}</span>
                  </div>
                  <Slider
                    value={[track.pan + 100]}
                    onValueChange={(value) =>
                      onUpdateTrack(track.id, { pan: value[0] - 100 })
                    }
                    min={0}
                    max={200}
                    step={1}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground text-center">
                    <span>L</span>
                    <span>C</span>
                    <span>R</span>
                  </div>
                </div>

                {/* Track Controls */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateTrack(track.id, { isMuted: !track.isMuted });
                    }}
                    data-testid={`button-mute-${track.id}`}
                  >
                    <Volume2 className={`w-3 h-3 ${track.isMuted ? "text-destructive" : ""}`} />
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateTrack(track.id, { isSolo: !track.isSolo });
                    }}
                    data-testid={`button-solo-${track.id}`}
                  >
                    <Radio className={`w-3 h-3 ${track.isSolo ? "text-chart-1" : ""}`} />
                  </Button>

                  <div className="flex-1" />

                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 flex-shrink-0 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveTrack(track.id);
                    }}
                    data-testid={`button-remove-track-${track.id}`}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
