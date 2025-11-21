import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  { key: "Space", action: "Play/Pause" },
  { key: "Ctrl+Z / Cmd+Z", action: "Undo" },
  { key: "Ctrl+Y / Cmd+Y", action: "Redo" },
  { key: "Ctrl+E / Cmd+E", action: "Export" },
  { key: "Ctrl+O / Cmd+O", action: "Open File" },
  { key: "0-9", action: "Jump to Time (%)" },
  { key: "Left Arrow", action: "Seek Back" },
  { key: "Right Arrow", action: "Seek Forward" },
  { key: "Up/Down", action: "Adjust Volume" },
  { key: "?", action: "Show This Help" },
];

export default function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>⌨️ Keyboard Shortcuts</DialogTitle>
          <DialogDescription>Master the audio editor with these keyboard shortcuts</DialogDescription>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4"
        >
          {shortcuts.map((shortcut, idx) => (
            <motion.div
              key={shortcut.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-muted/50 hover:bg-muted transition-colors"
            >
              <span className="text-sm text-foreground">{shortcut.action}</span>
              <Badge variant="secondary" className="font-mono text-xs">
                {shortcut.key}
              </Badge>
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/20 text-sm text-muted-foreground">
          💡 <strong>Tip:</strong> Press <Badge variant="secondary" className="ml-2 inline font-mono">?</Badge> anytime to show these shortcuts
        </div>
      </DialogContent>
    </Dialog>
  );
}
