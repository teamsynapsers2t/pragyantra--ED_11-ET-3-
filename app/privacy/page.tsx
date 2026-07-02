import Link from "next/link";
import type { Metadata } from "next";
import styles from "../legal/legal.module.css";

export const metadata: Metadata = {
  title: "Privacy Policy — PAPER",
  description:
    "How PAPER collects, uses, and protects your data while you prepare for JEE and NEET.",
};

// NOTE: This is a template covering the standard disclosures for an Indian
// ed-tech SaaS. Replace the [BRACKETED] placeholders with your real legal
// entity, address, and contact, and have a lawyer review before public launch.
const LAST_UPDATED = "June 28, 2026";

export default function PrivacyPage() {
  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <Link href="/" className={styles.back}>← Back to home</Link>
        <article className={styles.card}>
          <p className={styles.kicker}>Legal</p>
          <h1 className={styles.title}>Privacy Policy</h1>
          <p className={styles.updated}>Last updated: {LAST_UPDATED}</p>

          <p>
            PAPER (&ldquo;PAPER&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) is operated by
            [LEGAL ENTITY NAME], [REGISTERED ADDRESS], India. This policy explains what
            personal data we collect when you use our website and learning platform (the
            &ldquo;Service&rdquo;), why we collect it, and the rights you have over it. By
            using the Service you agree to this policy.
          </p>

          <h2>1. Information we collect</h2>
          <ul>
            <li><strong>Account data</strong> — your name and email address, handled by our authentication provider (Clerk) when you sign up or sign in.</li>
            <li><strong>Learning data</strong> — the exams and subjects you select, the questions you attempt, your answers, time taken, and the mastery and weakness signals we compute from them.</li>
            <li><strong>Usage data</strong> — basic technical information such as device type, browser, and pages visited, used to keep the Service running and to improve it.</li>
          </ul>

          <h2>2. How we use your information</h2>
          <ul>
            <li>To provide the core Service — generating your personalised roadmap, dashboards, and root-cause / weakness analysis.</li>
            <li>To authenticate you and keep your account secure.</li>
            <li>To improve our question bank, our analysis engine, and the overall product experience.</li>
            <li>To communicate with you about your account and important changes to the Service.</li>
          </ul>

          <h2>3. AI processing</h2>
          <p>
            Some features generate study plans and analysis using third-party AI models
            (Google Gemini). The learning context required to produce your plan is sent to
            that provider solely to generate your result. We do not sell your data or use it
            to train third-party models.
          </p>

          <h2>4. Sharing and sub-processors</h2>
          <p>We do not sell your personal data. We share it only with service providers who help us run the Service, under their own security and privacy commitments:</p>
          <ul>
            <li><strong>Clerk</strong> — authentication and account management.</li>
            <li><strong>Supabase</strong> — database and storage of your learning data.</li>
            <li><strong>Google (Gemini)</strong> — AI generation of plans and analysis.</li>
          </ul>

          <h2>5. Data retention</h2>
          <p>
            We keep your data for as long as your account is active. If you delete your
            account, we delete or anonymise your personal data within a reasonable period,
            except where we are required to retain it by law.
          </p>

          <h2>6. Your rights</h2>
          <p>
            You may request access to, correction of, or deletion of your personal data, and
            you may withdraw consent at any time. To exercise these rights, contact us at
            [CONTACT EMAIL].
          </p>

          <h2>7. Children</h2>
          <p>
            The Service is intended for students preparing for competitive exams. If you are
            under 18, you should use the Service with the consent and supervision of a parent
            or guardian.
          </p>

          <h2>8. Security</h2>
          <p>
            We use industry-standard measures to protect your data, including encrypted
            connections and access controls. No method of transmission or storage is fully
            secure, but we work to protect your information and to notify you of material
            breaches as required by law.
          </p>

          <h2>9. Changes to this policy</h2>
          <p>
            We may update this policy from time to time. We will revise the &ldquo;last
            updated&rdquo; date above and, for material changes, notify you through the
            Service.
          </p>

          <h2>10. Contact</h2>
          <p>
            Questions about this policy? Email us at [CONTACT EMAIL].
          </p>

          <div className={styles.notice}>
            This document is a template and not legal advice. Replace the bracketed
            placeholders and have it reviewed by a qualified lawyer before launch.
          </div>
        </article>
      </div>
    </div>
  );
}
