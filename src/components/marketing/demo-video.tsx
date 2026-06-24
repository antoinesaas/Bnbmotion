"use client";

import { DEMO_VIDEO_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function DemoVideo({
  className,
  label,
  duration = "0:10",
}: {
  className?: string;
  label?: string;
  duration?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-ink", className)}>
      <video
        src={DEMO_VIDEO_URL}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="h-full w-full object-cover"
      />
      {label && (
        <div className="pointer-events-none absolute inset-x-5 bottom-5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/25">
            <div className="h-full w-2/3 rounded-full bg-coral-400" />
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-white/80">
            <span>{label}</span>
            <span>{duration}</span>
          </div>
        </div>
      )}
    </div>
  );
}
