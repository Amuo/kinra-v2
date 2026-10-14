import { cn } from "@/lib/utils";

/** Outlined artwork keeps the identity identical before web fonts load. */
export function Logo({ className }: { className?: string }) {
  return (
    <img
      src="/brand/kinra-logo.svg"
      alt="Kinra"
      width={252}
      height={64}
      className={cn("h-8 w-auto shrink-0", className)}
    />
  );
}
