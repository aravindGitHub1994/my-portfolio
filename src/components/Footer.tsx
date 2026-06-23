import Link from "next/link";
import { NAV_LINKS, SOCIAL_LINKS, SITE } from "@/lib/nav";

/** Site footer with nav echo, social links, and copyright. */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-line bg-bg">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="flex items-center gap-2 font-serif text-lg text-ink">
            <span aria-hidden="true" className="text-gold">
              ✦
            </span>
            {SITE.name}
          </p>
          <p className="mt-2 font-mono text-xs uppercase tracking-[0.2em] text-ink-subtle">
            {SITE.role}
          </p>
        </div>

        <div className="flex gap-12">
          <nav aria-label="Footer">
            <ul className="space-y-2">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ink-muted transition-colors hover:text-gold"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <ul className="space-y-2">
            {SOCIAL_LINKS.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-ink-muted transition-colors hover:text-gold"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <p className="mx-auto max-w-5xl px-6 py-6 text-xs text-ink-subtle">
          © {year} {SITE.name}. Built with Next.js &amp; Tailwind.
        </p>
      </div>
    </footer>
  );
}
