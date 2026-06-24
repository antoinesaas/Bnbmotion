"use client";

import { useRef, useState } from "react";
import { ImagePlus, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROOM_TYPES, UPLOAD, type RoomType } from "@/lib/constants";

export interface PhotoFile {
  id: string;
  file: File;
  url: string;
}

export interface RoomGroup {
  id: string;
  roomKey: string;
  label: string;
  promptLabel: string;
  files: PhotoFile[];
}

interface RoomCardProps {
  group: RoomGroup;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  disabled?: boolean;
  onRemove: () => void;
  onAddPhotos: (files: File[]) => void;
  onRemovePhoto: (photoId: string) => void;
}

function RoomCard({ group, index, isFirst, isLast, disabled, onRemove, onAddPhotos, onRemovePhoto }: RoomCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const remaining = UPLOAD.maxPhotosPerRoom - group.files.length;
  const valid = group.files.length >= UPLOAD.minPhotosPerRoom;

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (disabled || remaining <= 0) return;
    const files = Array.from(e.dataTransfer.files)
      .filter((f) => UPLOAD.acceptedTypes.includes(f.type as (typeof UPLOAD.acceptedTypes)[number]))
      .slice(0, remaining);
    if (files.length) onAddPhotos(files);
  }

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 transition-colors",
        dragging && "border-coral-400 bg-coral-50/30",
        !valid && !disabled && group.files.length > 0 && "border-amber-300",
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground tabular-nums">
            Pièce {index + 1}
          </span>
          <span className="text-sm font-semibold text-ink">{group.label}</span>
          {isFirst && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              Ouverture
            </span>
          )}
          {isLast && !isFirst && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
              Finale
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className="rounded p-0.5 text-muted-foreground transition hover:text-destructive disabled:pointer-events-none"
        >
          <X size={15} />
        </button>
      </div>

      <div
        className="flex flex-wrap gap-2"
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        {group.files.map((f) => (
          <div key={f.id} className="relative h-20 w-20 shrink-0">
            <img src={f.url} alt="" className="h-full w-full rounded-lg object-cover" />
            <button
              type="button"
              onClick={() => onRemovePhoto(f.id)}
              disabled={disabled}
              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-white shadow-sm transition hover:bg-red-50 hover:text-red-500 disabled:pointer-events-none"
            >
              <X size={10} />
            </button>
          </div>
        ))}

        {remaining > 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            className={cn(
              "flex h-20 w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-muted-foreground transition",
              "hover:border-coral-400 hover:text-coral-500 disabled:pointer-events-none",
              dragging ? "border-coral-400 text-coral-500" : "border-border",
            )}
          >
            <ImagePlus size={18} />
            <span className="text-xs">Photo</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={UPLOAD.acceptedExtensions}
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []).slice(0, remaining);
          if (files.length) onAddPhotos(files);
          e.target.value = "";
        }}
      />

      <p className="mt-2 text-xs text-muted-foreground">
        {group.files.length} / {UPLOAD.maxPhotosPerRoom} photos
        {group.files.length > 0 && group.files.length < UPLOAD.minPhotosPerRoom && (
          <span className="ml-1 text-amber-600">— minimum {UPLOAD.minPhotosPerRoom} requises</span>
        )}
        {group.files.length === 0 && (
          <span> — glissez ou cliquez pour ajouter</span>
        )}
      </p>
    </div>
  );
}

interface Props {
  groups: RoomGroup[];
  onChange: (groups: RoomGroup[]) => void;
  disabled?: boolean;
}

export function RoomPhotoUploader({ groups, onChange, disabled }: Props) {
  const [pickingRoom, setPickingRoom] = useState(false);
  const canAdd = groups.length < UPLOAD.maxRooms && !disabled;
  const usedKeys = new Set(groups.map((g) => g.roomKey));

  function addRoom(type: RoomType) {
    const newGroup: RoomGroup = {
      id: crypto.randomUUID(),
      roomKey: type.key,
      label: type.label,
      promptLabel: type.promptLabel,
      files: [],
    };
    onChange([...groups, newGroup]);
    setPickingRoom(false);
  }

  function removeRoom(id: string) {
    const removed = groups.find((g) => g.id === id);
    removed?.files.forEach((f) => URL.revokeObjectURL(f.url));
    onChange(groups.filter((g) => g.id !== id));
  }

  function addPhotos(groupId: string, files: File[]) {
    onChange(
      groups.map((g) => {
        if (g.id !== groupId) return g;
        const remaining = UPLOAD.maxPhotosPerRoom - g.files.length;
        const newFiles: PhotoFile[] = files.slice(0, remaining).map((file) => ({
          id: crypto.randomUUID(),
          file,
          url: URL.createObjectURL(file),
        }));
        return { ...g, files: [...g.files, ...newFiles] };
      }),
    );
  }

  function removePhoto(groupId: string, photoId: string) {
    onChange(
      groups.map((g) => {
        if (g.id !== groupId) return g;
        const photo = g.files.find((f) => f.id === photoId);
        if (photo) URL.revokeObjectURL(photo.url);
        return { ...g, files: g.files.filter((f) => f.id !== photoId) };
      }),
    );
  }

  return (
    <div className="space-y-3">
      {groups.length === 0 && !pickingRoom && (
        <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center text-muted-foreground">
          <p className="text-sm font-medium">Ajoutez vos pièces une à une</p>
          <p className="mt-1 text-xs">
            {UPLOAD.minPhotosPerRoom}–{UPLOAD.maxPhotosPerRoom} photos par pièce · jusqu'à {UPLOAD.maxRooms} pièces
          </p>
        </div>
      )}

      {groups.map((group, index) => (
        <RoomCard
          key={group.id}
          group={group}
          index={index}
          isFirst={index === 0}
          isLast={index === groups.length - 1}
          disabled={disabled}
          onRemove={() => removeRoom(group.id)}
          onAddPhotos={(files) => addPhotos(group.id, files)}
          onRemovePhoto={(photoId) => removePhoto(group.id, photoId)}
        />
      ))}

      {canAdd && !pickingRoom && (
        <button
          type="button"
          onClick={() => setPickingRoom(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-3 text-sm font-medium text-muted-foreground transition hover:border-coral-400 hover:text-coral-600"
        >
          <Plus size={16} />
          Ajouter une pièce
        </button>
      )}

      {pickingRoom && (
        <div className="rounded-xl border border-coral-200 bg-coral-50/30 p-4">
          <p className="mb-3 text-sm font-semibold text-ink">Choisissez le type de pièce :</p>
          <div className="flex flex-wrap gap-2">
            {ROOM_TYPES.map((type) => {
              const used = usedKeys.has(type.key);
              return (
                <button
                  key={type.key}
                  type="button"
                  disabled={used}
                  onClick={() => addRoom(type)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm transition",
                    used
                      ? "cursor-not-allowed opacity-40 bg-muted"
                      : "cursor-pointer bg-white hover:border-coral-400 hover:bg-coral-50 hover:text-coral-700",
                  )}
                >
                  {type.label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setPickingRoom(false)}
            className="mt-3 text-xs text-muted-foreground transition hover:text-ink"
          >
            Annuler
          </button>
        </div>
      )}

      {groups.length > 0 && (
        <p className="text-xs text-muted-foreground">
          La <strong>première pièce</strong> s'ouvrira la vidéo · la <strong>dernière</strong> sera la finale
        </p>
      )}
    </div>
  );
}
