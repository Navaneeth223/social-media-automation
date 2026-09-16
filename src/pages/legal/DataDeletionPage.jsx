import { LegalShell, Section, P, Li, Mail } from "./LegalShell";
import { PRODUCT } from "../../lib/site";

export default function DataDeletionPage() {
  return (
    <LegalShell
      title="Data Deletion"
      description="How to disconnect a connected platform, or delete your entire Pulse account and all associated data — including the contact address for deletion requests."
      path="/data-deletion"
      updated="September 14, 2026"
    >
      <Section title="You have two ways to delete your data">
        <Li>
          <strong className="text-paper">Disconnect one platform</strong> — removes that
          platform's stored access immediately. Do this from inside your dashboard.
        </Li>
        <Li>
          <strong className="text-paper">Delete your entire account</strong> — removes your
          account, every platform connection and token, and all post history. Do this by email.
        </Li>
      </Section>

      <Section title="1. Disconnect a platform (instant)">
        <P>
          Log in, open your dashboard, find the platform under <strong>Platform connections</strong>,
          and press <strong>Disconnect</strong>. This immediately and permanently deletes the
          encrypted access token (and refresh token, if any) we stored for that platform, along
          with its account link. After that, Pulse can no longer read from or publish to that
          platform on your behalf.
        </P>
        <P>
          You can additionally revoke Pulse's access from the platform's own account settings
          (LinkedIn Settings → Permitted services, Google Security → Third-party connections,
          Instagram/TikTok → Apps and websites).
        </P>
      </Section>

      <Section title="2. Delete your entire account (within 30 days)">
        <P>
          Email <Mail /> with the subject <strong>"Delete my account"</strong> from the email
          address your Pulse account uses. We will:
        </P>
        <Li>delete your account, every platform connection, and all stored tokens;</Li>
        <Li>delete your entire post history (content, schedules, statuses);</Li>
        <Li>send you a confirmation email when the deletion is complete;</Li>
        <Li>complete the request within 30 days (usually much faster).</Li>
        <P>
          If you also want the content removed from the connected platforms themselves, delete
          the posts on those platforms (or ask us in the same email and we will tell you exactly
          which items Pulse published).
        </P>
      </Section>

      <Section title="What gets deleted, exactly">
        <Li>Your account: name, email, hashed password, plan, and trial data.</Li>
        <Li>Every platform connection and its encrypted access/refresh tokens.</Li>
        <Li>Every scheduled, published, and failed post in your queue and history.</Li>
        <P>
          We keep nothing beyond what is required by law (for example, records we must retain
          for billing or legal disputes, which are decoupled from your profile).
        </P>
      </Section>

      <Section title="For platform reviewers">
        <P>
          This page is publicly reachable without logging in. Pulse is currently a beta product:
          data lives in a MongoDB database (self-hosted during development; MongoDB Atlas in
          cloud deployment), the website is hosted on Vercel, and support requests are handled
          at <Mail />. Deletion requests received by email are processed manually within the
          stated window and confirmed by reply.
        </P>
      </Section>

      <Section title="Questions">
        <P>
          Anything about deletion or your data: <Mail />. See also our{" "}
          <L to="/privacy" className="text-acid underline decoration-line underline-offset-4 hover:decoration-acid">
            Privacy Policy
          </L>
          .
        </P>
      </Section>
    </LegalShell>
  );
}
