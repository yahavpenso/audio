import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Download, FileAudio } from "lucide-react";
import { AudioFile, ExportSettings } from "@shared/schema";

interface ExportModalProps {
  audioFile: AudioFile;
  onClose: () => void;
  onExport: (settings: ExportSettings) => void;
}

export default function ExportModal({ audioFile, onClose, onExport }: ExportModalProps) {
  const [format, setFormat] = useState<"wav" | "mp3">("wav");
  const [sampleRate, setSampleRate] = useState<number>(44100);
  const [bitDepth, setBitDepth] = useState<number>(16);
  const [bitrate, setBitrate] = useState([192]);

  const handleExport = () => {
    const settings: ExportSettings = format === "wav"
      ? { format: "wav", sampleRate, bitDepth }
      : { format: "mp3", bitrate: bitrate[0] };
    
    onExport(settings);
  };

  const estimateFileSize = () => {
    if (format === "wav") {
      // WAV size = sample rate * bit depth * channels * duration / 8
      const bytes = sampleRate * bitDepth * audioFile.numberOfChannels * audioFile.duration / 8;
      return (bytes / 1024 / 1024).toFixed(2);
    } else {
      // MP3 size ≈ bitrate * duration / 8
      const bytes = bitrate[0] * 1000 * audioFile.duration / 8;
      return (bytes / 1024 / 1024).toFixed(2);
    }
  };

  const getBitrateQuality = (value: number) => {
    if (value <= 128) return "Good";
    if (value <= 192) return "Very Good";
    if (value <= 256) return "Excellent";
    return "Highest";
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" data-testid="dialog-export">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-primary/20 flex items-center justify-center">
              <FileAudio className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Export Audio</DialogTitle>
              <DialogDescription>
                Configure export settings for your audio file
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* File Info */}
          <div className="p-4 bg-muted rounded-md space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{audioFile.name}</span>
              <Badge variant="secondary">{audioFile.duration.toFixed(2)}s</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>
                <span>Sample Rate:</span>
                <span className="ml-1 font-mono">{audioFile.sampleRate}Hz</span>
              </div>
              <div>
                <span>Channels:</span>
                <span className="ml-1 font-mono">{audioFile.numberOfChannels}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Export Format</Label>
            
            <RadioGroup value={format} onValueChange={(v) => setFormat(v as "wav" | "mp3")}>
              <div className="flex items-start space-x-3 p-3 rounded-md border border-border hover-elevate">
                <RadioGroupItem value="wav" id="format-wav" data-testid="radio-format-wav" />
                <div className="flex-1 space-y-1">
                  <Label htmlFor="format-wav" className="font-medium cursor-pointer">
                    WAV (Uncompressed)
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Lossless audio quality, larger file size. Best for professional use.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 rounded-md border border-border hover-elevate">
                <RadioGroupItem value="mp3" id="format-mp3" data-testid="radio-format-mp3" />
                <div className="flex-1 space-y-1">
                  <Label htmlFor="format-mp3" className="font-medium cursor-pointer">
                    MP3 (Compressed)
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Smaller file size with configurable quality. Great for sharing.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Format-specific Options */}
          {format === "wav" ? (
            <div className="space-y-4">
              <Label className="text-base font-semibold">WAV Settings</Label>
              
              <div className="space-y-3">
                <Label htmlFor="sample-rate" className="text-sm">Sample Rate</Label>
                <Select value={sampleRate.toString()} onValueChange={(v) => setSampleRate(parseInt(v))}>
                  <SelectTrigger id="sample-rate" data-testid="select-sample-rate">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="44100">44100 Hz (CD Quality)</SelectItem>
                    <SelectItem value="48000">48000 Hz (Professional)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="bit-depth" className="text-sm">Bit Depth</Label>
                <Select value={bitDepth.toString()} onValueChange={(v) => setBitDepth(parseInt(v))}>
                  <SelectTrigger id="bit-depth" data-testid="select-bit-depth">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="16">16-bit (Standard)</SelectItem>
                    <SelectItem value="24">24-bit (High Quality)</SelectItem>
                    <SelectItem value="32">32-bit (Maximum Quality)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Label className="text-base font-semibold">MP3 Settings</Label>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="bitrate" className="text-sm">Bitrate</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{bitrate[0]} kbps</Badge>
                    <Badge variant="secondary">{getBitrateQuality(bitrate[0])}</Badge>
                  </div>
                </div>
                
                <Slider
                  id="bitrate"
                  value={bitrate}
                  onValueChange={setBitrate}
                  min={128}
                  max={320}
                  step={64}
                  data-testid="slider-bitrate"
                />
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>128 kbps</span>
                  <span>192 kbps</span>
                  <span>256 kbps</span>
                  <span>320 kbps</span>
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* File Size Estimate */}
          <div className="p-4 bg-primary/5 rounded-md border border-primary/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Estimated File Size</span>
              <span className="text-lg font-semibold font-mono">
                ~{estimateFileSize()} MB
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="button-cancel-export">
            Cancel
          </Button>
          <Button onClick={handleExport} data-testid="button-confirm-export" className="gap-2">
            <Download className="w-4 h-4" />
            Export {format.toUpperCase()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
