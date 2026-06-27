// Primary navigation links, shared by the header and footer.
export interface NavLink {
  href: string;
  label: string;
}

export const NAV_LINKS: NavLink[] = [
  { href: "/", label: "About" },
  { href: "/projects", label: "Projects" },
  { href: "/resume", label: "Resume" },
  { href: "/contact", label: "Contact" },
];

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
