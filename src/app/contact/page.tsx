import type { Metadata } from "next";
import { SectionHeader } from "@/components/SectionHeader";
import { Reveal } from "@/components/Reveal";
import { ButtonLink } from "@/components/Button";
import { SOCIAL_LINKS, SITE } from "@/lib/nav";

export const metadata: Metadata = {
  title: "Contact — Portfolio",
  description: "Get in touch — email and social links.",
};

export default function ContactPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <Reveal>
        <SectionHeader
          eyebrow="Get in touch"
          title="Let's talk"
          description="Open to collaborations, writing, and interesting problems across analytics, design, and code."
          align="center"
        />
      </Reveal>

      <Reveal delay={120}>
        <div className="mt-10">
          <ButtonLink href={`mailto:${SITE.email}`} variant="primary" external>
            {SITE.email}
          </ButtonLink>
        </div>
      </Reveal>

      <Reveal delay={220}>
        <ul className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {SOCIAL_LINKS.map((s) => (
            <li key={s.label}>
              <a
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-line-strong px-4 py-2 text-sm text-ink-muted transition-colors hover:border-gold hover:text-gold"
              >
                {s.label}
                <svg
                  className="h-3.5 w-3.5"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M5 11L11 5M11 5H6M11 5V10"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            </li>
          ))}
        </ul>
      </Reveal>
    </main>
  );
}
