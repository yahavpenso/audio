import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Scissors, Trash2, Play } from "lucide-react";
import { AudioSelection, AudioFile } from "@shared/schema";

interface CuttingToolsProps {
  selection: AudioSelection | null;
  duration: number;
  onSelectionChange: (selection: AudioSelection | null) => void;
  audioBuffer: AudioBuffer | null;
  setAudioBuffer: (buffer: AudioBuffer | null) => void;
  setAudioFile: (file: AudioFile | null) => void;
}

export default function CuttingTools({
  selection,
  duration,
  onSelectionChange,
  audioBuffer,
  setAudioBuffer,
  setAudioFile,
}: CuttingToolsProps) {
  const [startInput, setStartInput] = useState("");
  const [endInput, setEndInput] = useState("");

  const handleSetSelection = () => {
    const start = parseFloat(startInput) || 0;
    const end = parseFloat(endInput) || duration;
    
    if (start < end && start >= 0 && end <= duration) {
      onSelectionChange({
        startTime: start,
        endTime: end,
      });
    }
  };

  const handleCut = () => {
    if (!selection || !audioBuffer) return;

    // Create new buffer with only the selected portion
    const sampleRate = audioBuffer.sampleRate;
    const startSample = Math.floor(selection.startTime * sampleRate);
    const endSample = Math.floor(selection.endTime * sampleRate);
    const newLength = endSample - startSample;

    const newBuffer = new AudioContext().createBuffer(
      audioBuffer.numberOfChannels,
      newLength,
      sampleRate
    );

    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const oldData = audioBuffer.getChannelData(channel);
      const newData = newBuffer.getChannelData(channel);
      
      for (let i = 0; i < newLength; i++) {
        newData[i] = oldData[startSample + i];
      }
    }

    setAudioBuffer(newBuffer);
    setAudioFile({
      id: crypto.randomUUID(),
      name: "Trimmed Audio",
      duration: newBuffer.duration,
      sampleRate: newBuffer.sampleRate,
      numberOfChannels: newBuffer.numberOfChannels,
    });
    onSelectionChange(null);
  };

  const handleDeleteSelection = () => {
    if (!selection || !audioBuffer) return;

    // Create new buffer without the selected portion
    const sampleRate = audioBuffer.sampleRate;
    const startSample = Math.floor(selection.startTime * sampleRate);
    const endSample = Math.floor(selection.endTime * sampleRate);
    const beforeLength = startSample;
    const afterLength = audioBuffer.length - endSample;
    const newLength = beforeLength + afterLength;

    const newBuffer = new AudioContext().createBuffer(
      audioBuffer.numberOfChannels,
      newLength,
      sampleRate
    );

    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const oldData = audioBuffer.getChannelData(channel);
      const newData = newBuffer.getChannelData(channel);
      
      // Copy before selection
      for (let i = 0; i < beforeLength; i++) {
        newData[i] = oldData[i];
      }
      
      // Copy after selection
      for (let i = 0; i < afterLength; i++) {
        newData[beforeLength + i] = oldData[endSample + i];
      }
    }

    setAudioBuffer(newBuffer);
    setAudioFile({
      id: crypto.randomUUID(),
      name: "Edited Audio",
      duration: newBuffer.duration,
      sampleRate: newBuffer.sampleRate,
      numberOfChannels: newBuffer.numberOfChannels,
    });
    onSelectionChange(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-md bg-primary/20 flex items-center justify-center">
          <Scissors className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">Cutting Tools</h3>
          <p className="text-xs text-muted-foreground">Trim and edit audio</p>
        </div>
      </div>

      <Separator />

      {/* Manual Selection Input */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Set Selection</Label>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="start-time" className="text-xs text-muted-foreground">
              Start (s)
            </Label>
            <Input
              id="start-time"
              type="number"
              min={0}
              max={duration}
              step={0.01}
              value={startInput}
              onChange={(e) => setStartInput(e.target.value)}
              placeholder="0.00"
              className="h-8 font-mono text-sm"
              data-testid="input-start-time"
            />
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="end-time" className="text-xs text-muted-foreground">
              End (s)
            </Label>
            <Input
              id="end-time"
              type="number"
              min={0}
              max={duration}
              step={0.01}
              value={endInput}
              onChange={(e) => setEndInput(e.target.value)}
              placeholder={duration.toFixed(2)}
              className="h-8 font-mono text-sm"
              data-testid="input-end-time"
            />
          </div>
        </div>
        
        <Button
          onClick={handleSetSelection}
          variant="outline"
          className="w-full h-8 text-sm"
          data-testid="button-set-selection"
        >
          Set Selection
        </Button>
      </div>

      {/* Current Selection Info */}
      {selection && (
        <div className="p-3 bg-muted rounded-md space-y-1.5">
          <div className="text-xs font-medium">Current Selection</div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div>
              <span className="text-muted-foreground">Start:</span>
              <span className="ml-1">{selection.startTime.toFixed(3)}s</span>
            </div>
            <div>
              <span className="text-muted-foreground">End:</span>
              <span className="ml-1">{selection.endTime.toFixed(3)}s</span>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Length:</span>
              <span className="ml-1">{(selection.endTime - selection.startTime).toFixed(3)}s</span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2">
        <Button
          onClick={handleCut}
          disabled={!selection}
          variant="outline"
          className="w-full gap-2"
          data-testid="button-cut"
        >
          <Scissors className="w-4 h-4" />
          Keep Selection (Trim)
        </Button>
        
        <Button
          onClick={handleDeleteSelection}
          disabled={!selection}
          variant="outline"
          className="w-full gap-2"
          data-testid="button-delete-selection"
        >
          <Trash2 className="w-4 h-4" />
          Delete Selection
        </Button>
        
        {selection && (
          <Button
            onClick={() => onSelectionChange(null)}
            variant="ghost"
            className="w-full h-8 text-sm"
            data-testid="button-clear-selection"
          >
            Clear Selection
          </Button>
        )}
      </div>

      <div className="text-xs text-muted-foreground">
        <p>
          Drag on the waveform to create a selection, or enter precise times above.
        </p>
      </div>
    </div>
  );
}
