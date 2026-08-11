# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project overview

Personal portfolio for **Juan David Vela Coronado** (backend developer, frontend
experience). Single-page marketing site. Live at
https://juandavidvelacoronado.vercel.app/ (deployed on Vercel).

- **Framework:** Angular 17.3 (standalone components, signals, new control flow
  `@if`/`@defer`). No NgModules.
- **Styling:** SCSS + Bootstrap 5.3 + bootstrap-icons. Theming via CSS custom
  properties on `:root` / `body.theme-dark` (see `src/styles.scss`).
- **3D/graphics:** three.js (raymarching shader for the hero "light pillar").
- **Routing:** `app.routes.ts` is **empty**. This is NOT a routed app — it is a
  single scrolling page. All sections are stacked in `app.component.html` and
  navigated via anchor links + `scroll-behavior: smooth`.
- **Language:** Code comments and identifiers are frequently in **Spanish**.
  Match the surrounding language when editing a file.

## Commands

```bash
npm start        # ng serve -> http://localhost:4200 (dev)
npm run build    # ng build (production by default)
npm run watch    # dev build, watch mode
npm test         # Karma + Jasmine
```

Production build has strict budgets: initial bundle warn 500kb / error 1mb;
per-component styles warn 2kb / error 5kb.

## Architecture

Atomic-design folder layout under `src/app/shared/`:

- `atoms/` — `light-pillar` (three.js shader), `skill-card`, `social-button`,
  `section-title`, `theme-toggle`.
- `organisms/` — `navbar`, `home`, `projects`, `about-me`, `skills`, `footer`,
  `mobile-menu`. These are composed in order in `app.component.html`.
- `core/services/`
  - `theme.service.ts` — `theme` signal (`'light'|'dark'`); persists to
    localStorage; toggles `body.theme-dark`; listens to `prefers-color-scheme`.
  - `device.service.ts` — `isMobile` signal via userAgent keyword sniffing
    (note: not width-based, so desktop-narrow windows are treated as desktop).

Page section order: navbar → home → projects → about-me → skills → footer → certifications → contact me.

## The hero animation (`light-pillar.component.ts`)

The performance-critical piece. A fullscreen three.js raymarching fragment
shader rendered every frame with `requestAnimationFrame` (run outside Angular
zone). Key facts:

- Loaded via `@defer (on idle)` in `home.component.html`, only in whichever theme
  branch is active. Dark and light use different colors/rotation.
- Quality presets (`low`/`medium`/`high`) set iteration count, pixel ratio,
  precision, and target FPS. `detectDeviceCapabilities()` downgrades mobile to
  `low` and low-core desktops from `high`→`medium`.
- Theme changes fully **tear down and re-initialize** three.js (via `effect()`
  in the constructor) because the SDF blend function is baked into the shader
  source string.
- **Does NOT pause when scrolled offscreen or when the tab is hidden** — the RAF
  loop renders continuously as long as the component is alive. This is the main
  runtime cost. (See performance notes below.)

## Known performance hotspots

1. `src/styles.scss`: `body { animation: rotate 3s linear infinite; }` animates
   the globally-inherited `--angle` custom property forever. Because `--angle`
   has `inherits: true`, this triggers style recalculation across the whole DOM
   tree every frame. It is redundant with the `spin` animation already on
   `.profile-container::before`. Strong candidate for removal.
2. The light-pillar RAF renders even when the hero is scrolled out of view or
   the tab is backgrounded — no IntersectionObserver / visibilitychange gating.
3. Full three.js teardown + rebuild on every theme toggle.

## Conventions

- Prefer signals + `inject()` (already the pattern here).
- Keep heavy/browser-only work behind `isPlatformBrowser` and
  `ngZone.runOutsideAngular` (the existing code does this).
- Assets live in `src/assets` (images are `.webp`; profile is `.png`).
- **Testing:** no test requirement. The only specs present are the auto-generated
  `should create` scaffolds, so `npm test` does not imply a real suite. Verify work
  with `npm run build` plus a browser check — do not add tests unless asked, and do
  not claim test coverage.

## 1. Management of Doubts and Uncertainty
- If an instruction is ambiguous, requirements are missing, or you have doubts about the architectural implementation, DO NOT assume the answer or begin programming.
- Stop the process immediately and ask me a clear and concise question in the terminal to resolve the doubt before proceeding.

## Scope limit
- You have a strict limit when modifying the code.
- Before propose or making any change, evaluate the volume of modiying, deleted and added lines of code.
- If the volume of changes have a big probability of modifying more than 500 lines of code, DON'T make any changes.
- Instead, stop the task, explain to me why the change is so massive, and propose a strategy to break the work down into sub-modules or smaller steps of fewer than 500 lines.
