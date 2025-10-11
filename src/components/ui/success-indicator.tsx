import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuccessIndicatorProps {
  message: string;
  className?: string;
}

/**
 * Success Indicator Component
 * Shows a success message with checkmark icon
 */
export function SuccessIndicator({ message, className }: SuccessIndicatorProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <CheckCircle2 className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

interface SuccessBannerProps {
  title: string;
  description?: string;
  onDismiss?: () => void;
  className?: string;
}

/**
 * Success Banner Component
 * Shows a prominent success banner with optional dismiss button
 */
export function SuccessBanner({
  title,
  description,
  onDismiss,
  className,
}: SuccessBannerProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-green-900">{title}</h3>
        {description && (
          <p className="text-sm text-green-700 mt-1">{description}</p>
        )}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-green-600 hover:text-green-800 transition-colors"
          aria-label="Dismiss success message"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

/**
 * Inline Success Message
 * Small success message for inline use
 */
interface InlineSuccessProps {
  message: string;
  className?: string;
}

export function InlineSuccess({ message, className }: InlineSuccessProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-sm text-green-600",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
