import { LegalShell, Section, P, L, Li, Mail } from "./LegalShell";
import { PRODUCT } from "../../lib/site";

export default function PrivacyPage() {
  return (
    <LegalShell
      title="Privacy Policy"
      description="How Pulse collects, uses, protects, and deletes your data — including the exact permissions we request from each connected social platform."
      path="/privacy"
      updated="September 14, 2026"
    >
      <Section title="Who we are">
        <P>
          {PRODUCT.name} ("Pulse", "we", "us") is a social media scheduling tool: you write a post
          once, and we publish it — or schedule it for later — across the social platforms you
          connect. This policy explains what data we handle, why, and how to get rid of it.
        </P>
      </Section>

      <Section title="What we collect">
        <Li>
          <strong className="text-paper">Account data:</strong> your name, email address, and a
          password. We never store your password — only a bcrypt hash of it.
        </Li>
        <Li>
          <strong className="text-paper">Connection data:</strong> when you connect a social
          platform, we store the OAuth access and refresh tokens that platform gives us
          (encrypted at rest with AES-256-GCM), plus a platform account identifier and display
          name so we can show you who is connected.
        </Li>
        <Li>
          <strong className="text-paper">Content you create:</strong> the post text, captions,
          titles, the public URLs of the media you want to publish, the time you schedule
          something for, and the publish status and platform-assigned post IDs we receive back.
        </Li>
        <Li>
          <strong className="text-paper">Analytics read from your platforms:</strong> for
          connected platforms that expose metrics on their free tiers (currently YouTube and
          Instagram), we read basic performance data — channel totals, video views, likes,
          comments — via their official APIs. This data is read-only; we never modify your
          accounts.
        </Li>
        <Li>
          <strong className="text-paper">Media hosting:</strong> social platforms require media
          to be reachable at a public URL. You host your videos and images wherever you like
          (for example Cloudinary); we only read the URLs you give us in order to transfer the
          media to the platform you are posting to.
        </Li>
      </Section>

      <Section title="Exact permissions we request, per platform">
        <P>
          We request the minimum scopes each platform offers for scheduling and publishing. These
          are the exact strings our server requests — nothing more:
        </P>
        <Li>
          <strong className="text-paper">LinkedIn</strong> (<code>openid profile email
          w_member_social</code>): sign you in, read your basic profile (name, email), and publish
          posts to your own feed on your instruction.
        </Li>
        <Li>
          <strong className="text-paper">Google / YouTube</strong> (<code>youtube.upload</code>,{" "}
          <code>youtube.readonly</code>, offline access): upload videos to your channel, and read
          your channel and video statistics for the analytics shown in your dashboard.
        </Li>
        <Li>
          <strong className="text-paper">Instagram</strong> (<code>instagram_business_basic</code>
          , <code>instagram_business_content_publish</code>): read your professional account's
          basic profile and media (including like and comment counts), and publish Reels and
          photos on your instruction.
        </Li>
        <Li>
          <strong className="text-paper">TikTok</strong> (<code>user.info.basic</code>,{" "}
          <code>video.publish</code>, <code>video.upload</code>): read your basic profile and
          upload videos via Direct Post. Until our app passes TikTok's audit, uploads are forced
          to <code>SELF_ONLY</code> (only you can see them).
        </Li>
        <P>
          We do not support X/Twitter because its API has no free tier, and we request no other
          permissions beyond the four platforms listed above.
        </P>
      </Section>

      <Section title="How your data is used — and not used">
        <P>
          Everything we store exists to operate the features you use: signing you in, publishing
          and scheduling your content, showing publish status, and displaying the analytics your
          connected platforms expose.
        </P>
        <Li>We do not sell your data. To anyone. Ever.</Li>
        <Li>We do not use your data for advertising or train models on it.</Li>
        <Li>
          We do not post, read your DMs, or touch your accounts except when you (or a schedule
          you created) instruct us to.
        </Li>
        <Li>
          We share data only with the platform you are posting to (that is how publishing works)
          and with the infrastructure providers listed below.
        </Li>
      </Section>

      <Section title="Subprocessors">
        <Li>
          <strong className="text-paper">MongoDB</strong> — database. During beta this runs as a
          local/self-hosted instance; in cloud deployment it is MongoDB Atlas.
        </Li>
        <Li>
          <strong className="text-paper">Vercel</strong> — hosts this website.
        </Li>
        <Li>
          <strong className="text-paper">Cloudinary (optional, your choice)</strong> — many users
          host their video/image files there so the platforms can fetch them. We read the URLs
          you provide; we do not operate your Cloudinary account.
        </Li>
        <Li>
          <strong className="text-paper">Our email provider</strong> — used only to send you
          transactional email (for example a confirmation when your deletion request completes).
        </Li>
      </Section>

      <Section title="Data retention">
        <Li>
          Platform tokens are kept until you disconnect that platform or delete your account.
          Disconnecting deletes the stored token immediately.
        </Li>
        <Li>
          Your post history (content, schedule times, status, platform post IDs) is kept while
          your account exists.
        </Li>
        <Li>
          Full account deletion is described on the{" "}
          <L to="/data-deletion" className="text-acid underline decoration-line underline-offset-4 hover:decoration-acid">
            Data Deletion
          </L>{" "}
          page.
        </Li>
      </Section>

      <Section title="Security">
        <P>
          Passwords are hashed with bcrypt (never stored or transmitted in plain text), platform
          tokens are encrypted at rest with AES-256-GCM, sessions use signed HTTP-only cookies,
          and all traffic runs over HTTPS.
        </P>
      </Section>

      <Section title="Your rights and deleting your data">
        <P>
          You can disconnect any platform from your dashboard at any time — that immediately
          deletes the stored token for it. To delete your entire account and everything
          associated with it, see{" "}
          <L to="/data-deletion" className="text-acid underline decoration-line underline-offset-4 hover:decoration-acid">
            Data Deletion
          </L>
          .
        </P>
      </Section>

      <Section title="Children">
        <P>
          Pulse is not directed at, and we do not knowingly collect data from, children under 13
          (or the higher minimum age required by your local law). If you believe a child has
          created an account, contact us and we will delete it.
        </P>
      </Section>

      <Section title="Contact">
        <P>
          Questions about this policy or your data: <Mail email={SUPPORT_EMAIL} />.
        </P>
      </Section>
    </LegalShell>
  );
}
