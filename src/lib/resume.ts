// Resume content: three proficiency tiers (honest about depth), real
// experience timeline, and education/certifications.

export interface SkillTier {
  name: string;
  blurb?: string;
  skills: string[];
}

export const SKILL_TIERS: SkillTier[] = [
  {
    name: "Core strengths",
    blurb: "Daily-driver tools — measurement, tagging, and data work.",
    skills: [
      "Google Analytics (GA4)",
      "Google Tag Manager (Client & Server-side)",
      "SQL",
      "BigQuery",
      "PostgreSQL",
      "CRO & A/B Testing",
      "Looker Studio",
      "JavaScript",
    ],
  },
  {
    name: "Build with AI",
    blurb:
      "Ships production software by directing AI coding agents — spec-driven, agent-led implementation.",
    skills: [
      "Claude Code",
      "Gemini CLI",
      "Spec-driven development",
      "Custom agent skills",
      "Python",
      "React",
      "Docker",
    ],
  },
  {
    name: "Working knowledge",
    blurb: "Comfortable reading, reviewing, and directing — not claiming mastery.",
    skills: [
      "TypeScript",
      "Express",
      "Bayesian modeling (Meridian/MMM)",
      "FastAPI",
      "Excel/VBA automation",
    ],
  },
];

export interface ExperienceItem {
  role: string;
  org: string;
  period: string;
  points: string[];
}

export const EXPERIENCE: ExperienceItem[] = [
  {
    role: "Manager, Data Analytics",
    org: "Assembly Global",
    period: "Bengaluru",
    points: [
      "Architected and built a multi-tenant, Dockerized taxonomy engine web app for marketing naming conventions and automated taxonomy generation, including a \"Lego-style\" UTM builder and dynamic taxonomy forms that cut manual effort for the activation team.",
      "Designed automated SQL report generation against BigQuery and PostgreSQL, improving cross-channel data accuracy.",
      "Led technical implementation and troubleshooting of tracking across Campaign Manager, Google Cloud Platform, Meta, TikTok, and Google Merchant Center (44 sub-accounts).",
      "Built a proprietary first-party CRO solution on GTM and JavaScript, enabling in-house A/B testing.",
      "Integrated data workflows across SQL, Python, and third-party APIs into robust, repeatable pipelines.",
      "Managed and mentored a team of analysts.",
    ],
  },
  {
    role: "Web Analyst",
    org: "Flatworld Solutions",
    period: "Bengaluru",
    points: [
      "Designed a tagging architecture in Google Tag Manager spanning 19 websites, keeping tracking and taxonomy consistent across all of them.",
      "Built dashboards in Looker Studio and Excel that turned raw tracking data into actionable reporting.",
      "Partnered with Marketing/SEO and Web Development to support ongoing campaigns and brand initiatives.",
    ],
  },
  {
    role: "SME Technology / Senior Consultant / Implementation Consultant",
    org: "Regalix",
    period: "Bengaluru",
    points: [
      "Promoted to Subject Matter Expert; supported 200+ consultants with advanced JavaScript and GTM solutions for Google tracking implementations.",
      "Facilitated client transitions to GA4 and handled high-priority cases as part of an exclusive pilot program.",
      "Enabled advanced tracking in Google Ads/Analytics via hard-coded tagging and GTM.",
    ],
  },
  {
    role: "Senior Technician / Technician",
    org: "Dell International Services",
    period: "Bengaluru",
    points: [
      "Resolved hardware and software issues for commercial and consumer clients while driving non-warranty service sales.",
      "Supported business continuity during COVID-19 by transitioning to US out-of-warranty sales support.",
    ],
  },
  {
    role: "Tech Support Analyst",
    org: "Sutherland Global Services",
    period: "Cochin",
    points: [
      "Elevated to Team Resolution Expert; led a team of 18 to expedite resolutions and improve sales conversion rates.",
    ],
  },
];

export interface EducationItem {
  credential: string;
  institution: string;
  period?: string;
}

export const EDUCATION: EducationItem[] = [
  {
    credential: "CBSE 12th Boards",
    institution: "Chinmaya Vidyalaya, New Delhi",
  },
  {
    credential: "Google Analytics — Standard & Advanced",
    institution: "Google",
  },
  {
    credential: "GTM Fundamentals",
    institution: "Google",
  },
  {
    credential: "Introduction to Data Studio",
    institution: "Google",
  },
  {
    credential: "SQL & Python",
    institution: "freeCodeCamp",
  },
];
