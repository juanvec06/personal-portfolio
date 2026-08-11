# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: recruiters, hiring managers, and technical leads screening for **remote
junior or internship backend roles**, written international-first (English) but
required to still read well to Colombian companies and local internship programs.

They arrive cold — usually from a LinkedIn profile or an application — and skim
fast, on desktop or phone, with no prior context about the candidate or his
university. Their job is to decide within a minute or two whether this person is
worth a conversation.

Secondary, and confirmed as real traffic rather than an afterthought: professors,
peers, and other people sent the link directly.

## Product Purpose

A single-page portfolio for **Juan David Vela Coronado** (brand short form: "Juan
Vela"), a Systems Engineering student at Universidad del Cauca in Popayán,
Colombia, focused on backend development and open to internships and junior roles,
including remote.

Success is explicitly **being remembered**. Among a field of interchangeable junior
candidates, the site wins by being distinct enough that the visitor still recalls
it later — memorability outranks any single click, including resume downloads and
contact form submissions. Contact, resume, and GitHub links are all present and
must work, but none of them is the metric.

Live at https://juandavidvelacoronado.vercel.app/ (deployed on Vercel).

## Positioning

A backend-focused engineering student who can also build and ship the frontend —
evidenced by the portfolio itself being a non-trivial Angular application (three.js
raymarching shader, scroll-driven canvas frame sequence, light/dark theming) rather
than a template. The site is simultaneously the argument and the proof of the
argument.

Supporting facts, all verifiable and none to be embellished:

- Ranked among the top of his cohort; enrolled 2022-07-01, semester ongoing.
- Backend: Java, Spring Boot, NestJS, Python, Golang, Node.js, PostgreSQL, MariaDB,
  OracleDB. Frontend: Angular, TypeScript, React.
- Spanish native, English B2 (certified).
- Popayán, Colombia · open to remote.

## Operating Context

Evaluated in a fast screening pass, often as one of many tabs, frequently on a
phone. The visitor may never scroll past the first viewport, and may arrive with
the page already deep-linked to a section anchor. The site is also handed out
directly as a link in conversation, so it must be presentable without setup or
explanation.

## Capabilities and Constraints

- Angular 17.3, standalone components, signals, `@if` / `@defer`. No NgModules.
- **Not a routed app.** `app.routes.ts` is empty; every section is stacked in
  `app.component.html` and navigated by anchor links plus smooth scrolling.
  Section order: navbar → home → projects → about-me → skills → certifications →
  footer. (A `contact` component exists but is commented out.)
- Light and dark themes are a first-class product feature, not a toggle bolted on:
  several sections load different assets and different three.js configurations per
  theme.
- Content that would otherwise go stale is **computed, not hardcoded** — age from
  birth date, academic semester from enrollment date. Future content must preserve
  this property rather than freezing a number that silently rots.
- Production build budgets are strict and currently exceeded (initial bundle over
  the 500 kB warning threshold; several component stylesheets over 2 kB).
- No accessibility standard or target has been established as a product
  requirement. Undecided, not "none."

## Brand Commitments

- Name as displayed: "Juan David Vela Coronado" in full (navbar, home), "Juan Vela"
  as the short/brand form (footer, logo lockup).
- Stated role: "Software Developer" (navbar), with the home headline rotating
  "Systems / Software / Backend" before the word "Engineer".
- Interface copy is **English**. Source comments and identifiers are frequently
  **Spanish** — match the surrounding language when editing a file.
- Canonical contact points: spartanjuanv@gmail.com, LinkedIn
  (`juan-david-vela-coronado-a609b7266`), GitHub (`juanvec06`).

## Evidence on Hand

Real and usable:

- **Three real projects**, with images: a barbershop appointment and administrative
  management system (Angular + Spring Boot, API gateway), this portfolio, and an
  academic project-management platform (Java/Spring Boot microservices + Swing).
- `assets/resume.pdf`, profile photography (`profile2.webp`, theme-specific
  `about-me-{light,dark}.webp`), and per-project screenshots.
- Two 270-frame tree-growth image sequences (`assets/tree`, `assets/white-tree`),
  one per theme, driving the projects section.

Real but **not yet on the site** — to be supplied by Juan, never invented:

- **Certifications exist and are wanted.** The B2 English certification is already
  named in About Me; others are held. The `certifications` component is currently
  the untouched Angular CLI scaffold (`<p>certifications works!</p>`) and is
  **live in production**.
- **More real projects are coming.** `projects[3]` and `projects[4]` are explicitly
  marked placeholder entries in the source and are also live. They are stand-ins
  for real work, not permanent filler.
- **A contact section is intended.** The commented-out `contact` component
  represents real intent, not an abandoned idea.

Absences that future work must not paper over: there are no testimonials, no
employment history, no client work, no metrics, and no press. Nothing in these
categories may be fabricated to fill a layout.

## Product Principles

1. **Memorability is the success metric.** When a choice trades distinctiveness for
   convention, distinctiveness wins — that is the stated goal of the site.
2. **Legible cold to an outsider.** An international visitor with no knowledge of
   Universidad del Cauca or the Colombian market must still grasp the claim.
   Local-context credentials need to carry weight without requiring local context.
3. **Never fabricate credentials.** Placeholder projects, unlisted certifications,
   and missing proof are gaps to be filled by Juan or designed around honestly —
   never invented, and never left as scaffold text in production.
4. **Self-updating truth.** Facts that drift with time are computed from a source
   date, not written as literals.
5. **The build is the portfolio.** Implementation quality in this repository is
   itself the evidence for the positioning claim, so shipped defects cost more here
   than on an ordinary marketing page.
