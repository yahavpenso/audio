import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { X, Waves, Plus } from "lucide-react";
import { PanningEffect } from "@shared/schema";

interface PanningEffectPanelProps {
  duration: number;
  currentTime: number;
  panningEffects: PanningEffect[];
  onAddEffect: (effect: PanningEffect) => void;
  onRemoveEffect: (id: string) => void;
}

export default function PanningEffectPanel({
  duration,
  currentTime,
  panningEffects,
  onAddEffect,
  onRemoveEffect,
}: PanningEffectPanelProps) {
  const [effectDuration, setEffectDuration] = useState([2]);
  const [intensity, setIntensity] = useState([50]);

  const handleAddEffect = () => {
    const effect: PanningEffect = {
      id: crypto.randomUUID(),
      startTime: currentTime,
      duration: effectDuration[0],
      intensity: intensity[0],
    };
    onAddEffect(effect);
  };

  const isValidEffect = currentTime + effectDuration[0] <= duration;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-md bg-chart-2/20 flex items-center justify-center">
          <Waves className="w-4 h-4 text-chart-2" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">Panning Effect</h3>
          <p className="text-xs text-muted-foreground">Real-time stereo panning</p>
        </div>
      </div>

      <Separator />

      {/* Duration Control */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="duration" className="text-sm font-medium">
            Duration
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="duration-input"
              type="number"
              min={0.1}
              max={10}
              step={0.1}
              value={effectDuration[0].toFixed(1)}
              onChange={(e) => setEffectDuration([parseFloat(e.target.value) || 0.1])}
              className="w-20 h-8 text-right font-mono text-sm"
              data-testid="input-duration"
            />
            <span className="text-sm text-muted-foreground">sec</span>
          </div>
        </div>
        
        <Slider
          id="duration"
          value={effectDuration}
          onValueChange={setEffectDuration}
          min={0.1}
          max={10}
          step={0.1}
          data-testid="slider-duration"
        />
        
        <div className="flex justify-between text-xs text-muted-foreground font-mono">
          <span>0.1s</span>
          <span>10.0s</span>
        </div>
      </div>

      {/* Intensity Control */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="intensity" className="text-sm font-medium">
            Intensity
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="intensity-input"
              type="number"
              min={0}
              max={100}
              step={1}
              value={intensity[0]}
              onChange={(e) => setIntensity([parseInt(e.target.value) || 0])}
              className="w-20 h-8 text-right font-mono text-sm"
              data-testid="input-intensity"
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
        </div>
        
        <Slider
          id="intensity"
          value={intensity}
          onValueChange={setIntensity}
          min={0}
          max={100}
          step={1}
          data-testid="slider-intensity"
        />
        
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>← Left</span>
          <span>{intensity[0]}%</span>
          <span>Right →</span>
        </div>
      </div>

      {/* Apply Effect Button */}
      <Button
        onClick={handleAddEffect}
        disabled={!isValidEffect}
        className="w-full gap-2"
        data-testid="button-apply-effect"
      >
        <Plus className="w-4 h-4" />
        Apply Panning Effect
      </Button>

      {!isValidEffect && (
        <p className="text-xs text-destructive">
          Effect would exceed audio duration. Move playhead earlier or reduce duration.
        </p>
      )}

      {/* Active Effects List */}
      {panningEffects.length > 0 && (
        <>
          <Separator />
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Active Effects</Label>
              <Badge variant="secondary" className="text-xs">
                {panningEffects.length}
              </Badge>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {panningEffects.map((effect) => (
                <Card
                  key={effect.id}
                  className="p-3 hover-elevate"
                  data-testid={`card-effect-${effect.id}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <Waves className="w-3.5 h-3.5 text-chart-2 flex-shrink-0" />
                        <span className="text-sm font-medium truncate">
                          Pan {effect.intensity}%
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Start:</span>
                          <span className="ml-1 font-mono">{effect.startTime.toFixed(2)}s</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Duration:</span>
                          <span className="ml-1 font-mono">{effect.duration.toFixed(2)}s</span>
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveEffect(effect.id)}
                      data-testid={`button-remove-${effect.id}`}
                      className="h-8 w-8 flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
