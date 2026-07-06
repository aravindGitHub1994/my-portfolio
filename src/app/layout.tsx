import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LenisProvider } from "@/components/LenisProvider";
import { Footer } from "@/components/Footer";
import { SITE } from "@/lib/nav";

// next/font self-hosts these at build time — the browser only ever requests
// them from 'self', which the vercel.json CSP (font-src 'self') requires.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const description =
  "Data Analytics Manager who ships production software by directing AI coding agents — real projects across taxonomy engines, Bayesian budget models, and analytics tooling.";

export const viewport: Viewport = {
  themeColor: "#050507",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — Portfolio`,
    template: `%s · ${SITE.name}`,
  },
  description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: `${SITE.name} — Portfolio`,
    title: `${SITE.name} — Portfolio`,
    description,
    url: SITE.url,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — Portfolio`,
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <LenisProvider>
          <div className="flex flex-1 flex-col">{children}</div>
          <Footer />
        </LenisProvider>
      </body>
    </html>
  );
}
