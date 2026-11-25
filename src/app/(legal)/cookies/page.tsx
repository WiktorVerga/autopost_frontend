import type { Metadata } from "next";
import Link from "next/link";

import { CookieSettingsButton } from "@/components/cookie-settings-button";
import { BROWSER_STORAGE, CONTROLLER, COOKIES, LEGAL_PATHS, type CookieEntry } from "@/lib/legal";

import { LegalHeader, LegalSection, LegalTable } from "../legal-ui";

export const metadata: Metadata = { title: "Cookie Policy" };

const HEAD = ["Name", "Provider", "Purpose", "Duration"];

function rows(entries: CookieEntry[]) {
  return entries.map((c) => [
    <code key="name" className="font-mono text-xs">
      {c.name}
    </code>,
    c.provider,
    c.purpose,
    c.duration,
  ]);
}

function External({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}

const settingsClass = "underline underline-offset-4 hover:text-foreground";

export default function CookiePolicyPage() {
  const necessary = COOKIES.filter((c) => c.category === "necessary");
  const analytics = COOKIES.filter((c) => c.category === "analytics");

  return (
    <article>
      <LegalHeader
        title="Cookie Policy"
        intro={
          <p>
            Which cookies and similar technologies Autopost uses, why, and who receives the data.
            Analytics cookies are only set if you accept them.{" "}
            <CookieSettingsButton className={settingsClass}>Change your cookie settings</CookieSettingsButton>
            .
          </p>
        }
      />

      <LegalSection id="what" title="What cookies are">
        <p>
          Cookies are small text files that a website saves in your browser and reads on your next
          visits. Similar technologies, like the browser&apos;s local storage (localStorage), work the
          same way: they keep small pieces of data on your device. In this policy, &quot;cookies&quot;
          covers both.
        </p>
        <p>
          Some cookies are strictly necessary for the site to work and need no consent. Others, like
          analytics cookies, are only used if you agree.
        </p>
      </LegalSection>

      <LegalSection id="who" title="Who is responsible">
        <p>
          The controller is {CONTROLLER.name}, {CONTROLLER.country} (
          <a href={`mailto:${CONTROLLER.email}`}>{CONTROLLER.email}</a>), who runs{" "}
          {CONTROLLER.site}. For everything about personal data beyond cookies, see the{" "}
          <Link href={LEGAL_PATHS.privacy}>Privacy Policy</Link>.
        </p>
      </LegalSection>

      <LegalSection id="necessary" title="Strictly necessary cookies">
        <p>
          These keep you signed in, protect the sign-in flow and remember settings you chose. The
          site can&apos;t work without them, so they don&apos;t need your consent. They are set by
          Autopost on its own domain.
        </p>
        <LegalTable head={HEAD} rows={rows(necessary)} />
        <p>We also keep a few items in your browser&apos;s local storage. None of them is sent to us or to anyone else.</p>
        <LegalTable head={HEAD} rows={rows(BROWSER_STORAGE)} />
      </LegalSection>

      <LegalSection id="analytics" title="Analytics cookies">
        <p>
          We use Google Analytics 4, loaded through Google Tag Manager (container GTM-NZVWL8GG), to
          count visits and see how the site is used. Google Tag Manager loads on every visit, sets no
          cookies itself and runs under Google Consent Mode, with analytics denied by default.
          Google Analytics sends data and sets its cookies{" "}
          <strong>only after you click &quot;Accept&quot;</strong> in the cookie banner. If you reject,
          no analytics data about you is sent.
        </p>
        <LegalTable head={HEAD} rows={rows(analytics)} />
        <ul>
          <li>
            The provider is Google Ireland Limited, which acts as our processor. Google may transfer
            data to the USA under the EU-US Data Privacy Framework and Standard Contractual Clauses.
          </li>
          <li>
            We never send your email, name or Instagram username to Google Analytics. Events such as
            &quot;invite request sent&quot; carry no personal details.
          </li>
          <li>
            We use Google Consent Mode: Google is told that analytics is denied by default, and your
            choice (accept or reject) is sent to Google Tag Manager every time you make or change it.
          </li>
          <li>
            No advertising features and no ad cookies: the ad signals of Google&apos;s consent mode
            (ad_storage, ad_user_data, ad_personalization) are always denied.
          </li>
        </ul>
        <p>
          More from Google: <External href="https://policies.google.com/privacy">Privacy Policy</External>
          ,{" "}
          <External href="https://policies.google.com/technologies/partner-sites">
            how Google uses data from sites that use its services
          </External>
          , and the{" "}
          <External href="https://tools.google.com/dlpage/gaoptout">Google Analytics opt-out add-on</External>
          .
        </p>
      </LegalSection>

      <LegalSection id="sharing" title="Who the data is shared with">
        <p>
          Autopost&apos;s own cookies and local storage are not shared with anyone. Analytics data goes
          only to Google, and only if you accepted analytics cookies.
        </p>
      </LegalSection>

      <LegalSection id="third-party" title="Third-party sites">
        <p>
          When you sign in with Google or connect your Instagram account, you are sent to google.com
          or instagram.com. Those sites set their own cookies under their own policies, and Autopost
          doesn&apos;t control them:
        </p>
        <ul>
          <li>
            <External href="https://policies.google.com/technologies/cookies">How Google uses cookies</External>
          </li>
          <li>
            <External href="https://privacycenter.instagram.com/policies/cookies/">Instagram Cookie Policy</External>
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="choice" title="Your choice">
        <ul>
          <li>
            On your first visit a banner asks for your choice, with &quot;Accept&quot; and
            &quot;Reject&quot; buttons that are equally visible.
          </li>
          <li>If you close the banner without choosing, only the strictly necessary cookies are used.</li>
          <li>
            We remember your choice for 6 months, then ask again. We also ask again sooner if the
            cookies we use change.
          </li>
          <li>
            You can change your mind at any time with the Cookie settings button in the site footer,
            in Preferences inside the app, or right here.
          </li>
          <li>
            If you withdraw your consent, Google Analytics is stopped right away and the _ga cookies
            are deleted from our domain.
          </li>
        </ul>
        <p>
          <CookieSettingsButton className={settingsClass} />
        </p>
        <p>
          You can also block or delete cookies from your browser settings. Blocking the strictly
          necessary ones will stop you from signing in.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="Changes and contact">
        <p>
          If we change the cookies we use, we update this page and the &quot;Last updated&quot; date
          above. For any question, write to{" "}
          <a href={`mailto:${CONTROLLER.email}`}>{CONTROLLER.email}</a>.
        </p>
      </LegalSection>
    </article>
  );
}
