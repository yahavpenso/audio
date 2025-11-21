import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut } from "lucide-react";
import { AudioEffect } from "@shared/schema";

interface TimelineEditorProps {
  duration: number;
  currentTime: number;
  effects: AudioEffect[];
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onSeek: (time: number) => void;
}

export default function TimelineEditor({
  duration,
  currentTime,
  effects,
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

    // Draw ruler
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
    ctx.fillStyle = 'hsl(var(--muted-foreground))';
    ctx.font = '12px system-ui';
    const pixelsPerSecond = (width / duration) * zoom;
    const markerInterval = Math.pow(10, Math.floor(Math.log10(1 / pixelsPerSecond)));

    for (let i = 0; i <= duration; i += markerInterval) {
      const x = (i / duration) * width * zoom;
      if (x > width) break;

      ctx.beginPath();
      ctx.moveTo(x, rulerHeight - 5);
      ctx.lineTo(x, rulerHeight);
      ctx.stroke();

      if (i % (markerInterval * 5) === 0) {
        ctx.fillText(i.toFixed(0) + 's', x + 4, 18);
      }
    }

    // Draw effect regions
    effects.forEach((effect) => {
      const startX = (effect.startTime / duration) * width * zoom;
      const endX = ((effect.startTime + effect.duration) / duration) * width * zoom;
      const color = getEffectColor(effect.type);

      ctx.fillStyle = color + '40';
      ctx.fillRect(startX, rulerHeight, endX - startX, height - rulerHeight);
      ctx.strokeStyle = color;
      ctx.strokeRect(startX, rulerHeight, endX - startX, height - rulerHeight);
    });

    // Draw playhead
    const playheadX = (currentTime / duration) * width * zoom;
    ctx.strokeStyle = 'hsl(var(--chart-1))';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();

    // Click handler
    const handleCanvasClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const time = (x / (width * zoom)) * duration;
      onSeek(Math.max(0, Math.min(time, duration)));
    };

    canvas.addEventListener('click', handleCanvasClick);
    return () => canvas.removeEventListener('click', handleCanvasClick);
  }, [duration, currentTime, effects, zoom, onSeek]);

  function getEffectColor(type: string): string {
    const colors: Record<string, string> = {
      panning: 'hsl(var(--chart-2))',
      reverb: 'hsl(var(--chart-3))',
      delay: 'hsl(var(--chart-4))',
      eq: 'hsl(var(--chart-5))',
      compressor: 'hsl(var(--chart-1))',
    };
    return colors[type] || 'hsl(var(--chart-1))';
  }

  return (
    <div className="flex flex-col h-full bg-muted/30">
      <div className="flex items-center justify-between p-2 border-b border-border">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onZoomChange(Math.max(1, zoom - 1))}
            className="h-8 w-8"
            data-testid="button-zoom-out"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-xs font-mono text-muted-foreground w-8 text-center">{zoom}x</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onZoomChange(Math.min(8, zoom + 1))}
            className="h-8 w-8"
            data-testid="button-zoom-in"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 overflow-x-auto bg-background">
        <canvas ref={canvasRef} data-testid="timeline-canvas" />
      </div>
    </div>
  );
}
