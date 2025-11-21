import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X, Zap, Radio, Volume2 } from "lucide-react";
import { motion } from "framer-motion";
import { AudioEffect, PitchShiftEffect, DistortionEffect, ChorusEffect } from "@shared/schema";

interface AdvancedEffectsPanelProps {
  duration: number;
  currentTime: number;
  effects: AudioEffect[];
  onAddEffect: (effect: AudioEffect) => void;
  onRemoveEffect: (id: string) => void;
}

export default function AdvancedEffectsPanel({
  duration,
  currentTime,
  effects,
  onAddEffect,
  onRemoveEffect,
}: AdvancedEffectsPanelProps) {
  const [activeTab, setActiveTab] = useState<"pitch" | "distortion" | "chorus">("pitch");
  const [pitchSemitones, setPitchSemitones] = useState([0]);
  const [distortionAmount, setDistortionAmount] = useState([30]);
  const [distortionTone, setDistortionTone] = useState([50]);
  const [chorusRate, setChorusRate] = useState([1.5]);
  const [chorusDepth, setChorusDepth] = useState([50]);
  const [chorusDryWet, setChorusDryWet] = useState([60]);

  const effectDuration = 2;
  const isValidEffect = currentTime + effectDuration <= duration;

  const handleAddPitchShift = () => {
    const effect: PitchShiftEffect = {
      id: crypto.randomUUID(),
      type: "pitchshift",
      startTime: currentTime,
      duration: effectDuration,
      semitones: pitchSemitones[0],
    };
    onAddEffect(effect);
  };

  const handleAddDistortion = () => {
    const effect: DistortionEffect = {
      id: crypto.randomUUID(),
      type: "distortion",
      startTime: currentTime,
      duration: effectDuration,
      amount: distortionAmount[0],
      tone: distortionTone[0],
    };
    onAddEffect(effect);
  };

  const handleAddChorus = () => {
    const effect: ChorusEffect = {
      id: crypto.randomUUID(),
      type: "chorus",
      startTime: currentTime,
      duration: effectDuration,
      rate: chorusRate[0],
      depth: chorusDepth[0],
      dryWet: chorusDryWet[0],
    };
    onAddEffect(effect);
  };

  const getEffectColor = (type: string): string => {
    const colors: Record<string, string> = {
      pitchshift: "bg-blue-500/20 text-blue-400",
      distortion: "bg-red-500/20 text-red-400",
      chorus: "bg-purple-500/20 text-purple-400",
    };
    return colors[type] || "bg-gray-500/20 text-gray-400";
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === "pitch" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("pitch")}
          className="flex-1"
          data-testid="tab-pitch"
        >
          <Radio className="w-3 h-3 mr-1" /> Pitch
        </Button>
        <Button
          variant={activeTab === "distortion" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("distortion")}
          className="flex-1"
          data-testid="tab-distortion"
        >
          <Zap className="w-3 h-3 mr-1" /> Distortion
        </Button>
        <Button
          variant={activeTab === "chorus" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("chorus")}
          className="flex-1"
          data-testid="tab-chorus"
        >
          <Volume2 className="w-3 h-3 mr-1" /> Chorus
        </Button>
      </div>

      <Separator />

      {/* Pitch Shift */}
      {activeTab === "pitch" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Pitch Shift</label>
              <Badge variant="secondary">{pitchSemitones[0]} semitones</Badge>
            </div>
            <Slider
              value={pitchSemitones}
              onValueChange={setPitchSemitones}
              min={-24}
              max={24}
              step={1}
              data-testid="slider-pitch"
            />
            <p className="text-xs text-muted-foreground">Range: -2 octaves to +2 octaves</p>
          </div>
          <Button
            onClick={handleAddPitchShift}
            disabled={!isValidEffect}
            className="w-full"
            data-testid="button-add-pitch"
          >
            Add Pitch Shift
          </Button>
        </motion.div>
      )}

      {/* Distortion */}
      {activeTab === "distortion" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Drive</label>
              <Badge variant="secondary">{distortionAmount[0]}%</Badge>
            </div>
            <Slider
              value={distortionAmount}
              onValueChange={setDistortionAmount}
              min={0}
              max={100}
              step={1}
              data-testid="slider-distortion-amount"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Tone</label>
              <Badge variant="secondary">{distortionTone[0]}%</Badge>
            </div>
            <Slider
              value={distortionTone}
              onValueChange={setDistortionTone}
              min={0}
              max={100}
              step={1}
              data-testid="slider-distortion-tone"
            />
          </div>
          <Button
            onClick={handleAddDistortion}
            disabled={!isValidEffect}
            className="w-full"
            data-testid="button-add-distortion"
          >
            Add Distortion
          </Button>
        </motion.div>
      )}

      {/* Chorus */}
      {activeTab === "chorus" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Rate</label>
              <Badge variant="secondary">{chorusRate[0].toFixed(2)} Hz</Badge>
            </div>
            <Slider
              value={[chorusRate[0] * 10]}
              onValueChange={(v) => setChorusRate([v[0] / 10])}
              min={5}
              max={50}
              step={1}
              data-testid="slider-chorus-rate"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Depth</label>
              <Badge variant="secondary">{chorusDepth[0]}%</Badge>
            </div>
            <Slider
              value={chorusDepth}
              onValueChange={setChorusDepth}
              min={0}
              max={100}
              step={1}
              data-testid="slider-chorus-depth"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Wet/Dry</label>
              <Badge variant="secondary">{chorusDryWet[0]}%</Badge>
            </div>
            <Slider
              value={chorusDryWet}
              onValueChange={setChorusDryWet}
              min={0}
              max={100}
              step={1}
              data-testid="slider-chorus-dryWet"
            />
          </div>
          <Button
            onClick={handleAddChorus}
            disabled={!isValidEffect}
            className="w-full"
            data-testid="button-add-chorus"
          >
            Add Chorus
          </Button>
        </motion.div>
      )}

      <Separator />

      {/* Effects List */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {effects
          .filter((e) => ["pitchshift", "distortion", "chorus"].includes(e.type))
          .map((effect, idx) => (
            <motion.div
              key={effect.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className={`p-3 flex items-center justify-between ${getEffectColor(effect.type)}`}>
                <div>
                  <p className="text-sm font-semibold capitalize">{effect.type}</p>
                  <p className="text-xs opacity-75">{effect.startTime.toFixed(2)}s</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => onRemoveEffect(effect.id)}
                  data-testid={`button-remove-${effect.type}-${effect.id}`}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Card>
            </motion.div>
          ))}
      </div>
    </div>
  );
}
