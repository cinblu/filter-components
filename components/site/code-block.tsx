import { cn } from "@/lib/utils";

/** A plain, restrained code block (no highlighting: the component is the star). */
export function CodeBlock({ children, className }: { children: string; className?: string }) {
  return (
    <pre
      className={cn(
        "overflow-x-auto rounded-lg border bg-muted/40 p-4 font-mono text-xs leading-relaxed",
        className,
      )}
    >
      <code>{children.trim()}</code>
    </pre>
  );
}
