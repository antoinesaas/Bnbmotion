"use client";

import { useRef, useState } from "react";
import { Play } from "lucide-react";
import { DEMO_VIDEO_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Lecteur de la vidéo de démonstration. `preload="metadata"` : le fichier n'est
 * réellement téléchargé qu'au clic, pour ne pas alourdir le chargement de la page.
 */
export function DemoVideo({
  className,
  label,
  duration = "0:10",
}: {
  className?: string;
  label?: string;
  duration?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  function play() {
    setPlaying(true);
    void ref.current?.play();
  }

  return (
    <div className={cn("group relative overflow-hidden bg-ink", className)}>
      <video
        ref={ref}
        src={DEMO_VIDEO_URL}
        preload="metadata"
        playsInline
        controls={playing}
        loop
        className="h-full w-full object-cover"
        onPause={() => ref.current && ref.current.currentTime === 0 && setPlaying(false)}
      />

      {!playing && (
        <button
          type="button"
          onClick={play}
          aria-label="Lire la vidéo de démonstration"
          className="absolute inset-0 grid place-items-center bg-gradient-to-br from-coral-500/30 via-ink/40 to-ink/60 transition group-hover:from-coral-500/40"
        >
          <span className="grid h-16 w-16 place-items-center rounded-full bg-white/95 text-coral-600 shadow-lg transition group-hover:scale-105">
            <Play className="h-7 w-7 translate-x-0.5 fill-coral-600" />
          </span>
          {label && (
            <div className="absolute inset-x-5 bottom-5">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/25">
                <div className="h-full w-2/3 rounded-full bg-coral-400" />
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-white/80">
                <span>{label}</span>
                <span>{duration}</span>
              </div>
            </div>
          )}
        </button>
      )}
    </div>
  );
}
