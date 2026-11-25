import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

import { CONTROLLER, LEGAL_PATHS, PROCESSORS, SUPERVISORY_AUTHORITY } from "@/lib/legal";

import { LegalHeader, LegalSection, LegalTable } from "../legal-ui";

export const metadata: Metadata = { title: "Privacy Policy" };

const ROLE_LABEL = {
  processor: "Processor (acts on our instructions)",
  controller: "Independent controller",
} as const;

function External({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}

function Mail() {
  return <a href={`mailto:${CONTROLLER.email}`}>{CONTROLLER.email}</a>;
}

/** One processing activity: what, why, legal basis, how long. */
function Activity({
  title,
  data,
  why,
  basis,
  retention,
  children,
}: {
  title: string;
  data: ReactNode;
  why: ReactNode;
  basis: ReactNode;
  retention: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-lg border p-5">
      <h3 className="font-medium">{title}</h3>
      <dl className="mt-3 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[8rem_1fr]">
        <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground sm:pt-1">Data</dt>
        <dd>{data}</dd>
        <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground sm:pt-1">Why</dt>
        <dd>{why}</dd>
        <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground sm:pt-1">Legal basis</dt>
        <dd>{basis}</dd>
        <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground sm:pt-1">Kept for</dt>
        <dd>{retention}</dd>
      </dl>
      {children ? <div className="mt-3 text-sm text-muted-foreground">{children}</div> : null}
    </div>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <article>
      <LegalHeader
        title="Privacy Policy"
        intro={
          <p>
            This policy explains which personal data Autopost ({CONTROLLER.site}) collects, why, who
            receives it and what your rights are under the EU General Data Protection Regulation
            (GDPR). Cookies are covered in detail in the{" "}
            <Link href={LEGAL_PATHS.cookies} className="underline underline-offset-4">
              Cookie Policy
            </Link>
            .
          </p>
        }
      />

      <LegalSection id="summary" title="In short">
        <ul>
          <li>Autopost is run by one person, {CONTROLLER.name}, in {CONTROLLER.country}.</li>
          <li>We only collect what we need to run the beta, your account and your posts.</li>
          <li>
            The text of your ideas is sent to Anthropic&apos;s Claude API to write your posts. It is
            not used to train AI models.
          </li>
          <li>Beta requests and bug reports are also tracked in our private Notion workspace.</li>
          <li>Google Analytics runs only if you accept analytics cookies.</li>
          <li>We never sell your data or use it for advertising.</li>
          <li>
            Write to <Mail /> to see, correct or delete your data.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="controller" title="Who is responsible for your data">
        <p>The data controller is:</p>
        <p className="rounded-lg border p-4">
          <span className="font-medium">{CONTROLLER.name}</span> (individual), {CONTROLLER.country}
          <br />
          Email: <Mail />
        </p>
        <p>
          No Data Protection Officer has been appointed, as the law does not require one for a
          service of this size. For any privacy question or request, contact the controller directly.
        </p>
      </LegalSection>

      <LegalSection id="data" title="What we collect and why">
        <div className="space-y-4">
          <Activity
            title="Visiting the website"
            data="IP address, browser and device type, pages requested, date and time (technical logs)."
            why="To deliver the pages, keep the service secure and fix technical problems."
            basis="Legitimate interest in running a secure website (Art. 6(1)(f) GDPR)."
            retention="A short time, according to the log retention of our hosting providers (Vercel and Microsoft Azure)."
          />

          <Activity
            title="Requesting a beta invite"
            data="Email address and Instagram username (required); company or field (optional)."
            why={
              <>
                To review your request, add your Instagram account to the beta and tell you when it is
                ready. The request is saved in our database and copied to our private Notion workspace,
                where we manage the beta. We send you a confirmation email through Resend, and the
                controller receives a notification email with your details.
              </>
            }
            basis="Steps taken at your request before providing the service (Art. 6(1)(b) GDPR)."
            retention="Until your request is handled, and no longer than 12 months after the beta ends. Earlier if you ask us to delete it."
          >
            Before sending the form you confirm that you have read this policy. This is an
            acknowledgement, not the legal basis for the processing.
          </Activity>

          <Activity
            title="Your account (Google Sign-In)"
            data="Name, email address, Google account ID and sign-up date. A session cookie keeps you signed in."
            why="To create your account, sign you in and keep your content tied to you."
            basis="Performance of the contract with you (Art. 6(1)(b) GDPR)."
            retention={
              <>
                While your account exists. There is no self-service deletion yet: write to <Mail /> and
                we will delete your account and its data.
              </>
            }
          >
            Google shares these details with us when you choose to sign in with Google. Google acts as
            an independent controller for your Google account.
          </Activity>

          <Activity
            title="What you create in the app"
            data="Idea collections and ideas (title, description, category), templates, programs and schedules, generated posts (captions and slide images), and the logs of each program run."
            why="To provide the service: generate, store, schedule and publish your posts. Slide images are stored in a private Cloudflare R2 bucket."
            basis="Performance of the contract with you (Art. 6(1)(b) GDPR)."
            retention="While your account exists, or until you delete the item."
          />

          <Activity
            title="AI generation of your posts"
            data="The title, description and category of the idea being turned into a post. Your name, email and account details are not sent."
            why="Anthropic's Claude API writes the slides and the caption of each post from your idea."
            basis="Performance of the contract with you (Art. 6(1)(b) GDPR)."
            retention="Anthropic does not use API data to train its models and deletes inputs and outputs within 30 days, except content flagged under its Usage Policy."
          >
            The post text is generated by AI. Please review it: you decide what gets published. Do not
            put personal data about other people in your ideas.
          </Activity>

          <Activity
            title="Connecting Instagram"
            data="Instagram username, Instagram account ID, access token (encrypted in our database) and its expiry date."
            why={
              <>
                To publish on your professional Instagram account the posts you schedule. We use
                Instagram Login by Meta with only two permissions: <code>instagram_business_basic</code>{" "}
                and <code>instagram_business_content_publish</code>.
              </>
            }
            basis="Performance of the contract with you (Art. 6(1)(b) GDPR)."
            retention="Until you disconnect the account (the token is deleted) or delete your Autopost account."
          >
            Meta is an independent controller for the data on Instagram, including the posts once
            published.
          </Activity>

          <Activity
            title="Bug reports and feedback"
            data="Category, your description, the page you were on, browser and system (user agent), linked to your account. The report is copied to our private Notion workspace together with your email."
            why="To understand and fix problems, and to improve the beta."
            basis="Legitimate interest in keeping the service working and improving it (Art. 6(1)(f) GDPR)."
            retention="Until the report is resolved, and no longer than 24 months. If you delete your account, the report stays in our database without any link to you."
          />

          <Activity
            title="Usage statistics (Google Analytics)"
            data="A random cookie ID, pages visited, approximate location, browser and device, and events such as 'invite request sent'. We never send your email or Instagram username to Google Analytics."
            why="To understand how the website is used and improve it. Google Tag Manager loads on every visit under Google Consent Mode, but Google Analytics sends data only after you accept."
            basis="Your consent, given in the cookie banner (Art. 6(1)(a) GDPR). You can withdraw it at any time."
            retention={
              <>
                See the{" "}
                <Link href={LEGAL_PATHS.cookies}>Cookie Policy</Link> for cookie names and durations.
              </>
            }
          />

          <Activity
            title="Backups"
            data="A copy of the database."
            why="To restore the service after a failure."
            basis="Legitimate interest in not losing your data (Art. 6(1)(f) GDPR)."
            retention="Daily backups, each kept for 7 days."
          />
        </div>
      </LegalSection>

      <LegalSection id="required" title="What is required and what is optional">
        <ul>
          <li>
            <strong>Beta invite:</strong> email and Instagram username are required, otherwise we
            cannot handle your request. Company or field is optional.
          </li>
          <li>
            <strong>Account:</strong> your Google account details are required to create and use an
            account.
          </li>
          <li>
            <strong>Instagram:</strong> connecting an account is needed only to publish posts.
          </li>
          <li>
            <strong>Analytics:</strong> fully optional. Saying no has no effect on the service.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="recipients" title="Who receives your data">
        <p>
          Only the controller has access to your data. The services below receive it to make Autopost
          work. Processors act only on our instructions, under a data processing agreement.
        </p>
        <LegalTable
          head={["Service", "Role", "Purpose and data", "Location and safeguards"]}
          rows={PROCESSORS.map((p) => [
            <div key="service">
              <p className="font-medium">{p.service}</p>
              <p className="mt-1 text-muted-foreground">
                {p.entity}, {p.address}
              </p>
              <p className="mt-1">
                <External href={p.privacyUrl}>Privacy policy</External>
              </p>
            </div>,
            ROLE_LABEL[p.role],
            <div key="purpose">
              <p>{p.purpose}</p>
              <p className="mt-1 text-muted-foreground">{p.data}</p>
            </div>,
            p.location,
          ])}
        />
        <p>
          We do not sell your data and do not use it for advertising. No decision with legal or
          similarly significant effects is taken about you by automated means (Art. 22 GDPR).
        </p>
      </LegalSection>

      <LegalSection id="transfers" title="Transfers outside the EU">
        <p>
          Some of the services above are based in the United States or may process data there. These
          transfers are protected by:
        </p>
        <ul>
          <li>
            the <strong>EU-US Data Privacy Framework</strong>, for providers certified under it
            (adequacy decision, Art. 45 GDPR);
          </li>
          <li>
            the <strong>Standard Contractual Clauses</strong> approved by the European Commission
            (Art. 46 GDPR), included in the providers&apos; data processing agreements.
          </li>
        </ul>
        <p>The table above shows which safeguard applies to each service.</p>
      </LegalSection>

      <LegalSection id="security" title="How we protect your data">
        <ul>
          <li>All traffic uses HTTPS.</li>
          <li>The session cookie is HttpOnly and Secure: scripts on the page cannot read it.</li>
          <li>Instagram access tokens are encrypted in the database.</li>
          <li>Post images are kept in a private bucket and shown only through time-limited links.</li>
          <li>Access to servers, database and tools is limited to the controller.</li>
        </ul>
      </LegalSection>

      <LegalSection id="rights" title="Your rights">
        <p>Under Articles 15 to 22 of the GDPR you can:</p>
        <ul>
          <li>access your data and get a copy of it;</li>
          <li>have inaccurate data corrected;</li>
          <li>have your data deleted;</li>
          <li>restrict the processing;</li>
          <li>receive your data in a portable format;</li>
          <li>object to processing based on legitimate interest;</li>
          <li>withdraw your consent at any time, without affecting earlier processing.</li>
        </ul>
        <p>
          To use these rights, write to <Mail />. We answer within one month. You can change your
          analytics choice at any time with the &ldquo;Cookie settings&rdquo; link at the bottom of the
          page.
        </p>
        <p>
          You also have the right to lodge a complaint with the {SUPERVISORY_AUTHORITY.name} (
          {SUPERVISORY_AUTHORITY.address},{" "}
          <External href={SUPERVISORY_AUTHORITY.complaintUrl}>how to file a complaint</External>) or
          with the authority of the EU country where you live or work.
        </p>
      </LegalSection>

      <LegalSection id="age" title="Age">
        <p>
          Autopost is not intended for people under 14, the age of digital consent in Italy. Do not
          use the service or send us data if you are younger.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="Changes to this policy">
        <p>
          When this policy changes, the date at the top is updated. If a change is significant, we
          will tell you by email or in the app.
        </p>
      </LegalSection>
    </article>
  );
}
