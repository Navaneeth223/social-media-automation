import { LegalShell, Section, P, L, Mail } from "./LegalShell";
import { PRODUCT } from "../../lib/site";

export default function TermsPage() {
  return (
    <LegalShell
      title="Terms of Service"
      description="The terms that apply when you create a Pulse account, connect social platforms, and schedule or publish content through Pulse."
      path="/terms"
      updated="September 14, 2026"
    >
      <Section title="The short version">
        <P>
          Pulse is a tool that publishes and schedules <em>your</em> content to{" "}
          <em>your</em> social accounts, on your instruction. You are responsible for what you
          publish and for following each platform's rules. We provide the service as-is while
          it's in beta, we never sell your data, and you can leave at any time.
        </P>
      </Section>

      <Section title="Who can use Pulse">
        <Li>You must be at least 13 years old (and old enough to legally consent where you live).</Li>
        <Li>
          You must provide a real email address and keep your account credentials secure.
        </Li>
        <Li>
          Connecting a social platform requires that you own or are authorized to manage that
          account.
        </Li>
      </Section>

      <Section title="Your content is your responsibility">
        <P>
          You decide what gets published. Pulse is a scheduling and publishing tool — we are not
          the publisher of your content and we do not review it before it goes out. You are
          solely responsible for:
        </P>
        <Li>the text, captions, videos, and images you schedule;</Li>
        <Li>
          complying with each connected platform's own terms, community guidelines, and content
          policies (LinkedIn, Google/YouTube, Meta/Instagram, TikTok);
        </Li>
        <Li>
          any consequences on those platforms (removals, restrictions, or account flags) that
          result from what you publish.
        </Li>
      </Section>

      <Section title="Acceptable use">
        <P>You agree not to use Pulse to:</P>
        <Li>send spam, bulk unsolicited content, or content designed to manipulate platform algorithms;</Li>
        <Li>publish illegal, harmful, harassing, deceptive, or infringing content;</Li>
        <Li>violate any connected platform's terms of service or automation rules;</Li>
        <Li>upload media you do not have the rights to;</Li>
        <Li>attempt to access other users' data, overload our systems, or reverse-engineer the service.</Li>
        <P>
          Accounts that violate these terms — or that are flagged by a connected platform — may
          be suspended or terminated.
        </P>
      </Section>

      <Section title="Beta service, provided as-is">
        <P>
          Pulse is currently a trial/beta product. It is provided "as is" and "as available"
          with no uptime guarantee. Features change, break, and improve. Analytics numbers come
          from the connected platforms' own APIs and may be delayed, incomplete, or revised by
          those platforms — we display exactly what they return.
        </P>
        <P>
          During the free trial, no payment is collected. If paid plans are introduced later,
          the pricing shown at signup will apply, and these terms will be updated before
          billing begins.
        </P>
      </Section>

      <Section title="Platform relationships">
        <P>
          Pulse is not affiliated with, endorsed by, or sponsored by LinkedIn, Google, YouTube,
          Meta, Instagram, or TikTok. Your use of those platforms remains governed by their own
          terms. Disconnecting a platform in Pulse removes our stored access; you can also
          revoke access from each platform's own account settings.
        </P>
      </Section>

      <Section title="Limitation of liability">
        <P>
          To the maximum extent permitted by law, Pulse and its operator are not liable for
          indirect, incidental, or consequential damages, lost profits or data, or missed
          publishing windows arising from your use of the service. The service is provided
          without warranties of any kind except those that cannot be excluded by law. If
          anything in these terms is unenforceable, the rest still applies.
        </P>
      </Section>

      <Section title="Changes to these terms">
        <P>
          We will update this page with a new "last updated" date when these terms change, and
          material changes will be announced in the product before they take effect. Continuing
          to use Pulse after a change means you accept the updated terms.
        </P>
      </Section>

      <Section title="Contact">
        <P>
          Questions about these terms: <Mail email={SUPPORT_EMAIL} />. See also our{" "}
          <L to="/privacy" className="text-acid underline decoration-line underline-offset-4 hover:decoration-acid">
            Privacy Policy
          </L>
          .
        </P>
      </Section>
    </LegalShell>
  );
}
