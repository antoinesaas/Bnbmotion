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
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-coral-500 text-white shadow-glow">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 4.5v15a1 1 0 0 0 1.5.87l12-7.5a1 1 0 0 0 0-1.74l-12-7.5A1 1 0 0 0 6 4.5Z" fill="currentColor" />
        </svg>
      </span>
      <span>
        Bnb<span className="text-coral-500">Motion</span>
      </span>
    </span>
  );

  if (href === null) return content;
  return (
    <Link href={href} className="inline-flex" aria-label="BnbMotion — accueil">
      {content}
    </Link>
  );
}
