import "./globals.css";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import Script from "next/script";
import PostHogProvider from "./providers/PostHogProvider";
import MentorChat from "./components/MentorChat";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "PAPER — Find the root cause of every JEE & NEET mistake",
    template: "%s · PAPER",
  },
  description:
    "PAPER traces every wrong answer down to the one weak foundation underneath it, so you fix the root instead of the symptom. Personalised JEE & NEET prep powered by a root-cause engine.",
  keywords: [
    "JEE preparation",
    "NEET preparation",
    "JEE practice questions",
    "NEET practice questions",
    "weakness analysis",
    "root cause learning",
    "personalised study plan",
  ],
  applicationName: "PAPER",
  authors: [{ name: "PAPER" }],
  openGraph: {
    type: "website",
    siteName: "PAPER",
    title: "PAPER — Find the root cause of every JEE & NEET mistake",
    description:
      "Fix the root, not the symptom. PAPER's engine traces each mistake to the weak foundation beneath it and builds your study plan around it.",
    url: APP_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "PAPER — Find the root cause of every JEE & NEET mistake",
    description:
      "Fix the root, not the symptom. Personalised JEE & NEET prep powered by a root-cause engine.",
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "O6hOZVeF5A19mPc01F2-rzYA-qv3eFH--EA5vNBoCqk",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider appearance={{
      baseTheme: dark,
      variables: {
        colorPrimary: "#f97316", // Brand orange color
      }
    }}>
      <html lang="en" suppressHydrationWarning>
        <body>
          <PostHogProvider />
          <ThemeProvider attribute="class" defaultTheme="light">
            {children}
          </ThemeProvider>

          {/* AI mentor — floating; self-hides until the student is signed in */}
          <MentorChat />

          {/* MathJax Setup for LaTeX equation rendering */}
          <Script id="mathjax-config" strategy="beforeInteractive">
            {`
              window.MathJax = {
                tex: {
                  inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
                  displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
                  processEscapes: true,
                  processEnvironments: true
                },
                options: {
                  skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre']
                }
              };
            `}
          </Script>
          <Script
            src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
            strategy="lazyOnload"
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
