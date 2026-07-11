import Link from "next/link";
import type { Metadata } from "next";
import styles from "../legal/legal.module.css";

export const metadata: Metadata = {
  title: "Contact — PAPER",
  description: "Get in touch with the PAPER team — support, feedback, and everything else.",
};

export default function ContactPage() {
  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <Link href="/" className={styles.back}>← Back to home</Link>
        <article className={styles.card}>
          <p className={styles.kicker}>Contact</p>
          <h1 className={styles.title}>Get in touch</h1>

          <p>
            PAPER is built by a small team that reads every email. Whether something is
            broken, confusing, or you just want to tell us what would help your prep —
            write to us.
          </p>

          <h2>Support &amp; feedback</h2>
          <p>
            Email <a href="mailto:thepaperco26@gmail.com">thepaperco26@gmail.com</a> and
            we&rsquo;ll get back to you as soon as we can — usually within 1–2 days.
          </p>

          <h2>Privacy &amp; data requests</h2>
          <p>
            To access, correct, or delete your personal data, email{" "}
            <a href="mailto:thepaperco26@gmail.com">thepaperco26@gmail.com</a> from your
            registered address with the subject &ldquo;Data request&rdquo;. See our{" "}
            <Link href="/privacy">Privacy Policy</Link> for details.
          </p>

          <h2>Who runs PAPER</h2>
          <p>
            PAPER is operated by Tanishq Tumram, Pune, Maharashtra, India.
          </p>
        </article>
      </div>
    </div>
  );
}
