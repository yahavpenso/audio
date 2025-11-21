import { useEffect, useRef, useState } from "react";
import { PanningEffect, AudioSelection } from "@shared/schema";

interface WaveformVisualizationProps {
  audioBuffer: AudioBuffer | null;
  currentTime: number;
  panningEffects: PanningEffect[];
  selection: AudioSelection | null;
  onSelectionChange: (selection: AudioSelection | null) => void;
  zoom: number;
  isPlaying: boolean;
  isLoading?: boolean;
}

export default function WaveformVisualization({
  audioBuffer,
  currentTime,
  panningEffects,
  selection,
  onSelectionChange,
  zoom,
  isPlaying,
  isLoading = false,
}: WaveformVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [canvasWidth, setCanvasWidth] = useState(0);

  // Update canvas width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setCanvasWidth(containerRef.current.offsetWidth);
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Draw waveform
  useEffect(() => {
    if (!audioBuffer || !canvasRef.current || canvasWidth === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const height = 240;
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = canvasWidth * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${height}px`;
    
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, canvasWidth, height);

    // Draw background grid
    ctx.strokeStyle = 'hsl(var(--border))';
    ctx.lineWidth = 1;
    const gridInterval = Math.max(1, Math.floor(audioBuffer.duration / 10));
    for (let i = 0; i <= audioBuffer.duration; i += gridInterval) {
      const x = (i / audioBuffer.duration) * canvasWidth * zoom;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Draw waveform
    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / (canvasWidth * zoom));
    const amp = height / 2;

    ctx.fillStyle = 'hsl(var(--primary))';
    ctx.strokeStyle = 'hsl(var(--primary))';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    for (let i = 0; i < canvasWidth * zoom; i++) {
      const min = Math.min(...Array.from({ length: step }, (_, j) => data[i * step + j] || 0));
      const max = Math.max(...Array.from({ length: step }, (_, j) => data[i * step + j] || 0));
      
      ctx.moveTo(i, amp - max * amp);
      ctx.lineTo(i, amp - min * amp);
    }
    ctx.stroke();

    // Draw panning effect regions
    panningEffects.forEach(effect => {
      const startX = (effect.startTime / audioBuffer.duration) * canvasWidth * zoom;
      const width = (effect.duration / audioBuffer.duration) * canvasWidth * zoom;
      
      ctx.fillStyle = 'hsl(var(--chart-2) / 0.2)';
      ctx.fillRect(startX, 0, width, height);
      
      ctx.strokeStyle = 'hsl(var(--chart-2))';
      ctx.lineWidth = 2;
      ctx.strokeRect(startX, 0, width, height);
    });

    // Draw selection
    if (selection) {
      const startX = (selection.startTime / audioBuffer.duration) * canvasWidth * zoom;
      const endX = (selection.endTime / audioBuffer.duration) * canvasWidth * zoom;
      
      ctx.fillStyle = 'hsl(var(--primary) / 0.15)';
      ctx.fillRect(startX, 0, endX - startX, height);
      
      ctx.strokeStyle = 'hsl(var(--primary))';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(startX, 0, endX - startX, height);
      ctx.setLineDash([]);
    }

    // Draw playhead
    const playheadX = (currentTime / audioBuffer.duration) * canvasWidth * zoom;
    ctx.strokeStyle = 'hsl(var(--destructive))';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();

  }, [audioBuffer, currentTime, panningEffects, selection, zoom, canvasWidth, isPlaying]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!audioBuffer) return;
    
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = (x / (rect.width * zoom)) * audioBuffer.duration;
    
    setIsDragging(true);
    setDragStart(time);
    onSelectionChange({ startTime: time, endTime: time });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !audioBuffer || dragStart === null) return;
    
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = (x / (rect.width * zoom)) * audioBuffer.duration;
    
    onSelectionChange({
      startTime: Math.min(dragStart, time),
      endTime: Math.max(dragStart, time),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  return (
    <div ref={containerRef} className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          Waveform
          {isLoading && (
            <span className="inline-block animate-spin">
              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
          )}
        </h2>
        {audioBuffer && (
          <div className="text-sm text-muted-foreground font-mono">
            {audioBuffer.duration.toFixed(2)}s • {audioBuffer.sampleRate}Hz • {audioBuffer.numberOfChannels}ch
          </div>
        )}
      </div>
      
      <div className="bg-card border border-card-border rounded-md overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/40 to-transparent animate-pulse z-10 rounded-md"></div>
        )}
        <canvas
          ref={canvasRef}
          className={`w-full ${!isLoading && audioBuffer ? 'cursor-crosshair' : 'cursor-wait'} ${isLoading ? 'opacity-50' : ''}`}
          onMouseDown={!isLoading ? handleMouseDown : undefined}
          onMouseMove={!isLoading ? handleMouseMove : undefined}
          onMouseUp={!isLoading ? handleMouseUp : undefined}
          onMouseLeave={!isLoading ? handleMouseUp : undefined}
          data-testid="canvas-waveform"
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
              </div>
              <p className="text-sm font-medium">Loading audio...</p>
              <p className="text-xs text-muted-foreground">Decoding file...</p>
            </div>
          </div>
        )}
      </div>

      {selection && !isLoading && (
        <div className="mt-2 text-xs text-muted-foreground font-mono">
          Selection: {selection.startTime.toFixed(3)}s - {selection.endTime.toFixed(3)}s 
          ({(selection.endTime - selection.startTime).toFixed(3)}s)
        </div>
      )}
    </div>
  );
}
