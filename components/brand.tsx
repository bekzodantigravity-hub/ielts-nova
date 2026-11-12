import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  compact?: boolean;
  href?: string;
  subtitle?: string;
  className?: string;
}

export function BrandLogo({
  compact = false,
  href = "/dashboard",
  subtitle,
  className,
}: BrandLogoProps) {
  const content = (
    <span
      className={cn(
        "pointer-events-none group inline-flex items-center gap-2.5 select-none",
        className
      )}
    >
      {compact ? (
        <span className="pointer-events-none relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-emerald-500/35 bg-[#020503] shadow-[0_0_16px_rgba(16,185,129,0.22)]">
          <Image
            src="/logo-mark.png"
            alt="IELTS Nova"
            width={40}
            height={40}
            priority
            className="pointer-events-none h-full w-full object-contain"
          />
        </span>
      ) : (
        <>
          <span className="pointer-events-none relative flex h-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-emerald-500/35 bg-[#020503] shadow-[0_0_18px_rgba(16,185,129,0.2)]">
            <Image
              src="/logo.png"
              alt="IELTS Nova"
              width={196}
              height={110}
              priority
              className="pointer-events-none h-11 w-auto object-contain"
            />
          </span>
          <span className="pointer-events-none flex flex-col leading-none">
            <span className="text-[15px] font-extrabold tracking-tight text-zinc-950 transition-colors group-hover:text-emerald-700 dark:text-zinc-50 dark:group-hover:text-emerald-400">
              IELTS{" "}
              <span className="text-emerald-600 dark:text-emerald-400">Nova</span>
            </span>
            {subtitle && (
              <span className="mt-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-700/80 dark:text-zinc-400">
                {subtitle}
              </span>
            )}
          </span>
        </>
      )}
    </span>
  );

  if (!href) return content;
  return (
    <Link
      href={href}
      prefetch={true}
      className="relative z-20 cursor-pointer focus:outline-none"
    >
      {content}
    </Link>
  );
}
