import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut } from "lucide-react";
import { PanningEffect } from "@shared/schema";

interface TimelineEditorProps {
  duration: number;
  currentTime: number;
  panningEffects: PanningEffect[];
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onSeek: (time: number) => void;
}

export default function TimelineEditor({
  duration,
  currentTime,
  panningEffects,
  zoom,
  onZoomChange,
  onSeek,
}: TimelineEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = containerRef.current.offsetWidth;
    const height = 128;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Draw time ruler
    const rulerHeight = 30;
    ctx.fillStyle = 'hsl(var(--muted))';
    ctx.fillRect(0, 0, width, rulerHeight);

    ctx.strokeStyle = 'hsl(var(--border))';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, rulerHeight);
    ctx.lineTo(width, rulerHeight);
    ctx.stroke();

    // Draw time markers
    const timeInterval = Math.max(1, Math.floor(duration / 10));
    ctx.fillStyle = 'hsl(var(--foreground))';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';

    for (let i = 0; i <= duration; i += timeInterval) {
      const x = (i / duration) * width * zoom;
      
      ctx.strokeStyle = 'hsl(var(--border))';
      ctx.beginPath();
      ctx.moveTo(x, rulerHeight - 5);
      ctx.lineTo(x, height);
      ctx.stroke();
      
      const mins = Math.floor(i / 60);
      const secs = Math.floor(i % 60);
      ctx.fillText(`${mins}:${secs.toString().padStart(2, '0')}`, x, 18);
    }

    // Draw effect markers
    panningEffects.forEach((effect, index) => {
      const startX = (effect.startTime / duration) * width * zoom;
      const effectWidth = (effect.duration / duration) * width * zoom;
      
      ctx.fillStyle = 'hsl(var(--chart-2) / 0.6)';
      ctx.fillRect(startX, rulerHeight, effectWidth, height - rulerHeight);
      
      ctx.strokeStyle = 'hsl(var(--chart-2))';
      ctx.lineWidth = 2;
      ctx.strokeRect(startX, rulerHeight, effectWidth, height - rulerHeight);
      
      // Effect label
      ctx.fillStyle = 'hsl(var(--card-foreground))';
      ctx.font = '500 12px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`Pan ${effect.intensity}%`, startX + 8, rulerHeight + 20);
      ctx.font = '11px Inter, sans-serif';
      ctx.fillStyle = 'hsl(var(--muted-foreground))';
      ctx.fillText(`${effect.duration.toFixed(1)}s`, startX + 8, rulerHeight + 36);
    });

    // Draw playhead
    const playheadX = (currentTime / duration) * width * zoom;
    ctx.strokeStyle = 'hsl(var(--destructive))';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();

    // Playhead handle
    ctx.fillStyle = 'hsl(var(--destructive))';
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX - 6, 12);
    ctx.lineTo(playheadX + 6, 12);
    ctx.closePath();
    ctx.fill();
  }, [duration, currentTime, panningEffects, zoom]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = (x / (rect.width * zoom)) * duration;
    
    onSeek(Math.max(0, Math.min(duration, time)));
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <span className="text-sm font-medium">Timeline</span>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onZoomChange(Math.max(1, zoom - 0.5))}
            disabled={zoom <= 1}
            data-testid="button-zoom-out"
            className="h-8 w-8"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          
          <span className="text-xs text-muted-foreground font-mono w-12 text-center">
            {zoom.toFixed(1)}x
          </span>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onZoomChange(Math.min(5, zoom + 0.5))}
            disabled={zoom >= 5}
            data-testid="button-zoom-in"
            className="h-8 w-8"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <div ref={containerRef} className="flex-1 overflow-x-auto">
        <canvas
          ref={canvasRef}
          className="cursor-pointer"
          onClick={handleCanvasClick}
          data-testid="canvas-timeline"
        />
      </div>
    </div>
  );
}
