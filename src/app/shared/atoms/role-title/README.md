# `app-role-title` — roll-up animated word cycler

A small atom that cycles through a list of words with a **vertical roll-up** animation
applied **letter by letter**, without pushing around the text next to it. Used in the
hero title:

```html
<h1 class="home-title"><app-role-title></app-role-title> Engineer</h1>
```

## The behavior

- The **incoming** word rises from the bottom while fading **in** (`opacity 0 → 1`).
- The **outgoing** word keeps rising, up and out, while fading **out** (`opacity 1 → 0`).
- Both motions happen **at the same time**, so it reads as one continuous roll.
- Each **letter** animates on its own, offset from the previous one, producing a
  left-to-right wave instead of the whole word moving as one block.
- The component **reserves the width of the longest word**, so the text that follows
  it (e.g. `Engineer`) never shifts horizontally as the word changes.
- It also stays **baseline-aligned** with that trailing text.

## Inputs

| Input      | Type       | Default                       | Description                                            |
| ---------- | ---------- | ----------------------------- | ------------------------------------------------------ |
| `words`    | `string[]` | `['Systems','Software','AI']` | Words to cycle through.                                |
| `color`    | `string?`  | `var(--contrast-text-color)`  | Text color. When omitted, uses the theme variable.     |
| `font`     | `string?`  | *(inherited)*                 | `font-family`. When omitted, inherits from the parent. |
| `interval` | `number`   | `2000`                        | Milliseconds each word stays visible.                  |

The per-letter delay is the `CHAR_STAGGER_MS` constant (50ms) in
`role-title.component.ts`. It is **not** an `@Input` because `stagger()` is resolved
when the animation trigger is built, not per render.

### Usage

```html
<!-- Defaults (inherits font, uses --contrast-text-color) -->
<app-role-title></app-role-title>

<!-- Custom -->
<app-role-title
  [words]="['Backend', 'Frontend', 'Full-Stack']"
  [color]="'#ecda37'"
  [font]="'Poppins, sans-serif'"
  [interval]="2500">
</app-role-title>
```

## How the effect is achieved

```html
<span class="role-title">
  <span class="sizer" aria-hidden="true">{{ longestWord() }}</span>   <!-- reserves space -->
  <span class="visually-hidden">{{ currentWord() }}</span>            <!-- for screen readers -->
  <div class="clip" aria-hidden="true">
    @for (word of [currentWord()]; track word) {
      <span class="word" [@rollChars]>                               <!-- positions + centers -->
        @for (char of word.split(''); track $index) {
          <span class="char">{{ char }}</span>                       <!-- animated letter -->
        }
      </span>
    }
  </div>
</span>
```

### 1. Reserving space with a hidden "sizer" (no JS measuring)

`longestWord()` is computed once from the `words` array (the one with the greatest
`.length`). It's rendered inside `.sizer`, which sits in normal flow but is
`visibility: hidden` — so it paints nothing yet still **defines the box's width,
height, and baseline**. Every incoming/outgoing word is absolutely positioned on top
of it, so the outer box is always exactly as wide as the longest word and the trailing
text never jumps. This is fully responsive (no pixel measuring in JS).

### 2. Centering each word inside the reserved space

The reserved box is as wide as the **longest** word, so shorter words (e.g. `AI`) have
leftover space. To center them rather than let them sit against the left edge, `.word`
anchors **both** horizontal edges:

```scss
.word {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;        // left + right together => box spans the full reserved width
  text-align: center;
  white-space: nowrap;
}
```

An absolutely positioned element with `left: auto; right: auto` falls back to its
*static position* and shrink-wraps to its own text — so it can't be centered with
`text-align` on the parent. Setting `left: 0; right: 0` instead **stretches** the box
across the full reserved width, which gives `text-align: center` actual space to center
the glyphs within.

### 3. Baseline-safe layering with a separate `.clip` layer

`.clip` is `position: absolute; inset: 0`, matching the box that `.sizer` reserved. It
exists as its own layer so that any `overflow` set on it does **not** affect the outer
box's baseline: an inline-block with `overflow: hidden` uses its bottom edge as its
baseline, which would misalign the trailing `Engineer`. Because `.clip` is absolute, it
sits outside the baseline calculation — the baseline still comes from `.sizer`.

> Currently `.clip` is set to `overflow: visible`, so letters are **not** cut off as
> they travel; they fade out in open space. Switch it to `overflow: hidden` if you want
> them clipped to the line, as if rolling out of a slot.

### 4. Simultaneous enter/leave via `@for … track`

The visible word is rendered through `@for (word of [currentWord()]; track word)`.
Tracking **by the word value** means that when `currentWord()` changes, Angular sees a
new identity: it destroys the old node (triggering `:leave`) and creates the new one
(triggering `:enter`) in the same change-detection pass. Both are absolutely positioned,
so they overlap and animate in parallel.

Note the inner loop reads `word.split('')` — the **loop variable**, not `currentWord()`.
That matters: while the outgoing word is still on screen playing its `:leave`, its view
must keep rendering *its own* letters, not the new word's.

### 5. The letters: `query` + `stagger`

The trigger stays on `.word` (the unit that enters/leaves), but the animation reaches
*inside* it with `query('.char', …)` and offsets each letter with `stagger()`:

```ts
trigger('rollChars', [
  transition(':enter', [
    query('.char', [
      style({ transform: 'translateY(100%)', opacity: 0 }),   // start below, invisible
      stagger(CHAR_STAGGER_MS, [                              // each letter 50ms after the last
        animate('0.5s ease-out', style({ transform: 'translateY(0)', opacity: 1 })),
      ]),
    ], { optional: true }),
  ]),
  transition(':leave', [
    query('.char', [
      stagger(CHAR_STAGGER_MS, [
        animate('0.5s ease-in', style({ transform: 'translateY(-100%)', opacity: 0 })),
      ]),
    ], { optional: true }),
  ]),
]);
```

`{ optional: true }` keeps `query` from throwing if a word is empty and there are no
letters to match.

The critical CSS detail is that **`transform` has no effect on `inline` elements**, so
each letter must be `display: inline-block`. They stay in normal flow, which means they
lay themselves out side by side automatically and `.word`'s `text-align: center` centers
the whole run — no per-letter position math needed.

```scss
.char {
  display: inline-block;
  white-space: pre;   // preserves spaces in multi-word entries like "Full Stack"
}
```

`white-space: pre` matters because an inline-block containing only a space would
otherwise collapse to zero width, silently deleting spaces from compound words.

**Timing budget:** with a 50ms stagger, the last letter of an 8-character word starts at
350ms and runs for 500ms, so a full swap takes ~850ms — comfortably inside the 2000ms
`interval`.

### 6. Accessibility

Splitting a word into individual spans makes screen readers announce it letter by letter
("S… o… f…"). To avoid that, the animated letters live under `aria-hidden="true"` and the
real word is exposed once via a `.visually-hidden` span (a Bootstrap utility class —
Bootstrap's CSS is loaded globally in `angular.json`).

> There is currently no `prefers-reduced-motion` handling. To add it back, neutralize the
> transform on the letters:
> ```scss
> @media (prefers-reduced-motion: reduce) {
>   .char { transform: none !important; }
> }
> ```

### 7. SSR-safe

The `setInterval` cycle only starts in the browser (guarded with `isPlatformBrowser`),
so it doesn't run during server-side rendering / prerendering.
