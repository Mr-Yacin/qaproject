import { cn } from "@/lib/utils";

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Responsive Table Wrapper
 * Makes tables scrollable on small screens
 */
export function ResponsiveTable({ children, className }: ResponsiveTableProps) {
  return (
    <div className={cn("overflow-x-auto -mx-4 sm:mx-0", className)}>
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Mobile-friendly table cell that shows label on mobile
 */
interface ResponsiveTableCellProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveTableCell({
  label,
  children,
  className,
}: ResponsiveTableCellProps) {
  return (
    <td className={cn("px-4 py-3", className)}>
      <div className="flex flex-col sm:block">
        <span className="text-xs font-medium text-muted-foreground sm:hidden mb-1">
          {label}
        </span>
        <div>{children}</div>
      </div>
    </td>
  );
}
