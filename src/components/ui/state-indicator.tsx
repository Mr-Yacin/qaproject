import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";

type StateType = 'success' | 'pending' | 'error' | 'warning';

interface StateIndicatorProps {
  state: StateType;
  message: string;
  className?: string;
}

/**
 * State Indicator Component
 * Shows visual feedback for different states
 */
export function StateIndicator({ state, message, className }: StateIndicatorProps) {
  const config = {
    success: {
      icon: CheckCircle2,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      iconColor: 'text-green-600',
    },
    pending: {
      icon: Clock,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-600',
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      iconColor: 'text-red-600',
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-600',
    },
  };

  const { icon: Icon, bgColor, borderColor, textColor, iconColor } = config[state];

  return (
    <div
      className={cn(
        "flex items-center gap-2 p-3 rounded-lg border",
        bgColor,
        borderColor,
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Icon className={cn("h-5 w-5 flex-shrink-0", iconColor)} aria-hidden="true" />
      <p className={cn("text-sm font-medium", textColor)}>{message}</p>
    </div>
  );
}

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'failed';
  className?: string;
}

/**
 * Status Badge Component
 * Shows status with appropriate color coding
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = {
    active: {
      label: 'Active',
      className: 'bg-green-100 text-green-800',
    },
    inactive: {
      label: 'Inactive',
      className: 'bg-gray-100 text-gray-800',
    },
    pending: {
      label: 'Pending',
      className: 'bg-yellow-100 text-yellow-800',
    },
    completed: {
      label: 'Completed',
      className: 'bg-blue-100 text-blue-800',
    },
    failed: {
      label: 'Failed',
      className: 'bg-red-100 text-red-800',
    },
  };

  const { label, className: badgeClassName } = config[status];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        badgeClassName,
        className
      )}
    >
      {label}
    </span>
  );
}

interface ProgressIndicatorProps {
  current: number;
  total: number;
  label?: string;
  showPercentage?: boolean;
  className?: string;
}

/**
 * Progress Indicator Component
 * Shows progress with visual bar and optional percentage
 */
export function ProgressIndicator({
  current,
  total,
  label,
  showPercentage = true,
  className,
}: ProgressIndicatorProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className={cn("space-y-2", className)}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-sm">
          {label && <span className="font-medium">{label}</span>}
          {showPercentage && (
            <span className="text-muted-foreground">{percentage}%</span>
          )}
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="bg-primary h-full transition-all duration-300 ease-in-out"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={total}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{current} of {total}</span>
      </div>
    </div>
  );
}

/**
 * Animated Success Checkmark
 * Shows an animated checkmark for success states
 */
export function AnimatedCheckmark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="relative">
        <div className="absolute inset-0 bg-green-100 rounded-full animate-ping" />
        <div className="relative bg-green-500 rounded-full p-2">
          <CheckCircle2 className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
}
