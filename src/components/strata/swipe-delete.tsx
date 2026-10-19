import { errorText } from "@/lib/i18n-errors";
import { t as tr, useLanguage, Message } from "@/lib/i18n";
import type { ReactNode } from "react";
import { motion, useMotionValue, useTransform } from "motion/react";
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
            label: tr("Undo"),
            onClick: () =>
              restore.mutate(rest as Partial<LogTables[T]>, {
                onError: (e) => toast.error(errorText(e.message)),
              }),
          },
        }),
      onError: (e) => toast.error(errorText(e.message)),
    });
  };
}

/** Swipe left to delete; keyboard and assistive users retain a focus-only action. */
export function SwipeRow({
  onDelete,
  children,
  label,
}: {
  onDelete: () => void;
  children: ReactNode;
  label: string;
}) {
  useLanguage();
  const x = useMotionValue(0);
  const reveal = useTransform(x, [-90, -12, 0], [1, 0.35, 0]);
  return (
    <div className="relative overflow-hidden rounded-tile">
      <motion.div
        className="absolute inset-0 flex items-center justify-end rounded-tile bg-destructive/20 pr-4 text-label font-semibold text-destructive"
        style={{ opacity: reveal }}
        aria-hidden
      >
        <Trash2 className="mr-2 size-4" /> <Message source="Delete" />
      </motion.div>
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.7, right: 0 }}
        dragDirectionLock
        onDragEnd={(_, i) => i.offset.x < -90 && onDelete()}
        className="relative"
        style={{ x, touchAction: "pan-y" }}
        aria-label={label}
      >
        {children}
      </motion.div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="pointer-events-none absolute inset-y-1 right-1 z-10 h-auto bg-surface-2 text-destructive opacity-0 focus:pointer-events-auto focus:opacity-100"
        aria-label={tr("Delete {p0}", { p0: label.replace(/: swipe left to delete$/, "") })}
        onClick={onDelete}
      >
        <Trash2 />
        <Message source="Delete" />
      </Button>
    </div>
  );
}
