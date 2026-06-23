"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NAV_LINKS, SITE } from "@/lib/nav";

/**
 * Sticky site header with brand mark, desktop nav, and a mobile hamburger menu.
 * Active route is highlighted in gold. The mobile menu collapses on selection.
 */
export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link
          href="/"
          className="group flex items-center gap-2 font-serif text-lg text-ink"
          onClick={() => setOpen(false)}
        >
          <span aria-hidden="true" className="text-gold">
            ✦
          </span>
          <span className="transition-colors group-hover:text-gold">
            {SITE.name}
          </span>
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Primary" className="hidden sm:block">
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={[
                    "rounded-md px-3 py-2 text-sm transition-colors",
                    isActive(link.href)
                      ? "text-gold"
                      : "text-ink-muted hover:text-ink",
                  ].join(" ")}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Mobile toggle */}
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-ink-muted hover:text-ink sm:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            {open ? (
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            ) : (
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav
          id="mobile-menu"
          aria-label="Primary mobile"
          className="border-t border-line bg-bg/95 sm:hidden"
        >
          <ul className="mx-auto flex max-w-5xl flex-col px-4 py-2">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={[
                    "block rounded-md px-3 py-3 text-sm transition-colors",
                    isActive(link.href)
                      ? "text-gold"
                      : "text-ink-muted hover:bg-surface hover:text-ink",
                  ].join(" ")}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
