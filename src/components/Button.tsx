import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "outline" | "ghost";
type Size = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-bg hover:bg-accent-soft shadow-[0_0_24px_-8px_var(--color-glow)]",
  outline:
    "border border-line-strong text-ink hover:border-accent hover:text-accent-bright",
  ghost: "text-ink-muted hover:text-ink hover:bg-surface-2",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
}

/** Internal/external link styled as a button. */
export function ButtonLink({
  variant = "primary",
  size = "md",
  className = "",
  children,
  href,
  external,
  download,
  ...rest
}: CommonProps & {
  href: string;
  external?: boolean;
  download?: boolean;
} & Omit<ComponentProps<typeof Link>, "href" | "className">) {
  const classes = [base, variants[variant], sizes[size], className].join(" ");
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
      >
        {children}
      </a>
    );
  }
  // mailto:, downloads, and other non-route hrefs bypass client navigation.
  const isRoute = href.startsWith("/") || href.startsWith("#");
  if (!isRoute || download) {
    return (
      <a href={href} download={download} className={classes}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes} {...rest}>
      {children}
    </Link>
  );
}

/** Standard button element. */
export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}: CommonProps & ComponentProps<"button">) {
  return (
    <button
      className={[base, variants[variant], sizes[size], className].join(" ")}
      {...rest}
    >
      {children}
    </button>
  );
}
