import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface HelpTooltipProps {
  content: string;
  children?: React.ReactNode;
}

export default function HelpTooltip({ content, children }: HelpTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {children || <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />}
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs">{content}</TooltipContent>
    </Tooltip>
  );
}
