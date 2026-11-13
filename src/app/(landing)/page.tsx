import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownIcon, ArrowRightIcon, CheckIcon, TriangleAlertIcon, XIcon } from "lucide-react";

import { AuthCta } from "./auth-cta";
import { LandingMotion } from "./landing-motion";

export const metadata: Metadata = {
  title: { absolute: "Autopost · Ideas in, posts out" },
  description:
    "Autopost turns a list of ideas into Instagram carousels and publishes them on a schedule. Now in invite-only beta.",
};

const SECTIONS = [
  { href: "#beta", label: "Invite only" },
  { href: "#what", label: "What it is" },
  { href: "#guide", label: "First carousel" },
  { href: "#why", label: "Why" },
];

/** Sample queue for the hero illustration: one card per idea, same order. */
const HERO_IDEAS = [
  { title: "Why espresso crema fades in 2 minutes", card: "bg-primary text-primary-foreground" },
  { title: "Grind size, explained with sand", card: "bg-signal text-signal-foreground" },
  { title: "The 3 numbers on every coffee bag", card: "border bg-secondary text-secondary-foreground" },
  { title: "Milk steaming: stop at 60 °C", card: "bg-primary text-primary-foreground" },
];

const PIECES = [
  {
    name: "Idea collections",
    text: "Write a title and a short brief. That is the whole input: Autopost turns it into the slides, the caption and the hashtags.",
  },
  {
    name: "Templates",
    text: "Start from one of the included layouts and adjust it in the editor. Every post is drawn with it, so the page keeps one look.",
  },
  {
    name: "Programs",
    text: "A program runs on a schedule, in your timezone. Each run takes the oldest idea it hasn't used yet and produces a carousel.",
  },
  {
    name: "Contents",
    text: "Everything a program generated, with its caption. In preview mode you check a post before it goes out; in publish mode it posts by itself.",
  },
];

const WITHOUT_INVITE = [
  { ok: true, text: "Sign in with Google" },
  { ok: true, text: "Create collections and load ideas" },
  { ok: true, text: "Design and save templates" },
  { ok: true, text: "Create programs (they stay inactive)" },
  { ok: false, text: "Connect an Instagram account" },
  { ok: false, text: "Activate a program" },
  { ok: false, text: "Publish to Instagram" },
];

const GUIDE = [
  {
    title: "Sign in with Google",
    where: "Sign in",
    text: "There is no password to create: Autopost uses your Google account only to know who you are.",
  },
  {
    title: "Connect your Instagram account",
    where: "Instagram accounts → Add account",
    text: "This is the step that needs the invite. Instagram opens in a new tab and asks you to authorise Autopost; when you come back the account is listed as connected.",
  },
  {
    title: "Create a collection and add a few ideas",
    where: "Idea collections → New collection → New idea",
    text: "A collection groups related ideas, like “Espresso basics”. Each idea is a title, a short description (the angle, what to mention) and an optional category. Three or four are enough to start.",
  },
  {
    title: "Save a template",
    where: "Templates → pick a base",
    text: "Choose one of the base layouts, change what you like in the editor and save it. A program can't run without a template to draw its slides with.",
  },
  {
    title: "Create a program",
    where: "Programs → New program",
    text: "Give it a name, choose the collection, the template and a schedule. Leave “Publish to Instagram” off for now: in preview mode the carousel is generated and saved, and nothing is posted.",
  },
  {
    title: "Run it",
    where: "Programs → your program → Run now",
    text: "No need to wait for the schedule. Run now takes the first idea in the collection and generates its carousel straight away.",
  },
  {
    title: "Review, then publish",
    where: "Contents → your post → Publish now",
    text: "Open the post to see every slide and the caption. If you like it, Publish now sends it to Instagram; it takes a minute or two while Instagram processes the images.",
  },
];

export default function LandingPage() {
  return (
    <LandingMotion>
      {/* Without JavaScript nothing would ever reveal the hero. */}
      <noscript>
        <style>{".landing .invisible{visibility:visible!important}"}</style>
      </noscript>

      <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-6 px-5 md:px-10">
          <Link href="/" className="flex items-baseline gap-1.5" aria-label="Autopost home">
            <span className="font-serif text-2xl leading-none tracking-tight">Autopost</span>
            <span className="size-2 rounded-full bg-signal" aria-hidden />
          </Link>
          <nav aria-label="Sections" className="hidden items-center gap-7 md:flex">
            {SECTIONS.map((s) => (
              <a
                key={s.href}
                href={s.href}
                className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
              >
                {s.label}
              </a>
            ))}
          </nav>
          <AuthCta size="sm" />
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid w-full max-w-6xl gap-14 px-5 pt-16 pb-20 md:px-10 md:pt-24 md:pb-28 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <a
              data-hero-fade
              href="#beta"
              className="landing-paper invisible inline-flex items-center gap-2 rounded-sm border px-2.5 py-1 text-sm font-medium underline-offset-4 hover:underline"
            >
              <TriangleAlertIcon className="size-4 text-signal" aria-hidden />
              Invite-only beta: read this before you start
            </a>

            <h1 className="mt-6 font-serif text-7xl leading-[0.9] tracking-tight sm:text-8xl lg:text-9xl">
              {/* The padding keeps descenders inside the mask the lines rise out of. */}
              <span className="block overflow-hidden pb-[0.14em]">
                <span data-hero-line className="invisible block">
                  Ideas in.
                </span>
              </span>
              <span className="-mt-[0.14em] block overflow-hidden pb-[0.14em]">
                <em data-hero-line className="invisible block text-signal">
                  Posts out.
                </em>
              </span>
            </h1>

            <p data-hero-fade className="invisible mt-6 max-w-xl text-lg text-muted-foreground">
              Autopost turns a list of ideas into Instagram carousels and publishes them on a
              schedule, so your page keeps posting while you get on with the rest of your work.
            </p>

            <div data-hero-fade className="invisible mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
              <AuthCta size="lg" signedOutLabel="Sign in to the beta" signedInLabel="Open the dashboard" />
              <a
                href="#guide"
                className="inline-flex items-center gap-1.5 text-sm underline-offset-4 hover:underline"
              >
                Make your first carousel <ArrowDownIcon className="size-3.5" />
              </a>
            </div>
          </div>

          <HeroIllustration />
        </section>

        {/*
          The warning. Deliberately not animated: it has to be there the moment
          someone scrolls. White paper in both themes (see .landing-paper), with
          the signal colour doing the shouting.
        */}
        <section id="beta" className="landing-paper scroll-mt-14 border-y">
          <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-20 md:px-10 md:py-24 lg:grid-cols-[1.2fr_1fr] lg:items-start">
            <div>
              <p className="flex items-center gap-2.5 text-xl font-bold tracking-wide text-signal uppercase">
                <TriangleAlertIcon className="size-7 shrink-0" aria-hidden />
                Attention
              </p>
              <h2 className="mt-5 font-serif text-5xl leading-[0.95] tracking-tight md:text-7xl">
                Without an invite, nothing gets published.
              </h2>
              <div className="mt-8 max-w-xl space-y-4 text-lg">
                <p>
                  Anyone can sign in and look around. But while Autopost is in beta, an Instagram
                  account can only be connected if it has been added to the invite list first.
                </p>
                <p>
                  Until then you can still create programs, but they stay inactive: they never run
                  on their schedule and nothing reaches Instagram.{" "}
                  <strong className="font-bold">If connecting your account fails, this is why.</strong>
                </p>
                <p>
                  To get in, reply to whoever sent you this page with the Instagram username you
                  want to post to. Once it has been added, connect it and everything works.
                </p>
              </div>
            </div>

            <div className="rounded-lg border-2 border-foreground p-6 md:p-8">
              <p className="font-bold">Without an invite</p>
              <ul className="mt-5 space-y-3">
                {WITHOUT_INVITE.map((item) => (
                  <li key={item.text} className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ${
                        item.ok ? "border border-foreground" : "bg-signal text-signal-foreground"
                      }`}
                    >
                      {item.ok ? <CheckIcon className="size-3" /> : <XIcon className="size-3" />}
                    </span>
                    <span className={item.ok ? "" : "font-bold"}>
                      <span className="sr-only">{item.ok ? "You can: " : "You cannot: "}</span>
                      {item.text}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 border-t-2 border-foreground pt-5 font-bold">
                With an invite: all of it.
              </p>
            </div>
          </div>
        </section>

        {/* What it is */}
        <section id="what" className="mx-auto w-full max-w-6xl scroll-mt-14 px-5 py-24 md:px-10 md:py-32">
          <SectionHeading eyebrow="What it is" title="From a note to a published post.">
            You keep a list of things worth saying. Autopost does the repetitive part: it writes the
            slides and the caption, draws them with your template and posts them when you said it
            should. Today it makes carousels; reels and stories come next.
          </SectionHeading>

          {/* gap-px over a border-coloured background draws the hairline grid */}
          <dl data-reveal-group className="mt-14 grid gap-px border-y bg-border sm:grid-cols-2 lg:grid-cols-4">
            {PIECES.map((piece) => (
              // The cell keeps its background while its content fades in, or the grid colour would show through.
              <div key={piece.name} className="bg-background py-8 sm:px-6 lg:first:pl-0">
                <div data-reveal-item>
                  <dt className="font-serif text-3xl tracking-tight">{piece.name}</dt>
                  <dd className="mt-3 text-sm leading-relaxed text-muted-foreground">{piece.text}</dd>
                </div>
              </div>
            ))}
          </dl>
        </section>

        {/* Guide */}
        <section id="guide" className="mx-auto w-full max-w-6xl scroll-mt-14 px-5 py-24 md:px-10 md:py-32">
          <SectionHeading eyebrow="Step by step" title="Your first carousel.">
            Seven steps, about ten minutes. The words in the grey labels are the exact places in the
            app.
          </SectionHeading>

          <ol data-steps className="relative mt-16 max-w-3xl">
            {/* Track and its fill: the fill grows with the scroll position. */}
            <span className="absolute top-2 bottom-2 left-5 w-px bg-border" aria-hidden />
            <span
              data-steps-progress
              className="absolute top-2 bottom-2 left-5 w-px origin-top bg-signal"
              aria-hidden
            />
            {GUIDE.map((step, i) => (
              <li key={step.title} data-step className="group relative flex gap-6 pb-12 last:pb-0">
                <span className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border bg-background font-mono text-xs transition-colors duration-200 ease-out group-[.is-active]:border-signal group-[.is-active]:bg-signal group-[.is-active]:text-signal-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div data-reveal className="pt-1.5">
                  <h3 className="font-serif text-3xl leading-tight tracking-tight">{step.title}</h3>
                  <p className="mt-2 inline-block rounded-sm bg-muted px-2 py-1 font-mono text-[11px] text-muted-foreground">
                    {step.where}
                  </p>
                  <p className="mt-3 leading-relaxed text-muted-foreground">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>

          <p data-reveal className="mt-14 max-w-3xl border-l-2 border-signal pl-5 text-muted-foreground">
            <span className="text-foreground">Once the first one looks right,</span> open the
            program, turn “Publish to Instagram” on and set it active. From then on it runs on its
            schedule and posts by itself, one idea at a time, until the collection is empty.
          </p>
        </section>

        {/* Why */}
        <section id="why" className="scroll-mt-14 border-t">
          <div className="mx-auto w-full max-w-6xl px-5 py-24 md:px-10 md:py-32">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Why it exists
            </p>
            <p
              data-reveal
              className="mt-6 max-w-5xl font-serif text-4xl leading-[1.05] tracking-tight md:text-6xl"
            >
              Having ideas was never the hard part of running a page. The hard part is the hour that
              comes after each one.
            </p>
            <div data-reveal-group className="mt-12 grid max-w-5xl gap-8 text-muted-foreground md:grid-cols-2">
              <p data-reveal-item className="leading-relaxed">
                Open a design tool. Lay out ten slides. Write a caption, find the hashtags, export,
                upload, and remember to do it all again in two days. None of it is difficult, and
                all of it is what makes a page go quiet after a few good weeks.
              </p>
              <p data-reveal-item className="leading-relaxed">
                Autopost was built to take that hour away. The part only you can do, deciding what
                is worth saying, stays with you and fits in a line of text. The rest runs on a
                schedule, and you can still look at every post before it goes out.
              </p>
            </div>
          </div>
        </section>

        {/* Closing call to action */}
        <section className="border-t">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-8 px-5 py-24 md:px-10 md:py-32">
            <h2 data-reveal className="font-serif text-6xl leading-[0.9] tracking-tight md:text-8xl">
              Start with one idea.
            </h2>
            <p data-reveal className="max-w-xl text-lg text-muted-foreground">
              It is a beta: things will break, and hearing where is the whole point of inviting you.
            </p>
            <div data-reveal>
              <AuthCta size="lg" signedOutLabel="Sign in to the beta" signedInLabel="Open the dashboard" />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground md:px-10">
          <span className="flex items-baseline gap-1.5">
            Autopost <span className="size-1.5 rounded-full bg-signal" aria-hidden />
          </span>
          <span>Invite-only beta</span>
        </div>
      </footer>
    </LandingMotion>
  );
}

function SectionHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-3xl">
      <p data-reveal className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        {eyebrow}
      </p>
      <h2 data-reveal className="mt-4 font-serif text-5xl leading-[0.95] tracking-tight md:text-7xl">
        {title}
      </h2>
      <p data-reveal className="mt-6 text-lg text-muted-foreground">
        {children}
      </p>
    </div>
  );
}

/** Decorative: an idea queue on one side, the post it becomes on the other. */
function HeroIllustration() {
  return (
    <div
      data-hero-fade
      aria-hidden
      className="invisible grid items-center gap-5 sm:grid-cols-[1fr_auto_auto]"
    >
      <div className="rounded-lg border p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Idea collection · Espresso basics
        </p>
        <ol className="mt-4 divide-y">
          {HERO_IDEAS.map((idea, i) => (
            <li key={idea.title} className="py-2.5 text-sm">
              <span data-idea className="flex items-baseline gap-3">
                <span className="font-mono text-[10px] text-signal">{String(i + 1).padStart(2, "0")}</span>
                {idea.title}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <ArrowRightIcon className="mx-auto size-5 rotate-90 text-muted-foreground sm:rotate-0" />

      <div className="mx-auto w-48">
        <div className="relative aspect-[4/5]">
          {HERO_IDEAS.map((idea, i) => (
            <div
              key={idea.title}
              data-card
              className={`absolute inset-0 flex flex-col justify-between rounded-lg p-4 ${idea.card} ${
                i === 0 ? "" : "invisible"
              }`}
            >
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] opacity-70">
                Carousel · 1/6
              </span>
              <span className="font-serif text-2xl leading-[1.05] tracking-tight">{idea.title}</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] opacity-70">@yourpage</span>
              <span
                data-stamp
                className="absolute top-3 right-3 rounded-sm border border-current px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em]"
              >
                Published
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 h-px bg-border">
          <div data-progress className="h-px origin-left scale-x-0 bg-signal" />
        </div>
      </div>
    </div>
  );
}
