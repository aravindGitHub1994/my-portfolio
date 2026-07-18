// In-page act anchors (ADR-005: single scroll page), shared by nav and footer.
export interface NavLink {
  href: string;
  label: string;
}

export const NAV_LINKS: NavLink[] = [
  { href: "#approach", label: "Approach" },
  { href: "#work", label: "Work" },
  { href: "#skills", label: "Skills" },
  { href: "#trajectory", label: "Trajectory" },
  { href: "#contact", label: "Contact" },
];

/** Resume stays a direct PDF download (no /resume page anymore). */
export const RESUME_LINK: NavLink = { href: "/resume.pdf", label: "Resume" };

export const SITE = {
  name: "Aravind Krishna Kumar",
  role: "Data Analytics Manager · Builds with AI",
  email: "krishnakumar.aravind94@gmail.com",
  // Update to your deployed URL (e.g. https://your-name.vercel.app).
  // Falls back to env var so it can be set per-deploy without code changes.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com",
};

// Social / contact links.
export interface SocialLink {
  label: string;
  href: string;
}

export const SOCIAL_LINKS: SocialLink[] = [
  {
    label: "LinkedIn",
    href: "https://linkedin.com/in/aravind-krishna-kumar-91058a10b",
  },
  { label: "GitHub", href: "https://github.com/aravindGitHub1994" },
];
