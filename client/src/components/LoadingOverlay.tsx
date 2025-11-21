import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface LoadingOverlayProps {
  message?: string;
  isVisible?: boolean;
}

export default function LoadingOverlay({ message = "Loading...", isVisible = true }: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm"
      data-testid="overlay-loading"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="flex flex-col items-center gap-3"
      >
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-foreground font-medium">{message}</p>
      </motion.div>
    </motion.div>
  );
}
