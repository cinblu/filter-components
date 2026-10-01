import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The layered surface everything is shown on: a raised frame, with an inset stage inside
 * it where the component lives. `header` and `footer` sit on the raised frame.
 */
export function Frame({
  children,
  header,
  footer,
  grid = true,
  className,
  stageClassName,
}: {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  /** A faint dot grid on the stage, like a design canvas. */
  grid?: boolean;
  className?: string;
  stageClassName?: string;
}) {
  return (
    <div className={cn("flex flex-col rounded-2xl border bg-(--surface-raised) p-1.5", className)}>
      {header && <div className="flex items-center gap-2 px-1 pt-0.5 pb-1.5">{header}</div>}
      <div
        className={cn(
          "relative min-h-0 flex-1 rounded-xl border bg-(--surface-stage) shadow-xs",
          grid && "dot-grid",
          stageClassName,
        )}
      >
        {children}
      </div>
      {footer && <div className="px-2.5 pt-2.5 pb-1.5">{footer}</div>}
    </div>
  );
}
