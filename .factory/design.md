# Async Trace Stitcher — visual system

## Thesis: the evidence workbench

The product is a paper-cut diorama of an investigation desk: log fragments are
physical slips, identifiers are colored thread, and a timeline is the ruled
board where uncertain fragments become reviewable evidence. This is not a
decorative “craft” skin. Layering explains source boundaries, torn edges signal
imperfect exports, and visible thread paths make every correlation auditable.

The interface is deliberately single-mode, like a warm task lamp over a dark
operations room. A dark variant would weaken the paper/material metaphor and
is not included in v1; the background is painted explicitly everywhere.

## Tokens

- `paper`: `#F5EEDC` — warm evidence-sheet background.
- `paper-raised`: `#FFF9EA` — active sheets and editable surfaces.
- `ink`: `#172725` — near-black green, 13.2:1 on paper.
- `ink-muted`: `#53615D` — annotations, 5.7:1 on paper.
- `thread`: `#006B62` — primary action/correlation thread, 5.6:1 on paper.
- `thread-deep`: `#004E49` — pressed states and white button ground.
- `ochre`: `#A35D00` — uncertain/mid-confidence evidence.
- `pin-gold`: `#D29A46` — task-lamp accents and thread anchor pins.
- `brick`: `#A43A2D` — errors and unmatched evidence.
- `moss`: `#2F6B3C` — confirmed/high-confidence evidence.
- `night`: `#233330` — utility rail and “back of the diorama”.
- `rule`: `#C9BFA7` — hairlines only, never information by color alone.
- Shadows use hard offsets (`3px 4px 0`) rather than blurred glass to preserve
  the cut-paper physical logic.

## Type and measure

- Display: Georgia, `Times New Roman`, serif. Its editorial, documentary voice
  makes incident titles read like case files and avoids a generic SaaS face.
- Utility/body: system UI (`Inter` is not fetched), max two family groups.
- Scale: 14 annotation, 16 body, 20 section, 30 title, 46 hero desktop.
- Body line height 1.55; prose measure 68 characters; timestamps and identifiers
  use the system monospace stack with tabular numerals.

## Spacing and layout

An 8px base rhythm with 4px for optical adjustments. Main widths are 1180px.
The desktop investigation view has a narrow case/rules rail and a broad
timeline sheet. At 760px it becomes one column; the landing illustration drops
below the primary action, rule rows stack, and secondary metadata is condensed.
Every control is at least 44px tall with 8px separation.

## Interaction grammar

- Importing adds a new “paper slip” from the uploader into the source shelf.
- Correlation rules are always visible and named; users never accept invisible
  inference. Rule toggles and field mappings are explicit before analysis.
- Confidence is rendered with a word, percentage, and a patterned paper tab;
  color is supplementary.
- Editing an event opens an in-flow evidence drawer, preserving place.
- Destructive case deletion is confirmed with the case name. Clearing a draft
  offers a brief undo affordance.

## Motion policy

Transitions run 160–240ms and animate only opacity and transform: sheets lift
by 2px, imported slips settle from their source edge, and notices enter from the
bottom. Nothing loops. Under `prefers-reduced-motion: reduce`, transforms and
smooth scrolling are disabled; state changes use instant visibility/opacity.

## Original asset plan and prompt sheet

Hero asset: a wide, tactile paper-cut diorama showing three disconnected
systems feeding evidence slips into one stitched timeline. It communicates the
job before the copy does. UI icons and confidence patterns are hand-authored
SVG/CSS primitives because they must remain sharp and deterministic.

### Art direction prompt

- Subject: an overhead incident-investigation workbench; three small paper
  machines (application server, queue, webhook/vendor) each release timestamped
  blank slips, joined by teal thread into one ordered path.
- World/materials: layered cut cardstock, deckled edges, cotton thread, tiny
  brass pins, subtle recycled-paper fibers; no screen UI.
- Light/lens: warm raking desk-lamp light, orthographic top-down lens, shallow
  physical depth but every element crisp.
- Palette words: parchment, forest ink, deep teal thread, muted ochre, brick red.
- Composition: landscape with the stitched path moving left-to-right and open
  breathing room around it.
- Negative list: no people, hands, brands, logos, letters, legible text,
  watermarks, glossy 3D plastic, neon gradients, blue-purple SaaS styling.

### Provenance

Generated specifically for this product on 2026-08-27 using the factory image
deployment via `/opt/fleet/lib/gen-image.sh`. Prompt is stored beside the source
asset in `assets/src/hero-paper-trace.json`. Generated imagery is disclosed in
the footer. The selected source PNG is retained for provenance; 720px and
1200px optimized WebP derivatives ship with the app (36 KB and 92 KB). The
1200×630 social preview is a center crop of that original asset. The 180px
touch icon is derived from the hand-authored product mark.
