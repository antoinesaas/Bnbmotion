import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  href = "/",
}: {
  className?: string;
  href?: string | null;
}) {
  const content = (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-display text-xl font-extrabold tracking-tight text-ink",
        className,
      )}
    >
      <svg width="34" height="27" viewBox="0 0 62 48" fill="none" aria-hidden="true">
        <g stroke="#F65A3B" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M5 19 H18" />
          <path d="M1 27 H18" />
          <path d="M5 35 H18" />
          <path d="M28 43 V23 L41 10 L54 23 V43 Z" />
        </g>
        <path d="M35 23 L48 31 L35 39 Z" fill="#F65A3B" />
      </svg>
      <span>BnbMotion</span>
    </span>
  );

  if (href === null) return content;
  return (
    <Link href={href} className="inline-flex" aria-label="BnbMotion — accueil">
      {content}
    </Link>
  );
}
