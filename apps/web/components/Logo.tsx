import Link from "next/link";

export function FlameIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <path
        d="M50,92 C28,92 16,76 18,58 C19,48 25,43 24,32 C30,39 33,34 32,24 C39,32 41,25 40,12 C48,22 47,32 53,29 C54,18 60,13 57,3 C66,14 64,25 70,22 C69,32 76,37 78,50 C80,58 83,68 78,78 C73,88 63,92 50,92 Z"
        fill="#F2762E"
      />
      <path
        d="M50,84 C38,84 32,74 34,63 C35,56 40,52 39,44 C44,50 46,46 45,38 C51,44 51,38 54,32 C56,40 54,46 59,44 C60,52 65,55 65,55 C67,62 68,70 63,76 C58,82 56,84 50,84 Z"
        fill="#D6401F"
      />
    </svg>
  );
}

export default function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <FlameIcon className="h-7 w-7 shrink-0" />
      <span className="font-display text-xl font-semibold text-ink">ofertaspty</span>
    </Link>
  );
}
