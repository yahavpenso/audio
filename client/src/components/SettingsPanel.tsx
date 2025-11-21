import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Settings } from "lucide-react";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [showConsole, setShowConsole] = React.useState(true);
  const [showStats, setShowStats] = React.useState(true);
  const [enableAnimations, setEnableAnimations] = React.useState(true);

  React.useEffect(() => {
    localStorage.setItem("showConsole", JSON.stringify(showConsole));
    localStorage.setItem("showStats", JSON.stringify(showStats));
    localStorage.setItem("enableAnimations", JSON.stringify(enableAnimations));
  }, [showConsole, showStats, enableAnimations]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Settings
          </DialogTitle>
          <DialogDescription>Customize your audio editor experience</DialogDescription>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 mt-4"
        >
          {/* Display Settings */}
          <Card className="p-4 space-y-4">
            <h3 className="font-semibold text-sm">Display</h3>
            <Separator />

            <div className="flex items-center justify-between">
              <Label htmlFor="console" className="text-sm cursor-pointer">
                Show Console Panel
              </Label>
              <Switch
                id="console"
                checked={showConsole}
                onCheckedChange={setShowConsole}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="stats" className="text-sm cursor-pointer">
                Show Statistics Panel
              </Label>
              <Switch
                id="stats"
                checked={showStats}
                onCheckedChange={setShowStats}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="animations" className="text-sm cursor-pointer">
                Enable Animations
              </Label>
              <Switch
                id="animations"
                checked={enableAnimations}
                onCheckedChange={setEnableAnimations}
              />
            </div>
          </Card>

          {/* About */}
          <Card className="p-4 space-y-2 bg-primary/5 border-primary/30">
            <h3 className="font-semibold text-sm">About</h3>
            <Separator />
            <div className="text-xs text-muted-foreground space-y-1">
              <p>🎵 <strong>Audio Editor v1.0</strong></p>
              <p>Professional audio editing in your browser with 8 effects, live editing, and more.</p>
              <p className="text-xs text-primary mt-2">Made with ❤️ using React & Web Audio API</p>
            </div>
          </Card>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

import React from "react";
