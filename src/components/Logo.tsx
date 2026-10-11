import Link from "next/link";

export function Logo({ href = "/", className = "" }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={`flex items-center gap-2.5 text-xl font-extrabold tracking-tight ${className}`}>
      <svg width="30" height="20" viewBox="0 0 30 20" aria-hidden="true">
        <circle cx="10" cy="10" r="9" fill="#ffb020" />
        <circle cx="20" cy="10" r="9" fill="#c58bff" fillOpacity="0.9" />
      </svg>
      assay
    </Link>
  );
}
