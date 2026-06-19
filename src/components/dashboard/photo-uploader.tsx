"use client";

import { useCallback, useRef, useState } from "react";
import { UploadCloud, X } from "lucide-react";
import { UPLOAD } from "@/lib/constants";
import { cn } from "@/lib/utils";

export interface SelectedPhoto {
  file: File;
  url: string;
  id: string;
}

export function PhotoUploader({
  photos,
  onChange,
  disabled,
}: {
  photos: SelectedPhoto[];
  onChange: (photos: SelectedPhoto[]) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      setError(null);
      const incoming = Array.from(files);
      const valid: SelectedPhoto[] = [];

      for (const file of incoming) {
        if (!UPLOAD.acceptedTypes.includes(file.type as (typeof UPLOAD.acceptedTypes)[number])) {
          setError("Formats acceptés : JPG, PNG, WEBP.");
          continue;
        }
        if (file.size > UPLOAD.maxSizeMB * 1024 * 1024) {
          setError(`Chaque photo doit faire moins de ${UPLOAD.maxSizeMB} Mo.`);
          continue;
        }
        valid.push({ file, url: URL.createObjectURL(file), id: crypto.randomUUID() });
      }

      if (photos.length + valid.length > UPLOAD.maxPhotos) {
        setError(`Maximum ${UPLOAD.maxPhotos} photos.`);
      }
      onChange([...photos, ...valid].slice(0, UPLOAD.maxPhotos));
    },
    [photos, onChange],
  );

  const remove = (id: string) => {
    const target = photos.find((p) => p.id === id);
    if (target) URL.revokeObjectURL(target.url);
    onChange(photos.filter((p) => p.id !== id));
  };

  const count = photos.length;
  const enough = count >= UPLOAD.minPhotos;

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !disabled) inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!disabled && e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition",
          dragging ? "border-coral-400 bg-coral-50" : "border-border bg-muted/40 hover:border-coral-300 hover:bg-coral-50/50",
          disabled && "pointer-events-none opacity-60",
        )}
      >
        <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-white text-coral-500 shadow-soft">
          <UploadCloud className="h-6 w-6" />
        </div>
        <p className="text-sm font-medium text-ink">
          Glissez vos photos ici ou <span className="text-coral-600">parcourez</span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Entre {UPLOAD.minPhotos} et {UPLOAD.maxPhotos} photos · JPG, PNG, WEBP · {UPLOAD.maxSizeMB} Mo max
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={UPLOAD.acceptedExtensions}
          multiple
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className={cn("font-medium", enough ? "text-green-600" : "text-muted-foreground")}>
          {count} / {UPLOAD.maxPhotos} photo{count > 1 ? "s" : ""}
          {!enough && count > 0 && ` · ${UPLOAD.minPhotos - count} de plus minimum`}
        </span>
        {error && <span className="text-red-600">{error}</span>}
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {photos.map((p) => (
            <div key={p.id} className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-white">
              <img src={p.url} alt="" className="h-full w-full object-cover" />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => remove(p.id)}
                  className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-ink/70 text-white opacity-0 transition group-hover:opacity-100"
                  aria-label="Retirer la photo"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
