import type { ReactNode } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useAct } from "@/lib/api";
import type { LogTable, LogTables } from "@/lib/types";
import { haptic } from "./session-extras";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

/** Remove a log row through the existing Api; Undo re-inserts the same values (new id). */
export function useRemoveWithUndo<T extends LogTable>(table: T) {
  const remove = useAct((api, id: string) => api.remove(table, id));
  const restore = useAct((api, row: Partial<LogTables[T]>) => api.insert(table, row));
  return (row: LogTables[T], label: string) => {
    const { id, user_id: _u, ...rest } = row as LogTables[T] & { id: string; user_id: string };
    haptic.medium();
    remove.mutate(id, {
      onSuccess: () =>
        toast(label, {
          action: {
            label: "Undo",
            onClick: () =>
              restore.mutate(rest as Partial<LogTables[T]>, {
                onError: (e) => toast.error(e.message),
              }),
          },
        }),
      onError: (e) => toast.error(e.message),
    });
  };
}

/** The explicit delete button is also available to keyboard and assistive users. */
export function SwipeRow({
  onDelete,
  children,
  label,
}: {
  onDelete: () => void;
  children: ReactNode;
  label: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-tile">
      <div
        className="absolute inset-0 flex items-center justify-end rounded-tile bg-destructive/20 pr-4 text-label font-semibold text-destructive"
        aria-hidden
      >
        Delete
      </div>
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.7, right: 0 }}
        dragDirectionLock
        onDragEnd={(_, i) => i.offset.x < -90 && onDelete()}
        className="relative"
        aria-label={label}
      >
        {children}
      </motion.div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="my-1 ml-auto flex text-muted-foreground"
        aria-label={`Delete ${label.replace(/: swipe left to delete$/, "")}`}
        onClick={onDelete}
      >
        <Trash2 />
        Delete
      </Button>
    </div>
  );
}
