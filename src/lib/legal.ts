/**
 * Facts shared by the Privacy Policy, the Cookie Policy and the cookie banner.
 *
 * Keep this file in sync with the backend: every service that receives
 * personal data must be listed in PROCESSORS, every cookie or browser storage
 * key in COOKIES / BROWSER_STORAGE. When something here changes, bump
 * LEGAL_UPDATED (and CONSENT_VERSION if the analytics cookies change, so the
 * banner asks again).
 */

/** Date shown as "Last updated" on both policies. */
export const LEGAL_UPDATED = "25 November 2026";

export const LEGAL_PATHS = {
  privacy: "/privacy",
  cookies: "/cookies",
} as const;

/** Data controller (Art. 4(7) GDPR). Autopost is run by an individual, not a company. */
export const CONTROLLER = {
  name: "Wiktor Verga",
  country: "Italy",
  email: "wiktor.verga@gmail.com",
  site: "autopost.wiktorverga.com",
} as const;

export const SUPERVISORY_AUTHORITY = {
  name: "Garante per la protezione dei dati personali",
  address: "Piazza Venezia 11, 00187 Roma, Italy",
  url: "https://www.garanteprivacy.it/",
  complaintUrl: "https://www.garanteprivacy.it/i-miei-diritti",
} as const;

export type Processor = {
  /** Short name used in lists. */
  service: string;
  /** Legal entity that receives the data. */
  entity: string;
  address: string;
  /** "processor": acts on Autopost's instructions. "controller": independent controller. */
  role: "processor" | "controller";
  purpose: string;
  data: string;
  /** Where the data goes and the safeguard for transfers outside the EEA. */
  location: string;
  privacyUrl: string;
};

/** Every third party that receives personal data, in the order a user meets them. */
export const PROCESSORS: Processor[] = [
  {
    service: "Vercel",
    entity: "Vercel Inc.",
    address: "440 N Barranca Avenue #4133, Covina, CA 91723, USA",
    role: "processor",
    purpose: "Hosts the website and the app, and forwards requests to the backend.",
    data: "IP address, browser and device data, pages requested (technical logs).",
    location: "USA and global edge network. EU-US Data Privacy Framework and Standard Contractual Clauses.",
    privacyUrl: "https://vercel.com/legal/privacy-policy",
  },
  {
    service: "Microsoft Azure",
    entity: "Microsoft Ireland Operations Limited",
    address: "One Microsoft Place, South County Business Park, Leopardstown, Dublin 18, Ireland",
    role: "processor",
    purpose: "Hosts the backend server and the database with your account and content.",
    data: "All the account and app data listed in this policy.",
    location: "Data centre in the European Union.",
    privacyUrl: "https://www.microsoft.com/privacy/privacystatement",
  },
  {
    service: "Google Sign-In",
    entity: "Google Ireland Limited",
    address: "Gordon House, Barrow Street, Dublin 4, D04 E5W5, Ireland",
    role: "controller",
    purpose: "Lets you sign in with your Google account.",
    data: "Name, email address, Google account ID.",
    location: "Google may transfer data to the USA: EU-US Data Privacy Framework (Google LLC) and Standard Contractual Clauses.",
    privacyUrl: "https://policies.google.com/privacy",
  },
  {
    service: "Instagram (Meta)",
    entity: "Meta Platforms Ireland Limited",
    address: "Merrion Road, Dublin 4, D04 X2K5, Ireland",
    role: "controller",
    purpose: "Connects your professional Instagram account and publishes the posts you schedule.",
    data: "Instagram username and account ID, access token, images and captions of the posts we publish.",
    location: "Meta may transfer data to the USA: EU-US Data Privacy Framework (Meta Platforms, Inc.) and Standard Contractual Clauses.",
    privacyUrl: "https://privacycenter.instagram.com/policy",
  },
  {
    service: "Anthropic (Claude API)",
    entity: "Anthropic Ireland, Limited",
    address: "6th Floor, South Bank House, Barrow Street, Dublin 4, D04 TR29, Ireland",
    role: "processor",
    purpose: "Generates the text of your posts (slides and caption) from the ideas you write.",
    data: "Title, description and category of your ideas. No email, name or account data is sent.",
    location: "Processed in the USA by Anthropic PBC. Standard Contractual Clauses. Not used to train models; deleted within 30 days.",
    privacyUrl: "https://www.anthropic.com/legal/privacy",
  },
  {
    service: "Cloudflare R2",
    entity: "Cloudflare, Inc.",
    address: "101 Townsend St., San Francisco, CA 94107, USA",
    role: "processor",
    purpose: "Stores the images of the posts generated for you.",
    data: "Rendered slide images (they contain the text of your posts).",
    location: "Cloudflare data centres, possibly outside the EU. EU-US Data Privacy Framework and Standard Contractual Clauses.",
    privacyUrl: "https://www.cloudflare.com/privacypolicy/",
  },
  {
    service: "Resend",
    entity: "Plus Five Five, Inc. (Resend)",
    address: "2261 Market Street #5039, San Francisco, CA 94114, USA",
    role: "processor",
    purpose: "Sends the confirmation email for your beta invite request.",
    data: "Email address, Instagram username, company or field (if given).",
    location: "USA. EU-US Data Privacy Framework and Standard Contractual Clauses.",
    privacyUrl: "https://resend.com/legal/privacy-policy",
  },
  {
    service: "Notion",
    entity: "Notion Labs, Inc.",
    address: "685 Market St., San Francisco, CA 94105, USA",
    role: "processor",
    purpose:
      "Internal workspace where we track beta invite requests and the bug reports you send from the app.",
    data: "Invite requests: email, Instagram username, request date. Bug reports: your email, the text you write, page URL, browser (user agent).",
    location: "USA. EU-US Data Privacy Framework and Standard Contractual Clauses.",
    privacyUrl: "https://www.notion.com/trust/privacy-policy",
  },
  {
    service: "Google Analytics 4 (via Google Tag Manager)",
    entity: "Google Ireland Limited",
    address: "Gordon House, Barrow Street, Dublin 4, D04 E5W5, Ireland",
    role: "processor",
    purpose:
      "Tag Manager loads on every visit to manage the site's tags and sets no cookies. Google Analytics collects usage statistics only if you accept analytics cookies.",
    data: "Tag Manager: IP address and browser data needed to load the script. Google Analytics (only with consent): pseudonymous cookie ID, pages visited, approximate location, browser and device data, events (e.g. invite request sent, without email or username).",
    location: "Google may transfer data to the USA: EU-US Data Privacy Framework (Google LLC) and Standard Contractual Clauses.",
    privacyUrl: "https://policies.google.com/privacy",
  },
];

export type CookieCategory = "necessary" | "analytics";

export type CookieEntry = {
  name: string;
  provider: string;
  category: CookieCategory;
  purpose: string;
  duration: string;
};

/** Cookies set on Autopost's own domain. */
export const COOKIES: CookieEntry[] = [
  {
    name: "access_token",
    provider: "Autopost",
    category: "necessary",
    purpose: "Keeps you signed in after Google sign-in (HttpOnly, Secure).",
    duration: "7 days",
  },
  {
    name: "autopost_oauth",
    provider: "Autopost",
    category: "necessary",
    purpose: "Protects the Google sign-in flow (security state and nonce).",
    duration: "10 minutes",
  },
  {
    name: "sidebar_state",
    provider: "Autopost",
    category: "necessary",
    purpose: "Remembers whether the app sidebar is open or collapsed.",
    duration: "7 days",
  },
  {
    name: "_ga",
    provider: "Google Analytics",
    category: "analytics",
    purpose: "Distinguishes visitors with a random ID, for usage statistics.",
    duration: "2 years",
  },
  {
    name: "_ga_<ID>",
    provider: "Google Analytics",
    category: "analytics",
    purpose: "Keeps the state of the current visit (session), for usage statistics.",
    duration: "2 years",
  },
];

/** localStorage keys: not cookies, but covered by the same rules. All strictly necessary. */
export const BROWSER_STORAGE: CookieEntry[] = [
  {
    name: "autopost:cookie-consent",
    provider: "Autopost",
    category: "necessary",
    purpose: "Remembers your cookie choice, so the banner does not come back on every page.",
    duration: "6 months",
  },
  {
    name: "theme",
    provider: "Autopost",
    category: "necessary",
    purpose: "Remembers the theme you chose (light, dark or system).",
    duration: "Until you clear it",
  },
  {
    name: "autopost:beta-banner-dismissed",
    provider: "Autopost",
    category: "necessary",
    purpose: "Remembers that you closed the beta banner.",
    duration: "Until you clear it",
  },
  {
    name: "autopost:template-draft:<id>",
    provider: "Autopost",
    category: "necessary",
    purpose: "Keeps unsaved edits of a template in the editor.",
    duration: "1 hour",
  },
];
