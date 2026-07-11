import Link from "next/link";
import type { Metadata } from "next";
import styles from "../legal/legal.module.css";

export const metadata: Metadata = {
  title: "Terms of Service — PAPER",
  description:
    "The terms that govern your use of PAPER's JEE and NEET preparation platform.",
};

// NOTE: Terms for an Indian ed-tech SaaS. Update the operating entity when
// the company is incorporated, and have a lawyer review.
const LAST_UPDATED = "July 5, 2026";

export default function TermsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <Link href="/" className={styles.back}>← Back to home</Link>
        <article className={styles.card}>
          <p className={styles.kicker}>Legal</p>
          <h1 className={styles.title}>Terms of Service</h1>
          <p className={styles.updated}>Last updated: {LAST_UPDATED}</p>

          <p>
            These Terms of Service (&ldquo;Terms&rdquo;) govern your use of PAPER (the
            &ldquo;Service&rdquo;), operated by Tanishq Tumram, Pune, India. By creating an
            account or using the Service, you agree to these Terms. If you do not agree, do
            not use the Service.
          </p>

          <h2>1. The Service</h2>
          <p>
            PAPER is a learning platform that helps students preparing for JEE and NEET by
            analysing their practice and generating personalised roadmaps and weakness
            insights. We may add, change, or remove features at any time.
          </p>

          <h2>2. Your account</h2>
          <ul>
            <li>You must provide accurate information and keep your login credentials secure.</li>
            <li>You are responsible for all activity that occurs under your account.</li>
            <li>You must be at least 18, or use the Service with the consent of a parent or guardian.</li>
          </ul>

          <h2>3. Acceptable use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Copy, scrape, resell, or redistribute our question bank or content.</li>
            <li>Attempt to reverse-engineer, overload, or disrupt the Service or its infrastructure.</li>
            <li>Use automated scripts to abuse the Service or circumvent rate limits.</li>
            <li>Use the Service for any unlawful purpose.</li>
          </ul>

          <h2>4. Educational content disclaimer</h2>
          <p>
            The Service provides study guidance, practice questions, and analysis for
            educational purposes. We do not guarantee any particular exam result, rank, or
            outcome. You remain responsible for your own preparation and decisions.
          </p>

          <h2>5. Subscriptions and payments</h2>
          <p>
            Some features may require a paid subscription. Pricing, billing cycles, and
            refund terms will be presented at the point of purchase. [Update this section
            once payments are live.]
          </p>

          <h2>6. Intellectual property</h2>
          <p>
            The Service, including its software, design, and content, is owned by us or our
            licensors and protected by law. We grant you a limited, non-transferable,
            non-exclusive licence to use the Service for your personal exam preparation.
          </p>

          <h2>7. Termination</h2>
          <p>
            You may stop using the Service and delete your account at any time. We may suspend
            or terminate your access if you breach these Terms or use the Service in a way
            that harms us or other users.
          </p>

          <h2>8. Limitation of liability</h2>
          <p>
            To the maximum extent permitted by law, the Service is provided &ldquo;as is&rdquo;
            without warranties of any kind, and we are not liable for indirect, incidental, or
            consequential damages arising from your use of the Service.
          </p>

          <h2>9. Governing law</h2>
          <p>
            These Terms are governed by the laws of India, and any disputes will be subject to
            the courts of Pune, Maharashtra.
          </p>

          <h2>10. Contact</h2>
          <p>
            Questions about these Terms? Email us at{" "}
            <a href="mailto:thepaperco26@gmail.com">thepaperco26@gmail.com</a> or visit our{" "}
            <Link href="/contact">contact page</Link>. See also our{" "}
            <Link href="/privacy">Privacy Policy</Link>.
          </p>
        </article>
      </div>
    </div>
  );
}
