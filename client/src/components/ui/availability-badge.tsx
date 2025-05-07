import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle, AlertCircle, XCircle } from "lucide-react";

type AvailabilityStatus = "disponible" | "pocos" | "no-disponible";

interface AvailabilityBadgeProps {
  status: AvailabilityStatus;
  count?: number;
  className?: string;
  showIcon?: boolean;
}

export const AvailabilityBadge: React.FC<AvailabilityBadgeProps> = ({
  status,
  count,
  className,
  showIcon = true
}) => {
  const statusConfig = {
    disponible: {
      icon: CheckCircle,
      text: "Disponible",
      variant: "success" as const
    },
    pocos: {
      icon: AlertCircle,
      text: "Pocos disponibles",
      variant: "warning" as const
    },
    "no-disponible": {
      icon: XCircle,
      text: "No disponible",
      variant: "destructive" as const
    }
  };

  const config = statusConfig[status];
  const Icon = config.icon;
  
  const variants = {
    success: "bg-green-100 text-green-800 hover:bg-green-100",
    warning: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
    destructive: "bg-red-100 text-red-800 hover:bg-red-100"
  };

  return (
    <Badge 
      variant="outline"
      className={cn(
        "flex items-center gap-1 font-normal",
        variants[config.variant],
        className
      )}
    >
      {showIcon && <Icon className="w-3 h-3" />}
      <span>
        {config.text}
        {count !== undefined && status !== "no-disponible" && ` (${count})`}
      </span>
    </Badge>
  );
};
