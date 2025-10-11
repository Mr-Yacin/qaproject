import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface MobileCardListProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Mobile Card List
 * Displays items as cards on mobile, table on desktop
 */
export function MobileCardList({ children, className }: MobileCardListProps) {
  return (
    <div className={cn("space-y-3 lg:space-y-0", className)}>
      {children}
    </div>
  );
}

interface MobileCardItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function MobileCardItem({ children, onClick, className }: MobileCardItemProps) {
  return (
    <Card
      className={cn(
        "p-4 lg:hidden hover:shadow-md transition-shadow",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {children}
    </Card>
  );
}

interface MobileCardFieldProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

export function MobileCardField({ label, children, className }: MobileCardFieldProps) {
  return (
    <div className={cn("flex justify-between items-start py-2 border-b last:border-0", className)}>
      <span className="text-sm font-medium text-muted-foreground">{label}:</span>
      <div className="text-sm text-right">{children}</div>
    </div>
  );
}
