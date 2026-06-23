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
  name: "Your Name",
  role: "Analytics · Writing · Design · Code",
  email: "you@example.com",
};

// Social / contact links. Placeholder URLs — update with real profiles.
export interface SocialLink {
  label: string;
  href: string;
}

export const SOCIAL_LINKS: SocialLink[] = [
  { label: "GitHub", href: "https://github.com/your-handle" },
  { label: "LinkedIn", href: "https://linkedin.com/in/your-handle" },
  { label: "Twitter", href: "https://twitter.com/your-handle" },
];
