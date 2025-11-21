import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Plus, Waves, Volume2, Music, Filter, Zap } from "lucide-react";
import { AudioEffect } from "@shared/schema";

interface EffectsPanelProps {
  duration: number;
  currentTime: number;
  effects: AudioEffect[];
  onAddEffect: (effect: AudioEffect) => void;
  onRemoveEffect: (id: string) => void;
}

export default function EffectsPanel({
  duration,
  currentTime,
  effects,
  onAddEffect,
  onRemoveEffect,
}: EffectsPanelProps) {
  const [activeTab, setActiveTab] = useState("panning");
  
  // Panning
  const [panDuration, setPanDuration] = useState([2]);
  const [panIntensity, setPanIntensity] = useState([50]);

  // Reverb
  const [revDuration, setRevDuration] = useState([2]);
  const [revDryWet, setRevDryWet] = useState([30]);
  const [revDecay, setRevDecay] = useState([2]);

  // Delay
  const [delayDuration, setDelayDuration] = useState([2]);
  const [delayDryWet, setDelayDryWet] = useState([40]);
  const [delayTime, setDelayTime] = useState([0.5]);
  const [delayFeedback, setDelayFeedback] = useState([50]);

  // EQ
  const [eqDuration, setEqDuration] = useState([2]);
  const [lowGain, setLowGain] = useState([0]);
  const [midGain, setMidGain] = useState([0]);
  const [highGain, setHighGain] = useState([0]);

  // Compressor
  const [compDuration, setCompDuration] = useState([2]);
  const [compThreshold, setCompThreshold] = useState([-20]);
  const [compRatio, setCompRatio] = useState([4]);
  const [compAttack, setCompAttack] = useState([0.003]);
  const [compRelease, setCompRelease] = useState([0.25]);

  const isValidDuration = (dur: number) => currentTime + dur <= duration;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-chart-1" />
        <h3 className="font-semibold text-sm">Audio Effects</h3>
      </div>

      <Separator />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 w-full gap-1">
          <TabsTrigger value="panning" className="text-xs">Pan</TabsTrigger>
          <TabsTrigger value="reverb" className="text-xs">Rev</TabsTrigger>
          <TabsTrigger value="delay" className="text-xs">Dly</TabsTrigger>
          <TabsTrigger value="eq" className="text-xs">EQ</TabsTrigger>
          <TabsTrigger value="compressor" className="text-xs">Comp</TabsTrigger>
        </TabsList>

        {/* Panning */}
        <TabsContent value="panning" className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Duration (s)</Label>
              <span className="text-xs font-mono">{panDuration[0].toFixed(1)}</span>
            </div>
            <Slider
              value={panDuration}
              onValueChange={setPanDuration}
              min={0.1}
              max={10}
              step={0.1}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Intensity (%)</Label>
              <span className="text-xs font-mono">{panIntensity[0]}</span>
            </div>
            <Slider
              value={panIntensity}
              onValueChange={setPanIntensity}
              min={0}
              max={100}
              step={1}
            />
          </div>
          <Button
            onClick={() => {
              onAddEffect({
                id: crypto.randomUUID(),
                type: "panning",
                startTime: currentTime,
                duration: panDuration[0],
                intensity: panIntensity[0],
              });
            }}
            disabled={!isValidDuration(panDuration[0])}
            className="w-full text-xs"
          >
            <Plus className="w-3 h-3" /> Apply Panning
          </Button>
        </TabsContent>

        {/* Reverb */}
        <TabsContent value="reverb" className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs">Duration (s): {revDuration[0].toFixed(1)}</Label>
            <Slider value={revDuration} onValueChange={setRevDuration} min={0.1} max={10} step={0.1} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Wet/Dry Mix: {revDryWet[0]}%</Label>
            <Slider value={revDryWet} onValueChange={setRevDryWet} min={0} max={100} step={1} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Decay (s): {revDecay[0].toFixed(1)}</Label>
            <Slider value={revDecay} onValueChange={setRevDecay} min={0.1} max={10} step={0.1} />
          </div>
          <Button
            onClick={() => {
              onAddEffect({
                id: crypto.randomUUID(),
                type: "reverb",
                startTime: currentTime,
                duration: revDuration[0],
                dryWet: revDryWet[0],
                decay: revDecay[0],
              });
            }}
            disabled={!isValidDuration(revDuration[0])}
            className="w-full text-xs"
          >
            <Plus className="w-3 h-3" /> Apply Reverb
          </Button>
        </TabsContent>

        {/* Delay */}
        <TabsContent value="delay" className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs">Duration (s): {delayDuration[0].toFixed(1)}</Label>
            <Slider value={delayDuration} onValueChange={setDelayDuration} min={0.1} max={10} step={0.1} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Wet/Dry: {delayDryWet[0]}%</Label>
            <Slider value={delayDryWet} onValueChange={setDelayDryWet} min={0} max={100} step={1} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Delay Time: {delayTime[0].toFixed(2)}s</Label>
            <Slider value={delayTime} onValueChange={setDelayTime} min={0.05} max={2} step={0.05} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Feedback: {delayFeedback[0]}%</Label>
            <Slider value={delayFeedback} onValueChange={setDelayFeedback} min={0} max={80} step={1} />
          </div>
          <Button
            onClick={() => {
              onAddEffect({
                id: crypto.randomUUID(),
                type: "delay",
                startTime: currentTime,
                duration: delayDuration[0],
                dryWet: delayDryWet[0],
                delayTime: delayTime[0],
                feedback: delayFeedback[0],
              });
            }}
            disabled={!isValidDuration(delayDuration[0])}
            className="w-full text-xs"
          >
            <Plus className="w-3 h-3" /> Apply Delay
          </Button>
        </TabsContent>

        {/* EQ */}
        <TabsContent value="eq" className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs">Duration (s): {eqDuration[0].toFixed(1)}</Label>
            <Slider value={eqDuration} onValueChange={setEqDuration} min={0.1} max={10} step={0.1} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Low: {lowGain[0] > 0 ? "+" : ""}{lowGain[0]}dB</Label>
            <Slider value={lowGain} onValueChange={setLowGain} min={-12} max={12} step={1} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Mid: {midGain[0] > 0 ? "+" : ""}{midGain[0]}dB</Label>
            <Slider value={midGain} onValueChange={setMidGain} min={-12} max={12} step={1} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">High: {highGain[0] > 0 ? "+" : ""}{highGain[0]}dB</Label>
            <Slider value={highGain} onValueChange={setHighGain} min={-12} max={12} step={1} />
          </div>
          <Button
            onClick={() => {
              onAddEffect({
                id: crypto.randomUUID(),
                type: "eq",
                startTime: currentTime,
                duration: eqDuration[0],
                lowGain: lowGain[0],
                midGain: midGain[0],
                highGain: highGain[0],
              });
            }}
            disabled={!isValidDuration(eqDuration[0])}
            className="w-full text-xs"
          >
            <Plus className="w-3 h-3" /> Apply EQ
          </Button>
        </TabsContent>

        {/* Compressor */}
        <TabsContent value="compressor" className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs">Duration (s): {compDuration[0].toFixed(1)}</Label>
            <Slider value={compDuration} onValueChange={setCompDuration} min={0.1} max={10} step={0.1} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Threshold: {compThreshold[0]}dB</Label>
            <Slider value={compThreshold} onValueChange={setCompThreshold} min={-100} max={0} step={1} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Ratio: {compRatio[0].toFixed(1)}:1</Label>
            <Slider value={compRatio} onValueChange={setCompRatio} min={1} max={20} step={0.1} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Attack: {(compAttack[0] * 1000).toFixed(0)}ms</Label>
            <Slider value={compAttack} onValueChange={setCompAttack} min={0} max={1} step={0.001} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Release: {(compRelease[0] * 1000).toFixed(0)}ms</Label>
            <Slider value={compRelease} onValueChange={setCompRelease} min={0} max={1} step={0.01} />
          </div>
          <Button
            onClick={() => {
              onAddEffect({
                id: crypto.randomUUID(),
                type: "compressor",
                startTime: currentTime,
                duration: compDuration[0],
                threshold: compThreshold[0],
                ratio: compRatio[0],
                attack: compAttack[0],
                release: compRelease[0],
              });
            }}
            disabled={!isValidDuration(compDuration[0])}
            className="w-full text-xs"
          >
            <Plus className="w-3 h-3" /> Apply Compression
          </Button>
        </TabsContent>
      </Tabs>

      {/* Active Effects List */}
      {effects.length > 0 && (
        <>
          <Separator />
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Active Effects</Label>
              <Badge variant="secondary" className="text-xs">{effects.length}</Badge>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {effects.map((effect) => {
                let label = "";
                let icon = <Music className="w-3 h-3" />;
                
                if (effect.type === "panning") {
                  label = `Pan ${(effect as any).intensity}%`;
                  icon = <Waves className="w-3 h-3" />;
                } else if (effect.type === "reverb") {
                  label = `Reverb ${(effect as any).dryWet}%`;
                  icon = <Volume2 className="w-3 h-3" />;
                } else if (effect.type === "delay") {
                  label = `Delay ${(effect as any).delayTime.toFixed(2)}s`;
                  icon = <Volume2 className="w-3 h-3" />;
                } else if (effect.type === "eq") {
                  label = `EQ ${(effect as any).lowGain}/${(effect as any).midGain}/${(effect as any).highGain}`;
                  icon = <Filter className="w-3 h-3" />;
                } else if (effect.type === "compressor") {
                  label = `Compressor ${(effect as any).ratio.toFixed(1)}:1`;
                  icon = <Zap className="w-3 h-3" />;
                }
                
                return (
                  <Card key={effect.id} className="p-2 hover-elevate">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {icon}
                        <span className="text-xs font-medium truncate">{label}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemoveEffect(effect.id)}
                        className="h-6 w-6 flex-shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
