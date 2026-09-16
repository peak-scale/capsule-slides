# Capsule slides — design language

A reveal.js deck for the Capsule project. `index.html` holds the slides, `styles.css`
the theme and per-slide layouts, `deck.js` the booth loop and chrome. All colours flow
through semantic `--theme-*` tokens defined at the top of `styles.css`; **never hard-code
a hex value in a slide rule — reference a token** so both the dark (default) and light
(`?theme=light`) themes stay correct.

## The one rule: two slide tiers, one tonal ladder

The deck has two kinds of slide, and the whole design language rests on keeping them
distinct. Get this right first.

| | **Top row** (horizontal slides) | **Vertical stack** (nested deep-dives) |
|---|---|---|
| What it is | The main left-to-right narrative. Also the **first** slide of any vertical stack. | The 2nd..nth slide *below* a top-row slide (`section > section:not(:first-child)`). |
| Background | `--theme-background` → `--ink` `#1a2a39` | `--theme-vertical-background` → `--ink-deep` `#0f1b26` (**one step darker**) |
| Panel fill | `--panel-background` → `#253744` | `--panel-background` overridden to `--theme-vertical-panel` → `#16232f` (**one step darker**) |
| Feel | The bright, primary surface. | A quieter, recessed "we're drilling in" surface. |

The point: **a vertical stack is the whole top-row look shifted one tonal step darker.**
Background and panels move down together, so panels still sit exactly one step above their
background on both tiers — the *relationship* is identical, the *absolute* tone is not.
That contrast is what tells the audience they've descended into a sub-topic. Do not
flatten it, and do not give a vertical-stack panel the bright `#253744` top-row fill.

Mechanically, panels come from a single CSS rule (`styles.css`, the
`section > section:not(:first-child)` block): it re-points `--panel-background`. Every
`.panel` inside a vertical slide inherits the darker fill automatically — you don't touch
individual panels. The **background colour**, however, is declared per-slide with a
`data-background-color` attribute in `index.html` (`var(--theme-background)` on top-row
slides, `var(--theme-vertical-background)` on deep-dive slides) — see below.

### Backgrounds go on `data-background-color`, never on the section

Set each slide's surface colour with a `data-background-color="var(--theme-…)"` attribute
on its `<section>`, so Reveal paints it in its dedicated `.backgrounds` layer. **Do not put
`background:` on the `<section>` in `styles.css`.** With `backgroundTransition: fade`, a
section's own background fades with the section's opacity during a transition; between two
vertical slides both children go semi-transparent at the midpoint and the parent stack's
*lighter* background flashes through. Reveal's background layer crossfades independently and
has no such flash. The `var()` resolves against the theme tokens, so both themes still work.
Adding a new slide? Give it a `data-background-color` — a bare section renders transparent.

**Light theme note:** there is no "darker paper", so in light mode both tiers collapse to
paper background + white panels. The two-tier darkening is a dark-theme effect by design;
don't try to force a distinction in light mode.

## The panel surface ladder

Within either tier, panels use **one navy tonal ladder — nothing else.** Three surfaces,
in order from recessed to raised:

1. **Panel container** — `--panel-background`. The card itself (`.panel`, and standalone
   cards like `.request-stage`). Use the shared panel language: `--panel-background`
   fill, `--theme-border`, `--panel-shadow`.
2. **Inner box (default)** — `--theme-card-subtle`. Boxes *inside* a panel
   (`.panel__item` and friends). A subtle translucent lift.
3. **Emphasis (the single highlight)** — `--theme-panel-emphasis` (`#253744` dark /
   `--blue-pale` light). For the **one** box on a slide that must stand out from its
   neighbours: the forwarded/"after" request, the proxy node, a section header. It is
   one step lighter than a panel — **tonal emphasis, not a colour accent.**

There is exactly **one** emphasis shade. If two things on a slide both need to pop, they
share `--theme-panel-emphasis`. Do not invent a second highlight tone, and **never use a
tinted/coloured fill for a panel or box** — earlier drafts used a tinted `--theme-card-tinted`
for highlights and it read as "yet another colour"; that is the mistake this document
exists to prevent.

## Gradients and textures

Panel and box **fills stay flat** — the tonal ladder conveys depth, so a gradient surface
just adds a colour to parse. Gradients are fine where they're functional or atmospheric: a
meter fill, a connector hairline, a subtle background texture. Keep textures subtle and
sparse — don't overdo them.

## Nesting

Prefer one level — a panel with boxes directly inside it. Going deeper is fine when it
models a real containment hierarchy the audience should see (e.g. cluster → tenants →
namespaces, or a single Tenant → its dev/staging/prod namespaces). Just don't nest purely
for visual grouping.

## Accents: marks only, never fills

`--theme-accent` (`--sky` in dark, `--blue-bright` in light) and the other accent colours are
reserved for **small marks and text**: `GET` badges, status dots, avatars, the k8s circle,
connector arrows/dividers, and accent words in headings. Accent colour never fills a panel
or a box background. Keep it sparse — it earns attention precisely because surfaces stay
neutral navy.

### The categorical set: `.dot--coral` / `.dot--sky` / `.dot--yellow`

Where a slide labels *different things* rather than emphasising one — the three tenants,
the three namespaces on the budget board — the dots use three deliberately separated
hues. They are a **set**, not a ladder: keep them far apart in hue so a viewer can tell
them apart at booth distance. `--sky` doubles as `--theme-accent`, so don't pair it with
another blue in the same set — that is why the third slot is `--yellow` and not
`--blue-bright`.

## Center compositions through a layout wrapper

When a slide has multiple major content regions—typically a heading plus a diagram—wrap
them in one slide-specific layout container (`.two-col`, `.rules-layout`, and so on).
The `.slide-body` flex rule centers that wrapper as a single composition. **Do not leave
the heading and diagram as separate flex children and compensate with manual top margins**;
they will be positioned independently and the whole composition can sit too high or low.
Use margins inside the wrapper only to control the spacing between its regions.

## Adding a new slide or panel — checklist

- New top-level slide? → Add its `.slide--<name> .slide-body` class to the flex layout rule in `styles.css` so `deck.js` perfectly centers its content vertically.
- Heading plus diagram? → Group them in one layout wrapper so they center together.
- Reference `--theme-*` tokens; no literal hex in slide rules.
- New card → use the `.panel` surface (`--panel-background` / `--theme-border` /
  `--panel-shadow`). It inherits the correct tier automatically.
- Need to highlight one box? → `--theme-panel-emphasis`. Not a new colour, not a tint.
- Want to introduce a new token? Prefer reusing the ladder. If you truly must add one,
  define it for **both** themes in `:root` and `body[data-theme="light"]`.
- Verify **both** themes and **both** tiers before calling it done (see below).

## Previewing / screenshots

Serve locally: `nix-shell -p python3 --run "python -m http.server 8080"`, then
`http://localhost:8080`. Add `?theme=light` for the light theme.

Headless-Chrome screenshots need a custom `FONTCONFIG_FILE` or all text renders blank in
this NixOS environment — see the project memory note `screenshot-fontconfig`. Deck hash is
`#/<horizontal>/<vertical>`; e.g. the proxy deep-dive vertical stack is `#/6/1`..`#/6/5`.
