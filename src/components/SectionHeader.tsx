import type { ReactNode } from "react";
import { KineticText } from "@/components/lens/kinetic/KineticText";

interface SectionHeaderProps {
  /** Small uppercase eyebrow label above the title. */
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  /** Horizontal alignment. */
  align?: "left" | "center";
}

/** Consistent heading block used at the top of each page section. */
export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
}: SectionHeaderProps) {
  return (
    <div
      className={[
        "max-w-2xl",
        align === "center" ? "mx-auto text-center" : "",
      ].join(" ")}
    >
      {eyebrow && (
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-accent-bright">
          {eyebrow}
        </p>
      )}
      <KineticText as="h2" className="text-3xl text-ink sm:text-4xl">
        {title}
      </KineticText>
      {description && (
        <p className="mt-4 text-lg leading-8 text-ink-muted">{description}</p>
      )}
    </div>
  );
}
