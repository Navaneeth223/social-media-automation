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

      {/* __SCOPES__ */}
    </LegalShell>
  );
}
