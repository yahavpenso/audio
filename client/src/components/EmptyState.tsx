import { Button } from "@/components/ui/button";
import { Upload, Music } from "lucide-react";

interface EmptyStateProps {
  onUpload: () => void;
}

export default function EmptyState({ onUpload }: EmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md space-y-6">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <Music className="w-12 h-12 text-primary" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Welcome to Audio Editor</h2>
          <p className="text-muted-foreground">
            Get started by importing an audio file. You can apply real-time effects, 
            cut and trim your audio, and export in high quality.
          </p>
        </div>
        
        <div className="space-y-3">
          <Button
            onClick={onUpload}
            size="lg"
            data-testid="button-empty-upload"
            className="gap-2"
          >
            <Upload className="w-5 h-5" />
            Import Audio File
          </Button>
          
          <div className="text-sm text-muted-foreground">
            Supports WAV, MP3, OGG, and other common audio formats
          </div>
        </div>

        <div className="pt-6 border-t border-border">
          <h3 className="text-sm font-medium mb-3">Features</h3>
          <div className="grid grid-cols-1 gap-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <span>Real-time panning effects with adjustable duration and intensity</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <span>Precise audio cutting and trimming tools</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <span>Fast export with multiple format and quality options</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
