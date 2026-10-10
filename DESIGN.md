---
name: Hawma
description: The neighborhood, made legible.
colors:
  primary: "#283a35"
  primary-deep: "#1c2d29"
  ground: "#d9ad2b"
  surface: "#f4eedb"
  surface-light: "#fbf8ed"
  signal: "#a3392d"
  resolved: "#245d47"
  gold-light: "#edcf5c"
  green-light: "#a8c496"
  text: "#202e2a"
  text-muted: "#4d554a"
  rule: "rgba(32, 46, 42, 0.27)"
typography:
  body:
    fontFamily: "Barlow, Noto Sans Arabic, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Barlow, Changa, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.04em"
rounded:
  none: "0px"
spacing:
  xs: "6px"
  sm: "10px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface-light}"
    rounded: "{rounded.none}"
    padding: "0 16px"
    height: "42px"
  report-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.none}"
    padding: "0 14px"
    height: "65px"
---

# Design System: Hawma

## Overview

**Creative North Star: "The Neighborhood Departure Board"**

Hawma treats public-space observations as local signals people can scan by place, type, and visible status. The interface borrows the discipline of a departure board: fixed columns, repeatable labels, and concise status marks, set on a lit goldenrod reading bed.

Slate and opaque ivory panes keep the report content legible against the saturated field. Vermilion marks attention and new signals; bottle green marks resolved states. The language is direct and bilingual, with a right-to-left Arabic layout. The system uses hard edges and a single text size; weight, case, rules, and reversed panels carry hierarchy.

**Key Characteristics:**
- Goldenrod ground with dark slate information plates.
- Square, ruled panes and a lightly raked report rack.
- Status expressed with words and marks, never color alone.
- One compact text size, in Barlow and Changa for Arabic.

## Colors

The palette is built for a bright, high-contrast civic reading surface, with saturated yellow as the ground and dark slate as its stable counterweight.

### Primary
- **Signal Slate** (`{colors.primary}`): Main navigation, primary actions, and reversed information plates.
- **Deep Slate** (`{colors.primary-deep}`): Hover state for dark controls.

### Secondary
- **Goldenrod Bed** (`{colors.ground}`): Full-page reading field and the visual carrier for the report rack.

### Tertiary
- **Vermilion Signal** (`{colors.signal}`): Attention marks, new-status accents, and report sequence marks.
- **Bottle Green** (`{colors.resolved}`): Resolved status and positive confirmation.
- **Board Gold** (`{colors.gold-light}`): Reversed labels and attention symbols on slate.
- **Pale Leaf** (`{colors.green-light}`): A small positive-state marker on dark plates.

### Neutral
- **Civic Ink** (`{colors.text}`): Default text and rules.
- **Acetate Ivory** (`{colors.surface}`): Report panes and form surfaces.
- **Paper Ivory** (`{colors.surface-light}`): Inputs and the brightest content surface.
- **Location Ink** (`{colors.text-muted}`): Supporting copy and secondary labels.

**The Status-Word Rule.** Every state keeps a readable text label; color and glyphs only reinforce it.

## Typography

**Display Font:** Barlow (with Arial, sans-serif fallback)  
**Body Font:** Barlow (with Arial, sans-serif fallback)  
**Arabic Font:** Changa (with Noto Sans Arabic and system sans-serif fallbacks)

**Character:** Barlow provides compact, clear Latin signage; Changa carries Arabic labels and copy. The interface holds to one 15px size and creates rank with weight, case, alignment, and panel reversal rather than a size ladder.

### Hierarchy
- **Title** (700, 15px, 1.4): Page and section headings use weight and placement rather than scale.
- **Body** (400, 15px, 1.55): Descriptions and supporting copy use generous line height.
- **Label** (700, 15px, 1.4, tracked): Navigation, statuses, category labels, and field labels use weight or uppercase treatment.

**The Single-Measure Rule.** Do not introduce display-size jumps; use weight, case, and structure to establish hierarchy.

## Layout

The desktop canvas is capped at 1600px, with outer padding that contracts from 5.2vw to 4vw below 900px. At 640px and below, the layout becomes a single column with 18px gutters; at 380px and below, gutters tighten to 12px. The intro places its action and local status plate side by side on wide screens, then stacks them on narrow screens.

The report rack uses a fixed three-part reading order—category, signal and location, status—with equal-height rows and a slight alternating rake on wide screens. Category filters and search stay above the rack; on phones they wrap into separate lines and rows become two-column, stacked signs. Arabic reverses the reading direction while keeping Latin address strings self-directed.

## Elevation & Depth

Most panes are flat and separated by borders and tonal contrast. Two short, hard-offset shadows lift the status plate and the open report form from the goldenrod bed; the effect is structural rather than ambient.

### Shadow Vocabulary
- **Status plate** (`7px 8px 0 rgba(32, 46, 42, 0.2)`): Establishes the fixed summary panel.
- **Open form** (`5px 6px 0 rgba(32, 46, 42, 0.15)`): Separates the report task from the feed.

## Shapes

The system uses square-corner panels and form controls (0px radius), thin dark rules, and rectangular reversed plates. Desktop report rows lean by a small skew to suggest a continuous rack; they settle level on hover, expansion, and mobile widths. Avoid ornamental rounded-card silhouettes.

## Components

### Buttons
- **Shape:** Square corners (0px radius).
- **Primary:** Signal Slate with Paper Ivory text; 42px high with 16px horizontal padding.
- **Hover / Focus:** Darken on hover; keyboard focus uses a visible 3px vermilion outline with a 3px offset.
- **Secondary:** Transparent surface with a thin rule; fills lightly on hover.

### Chips
- **Style:** Text-first category controls with compact square bounds and minimal framing.
- **State:** Selected filters reverse to Signal Slate with Paper Ivory text; `aria-pressed` communicates state.

### Cards / Containers
- **Corner Style:** Square, ruled panels; report rows use Acetate Ivory over the Goldenrod Bed.
- **Background:** Status and source context use Signal Slate; form uses Acetate Ivory.
- **Shadow Strategy:** Only the status plate and expanded form receive short offset shadows.
- **Border:** Thin dark rules define panes and report rows.
- **Internal Padding:** Rows use 14px horizontal padding on desktop and 11px on narrow screens.

### Inputs / Fields
- **Style:** Square controls with an opaque Paper Ivory fill and a 1px dark rule.
- **Focus:** 3px vermilion outline, offset from the control.
- **Error / Disabled:** Invalid fields switch to Vermilion Signal; busy submission controls are disabled and show a spinner.

### Navigation
- **Style:** Compact inline links in Barlow; the active destination is bold and underlined by a 3px slate rule.
- **Mobile:** Links remain inline beside the brand and language toggle.

### Report Rack
The signature component reads like a local wayfinding band: category icon and name, numbered signal with its location, then a labeled status. Each row is a keyboard-operable disclosure for its description, board-update date, provenance label, and permanent-link action. The rack remains a semantic list of community reports, not a claim of official service tracking.

### Moderation Workspace
The moderator workspace uses one reversed slate panel with ruled, compact rows instead of a nested card grid. It keeps status, visibility, and private moderator notes directly beside each report; rows collapse to a single column on phones. Access is available only with the server-side moderator token.

## Do's and Don'ts

### Do:
- **Do** preserve the goldenrod bed and slate/ivory sign contrast.
- **Do** keep city, category, and status legible at every breakpoint.
- **Do** show demo provenance and storage mode near the report surface.
- **Do** give Arabic content an RTL layout and a Changa font fallback.
- **Do** keep each report status labeled in text.

### Don't:
- **Don't** imply that the board is an official municipal channel or that a status confirms field work.
- **Don't** use color alone to convey report status.
- **Don't** add rounded card grids, oversized metrics, or a multilevel type scale.
- **Don't** leave sample content looking like verified real-world data.
