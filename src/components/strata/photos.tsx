import { useRef, useState } from "react";
import { format } from "date-fns";
import { Camera, Columns2, Lock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAct, useQ } from "@/lib/api";
import type { ProgressPhoto } from "@/lib/types";
import { Chip, Empty, Panel } from "./ui";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const POSES = ["Front", "Side", "Back"];

export function usePhotos(userId: string) {
  return useQ(["photos", userId], (api) => api.photos(userId));
}

export function CompareSlider({ before, after }: { before: ProgressPhoto; after: ProgressPhoto }) {
  const [pos, setPos] = useState(50);
  return (
    <div className="relative aspect-[3/4] w-full select-none overflow-hidden rounded-2xl bg-surface-2">
      <img
        src={after.url}
        alt={`${after.pose} photo ${after.taken_on}`}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      >
        <img
          src={before.url}
          alt={`${before.pose} photo ${before.taken_on}`}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
      <div
        className="pointer-events-none absolute inset-y-0 w-0.5 bg-primary shadow-glow"
        style={{ left: `${pos}%` }}
      >
        <div className="absolute top-1/2 left-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-primary text-primary-foreground">
          <Columns2 className="size-4" />
        </div>
      </div>
      <div className="num absolute left-3 top-3 rounded-full bg-background/70 px-2.5 py-1 text-caption backdrop-blur">
        {format(new Date(before.taken_on + "T12:00"), "d MMM")}
      </div>
      <div className="num absolute right-3 top-3 rounded-full bg-background/70 px-2.5 py-1 text-caption backdrop-blur">
        {format(new Date(after.taken_on + "T12:00"), "d MMM")}
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(+e.target.value)}
        aria-label="Compare before and after"
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}

export function PhotoSection({ userId, canEdit }: { userId: string; canEdit: boolean }) {
  const photos = usePhotos(userId);
  const [sideBySide, setSideBySide] = useState(false);
  const [pose, setPose] = useState("Front");
  const [view, setView] = useState<ProgressPhoto | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const upload = useAct((api, file: File) => api.uploadPhoto({ file, pose }));
  const remove = useAct((api, p: ProgressPhoto) => api.removePhoto(p));
  const list = photos.data ?? [];
  const posed = list.filter((p) => p.pose === pose);
  const first = posed.at(-1);
  const last = posed[0];

  return (
    <div>
      <div className="no-scrollbar -mx-5 mb-3 flex items-center gap-2 overflow-x-auto px-5">
        {POSES.map((p) => (
          <Chip key={p} active={pose === p} onClick={() => setPose(p)}>
            {p}
          </Chip>
        ))}
        <span className="ml-auto flex shrink-0 items-center gap-1 text-caption text-muted-foreground">
          <Lock className="size-3" /> Private
        </span>
      </div>

      {first && last && first.id !== last.id ? (
        <Panel className="p-2">
          <div className="mb-2 flex gap-2">
            <Button
              variant={sideBySide ? "glass" : "volt"}
              className="h-11 flex-1"
              onClick={() => setSideBySide(false)}
              aria-pressed={!sideBySide}
            >
              Slider
            </Button>
            <Button
              variant={sideBySide ? "volt" : "glass"}
              className="h-11 flex-1"
              onClick={() => setSideBySide(true)}
              aria-pressed={sideBySide}
            >
              Side by side
            </Button>
          </div>
          {sideBySide ? (
            <div className="grid grid-cols-2 gap-2">
              {[first, last].map((photo) => (
                <figure key={photo.id}>
                  <img
                    src={photo.url}
                    alt={`${photo.pose} progress on ${photo.taken_on}`}
                    className="aspect-[3/4] w-full rounded-xl object-contain bg-surface-2"
                  />
                  <figcaption className="py-2 text-center text-caption">
                    {format(new Date(photo.taken_on + "T12:00"), "d MMM yyyy")}
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <CompareSlider before={first} after={last} />
          )}
          <div className="num px-2 py-2 text-center text-caption text-muted-foreground">
            {sideBySide ? "Side-by-side comparison" : "Drag to compare"} · {posed.length}{" "}
            {pose.toLowerCase()} photos
          </div>
        </Panel>
      ) : !photos.isLoading && !posed.length ? (
        <Empty
          icon={<Camera className="size-8" />}
          title={`No ${pose.toLowerCase()} photos yet`}
          body={
            canEdit
              ? "Same light, same spot, every 2–4 weeks. Only you and your coach can see them."
              : "Your client hasn't added any yet."
          }
        />
      ) : null}

      {list.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {list.map((p) => (
            <button
              key={p.id}
              onClick={() => setView(p)}
              className="relative aspect-[3/4] overflow-hidden rounded-xl bg-surface-2"
            >
              <img
                src={p.url}
                alt={`${p.pose} progress photo ${p.taken_on}`}
                loading="lazy"
                className="h-full w-full object-cover"
              />
              <div className="num absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent px-2 pb-1.5 pt-4 text-left text-caption">
                {format(new Date(p.taken_on + "T12:00"), "d MMM")} · {p.pose}
              </div>
            </button>
          ))}
        </div>
      )}

      {canEdit && (
        <>
          <input
            ref={input}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              if (f.size > 10 * 1024 * 1024) return void toast.error("Photo must be under 10 MB");
              upload.mutate(f, {
                onSuccess: () => toast.success("Photo saved privately"),
                onError: (er) => toast.error(er.message),
              });
            }}
          />
          <Button
            variant="glass"
            size="xl"
            className="mt-3 w-full"
            disabled={upload.isPending}
            onClick={() => input.current?.click()}
          >
            <Camera /> {upload.isPending ? "Uploading…" : `Add ${pose.toLowerCase()} photo`}
          </Button>
        </>
      )}

      <Dialog open={!!view} onOpenChange={(o) => !o && setView(null)}>
        <DialogContent className="max-w-sm border-border bg-popover p-3">
          <DialogTitle className="px-1 text-base">
            {view && `${view.pose} · ${format(new Date(view.taken_on + "T12:00"), "d MMM yyyy")}`}
          </DialogTitle>
          {view && (
            <img src={view.url} alt={`${view.pose} progress photo`} className="w-full rounded-xl" />
          )}
          {view?.note && <p className="px-1 text-label text-muted-foreground">{view.note}</p>}
          {canEdit && view && (
            <Button
              variant="ghost"
              className="text-destructive"
              onClick={() =>
                remove.mutate(view, { onSuccess: () => (setView(null), toast.success("Deleted")) })
              }
            >
              <Trash2 /> Delete photo
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
