---
name: Executive Slate & Teal
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#3e4948'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#6e7978'
  outline-variant: '#bdc9c8'
  surface-tint: '#006a68'
  primary: '#005f5e'
  on-primary: '#ffffff'
  primary-container: '#007a78'
  on-primary-container: '#abfffc'
  inverse-primary: '#7ad6d3'
  secondary: '#006a61'
  on-secondary: '#ffffff'
  secondary-container: '#86f2e4'
  on-secondary-container: '#006f66'
  tertiary: '#006059'
  on-tertiary: '#ffffff'
  tertiary-container: '#177a72'
  on-tertiary-container: '#b0fff5'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#97f2ef'
  primary-fixed-dim: '#7ad6d3'
  on-primary-fixed: '#00201f'
  on-primary-fixed-variant: '#00504e'
  secondary-fixed: '#89f5e7'
  secondary-fixed-dim: '#6bd8cb'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#005049'
  tertiary-fixed: '#9cf2e8'
  tertiary-fixed-dim: '#80d5cb'
  on-tertiary-fixed: '#00201d'
  on-tertiary-fixed-variant: '#00504a'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
  canvas-bg: '#F1F5F9'
  surface-bg: '#FFFFFF'
  panel-border: '#E2E8F0'
  text-primary: '#0F172A'
  text-secondary: '#334155'
  text-muted: '#64748B'
  accent-teal-subtle: '#E6F4F1'
  status-warning-bg: '#FEF3C7'
  status-warning-text: '#D97706'
  status-success-bg: '#DEF7EC'
  status-success-text: '#03543F'
  status-info-bg: '#EFF6FF'
  status-info-text: '#1D4ED8'
typography:
  display-lg:
    fontFamily: Noto Sans
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Noto Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 30px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Noto Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  title-sm:
    fontFamily: Noto Sans
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Noto Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Noto Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: -0.005em
  body-sm:
    fontFamily: Noto Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 19px
    letterSpacing: 0em
  label-md:
    fontFamily: Noto Sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: -0.005em
  label-sm:
    fontFamily: Noto Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-compact: 0.75rem
  margin: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style
The design system establishes a high-trust, focused, and systematic enterprise B2B environment tailored for corporate document generation and AI-assisted workflows. It targets enterprise operations specialists, business development managers, and executive administrative teams who require deterministic accuracy, institutional rigor, and friction-free editing. 

The aesthetic is anchored in **Corporate / Modern** precision infused with tactile clarity:
- **Calm & Grounded Tone:** Built on structured slate neutrals and clean white surfaces to reduce cognitive fatigue during multi-step verification and document authoring.
- **Intentional AI Presence:** AI interactions are never flashy or novelty-driven; they act as an authoritative editorial co-pilot represented through deep teal accents, controlled diff previews, and transparent source grounding.
- **Confidence & Determinism:** Visual weight emphasizes validation states, source references, and explicit confirmation checkpoints before final asset generation.

## Colors
The palette balances structural enterprise neutrals with decisive teal chromatics:
- **Primary (`#007A78`) & Secondary (`#0D9488`):** Deep teal anchors primary CTAs, active stepper milestones, focused block borders, and approved state indicators. The color conveys institutional confidence without the harshness of generic cobalt blues.
- **Canvas & Surface Tiering:** The global viewport backdrop utilizes a cool slate wash (`#F1F5F9`), allowing core functional panels and document canvas sheets (`#FFFFFF`) to stand out crisp and elevated with hair-line boundary borders (`#E2E8F0`).
- **Semantic Feedback Tokens:**
  - **Success (`#DEF7EC` / `#03543F`):** Indicates verified sources, ready-to-export documents, and confirmed steps.
  - **Warning / Review Required (`#FEF3C7` / `#D97706`):** Highlights missing citations, incomplete OCR parsing, or unsupported claim statistics.
  - **Informational / Session (`#E6F4F1` / `#0F766E`):** Distinctly marks temporary session-only uploads and AI-generated suggestion diffs.
- **Contrast & Legibility:** Charcoal body text (`#0F172A` and `#334155`) guarantees high contrast ratios exceeding WCAG AAA standards for long-form reading and editing.

## Typography
Typography is optimized for Korean CJK typography and dense enterprise documentation:
- **Font Stack:** Standardized on `Noto Sans` (with system fallbacks `Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`) to ensure balanced visual weight and clean alignment across Hangul syllable blocks, Latin alphanumeric codes, and technical symbols.
- **Rhythm & Line Height:** Line heights are maintained generously (150%–160% on body text) to eliminate visual clutter when parsing long legal, chemical, or operational statements.
- **Micro-Typography:** Strict tracking adjustments (`-0.01em` to `-0.02em` on headings) resolve the visual looseness inherent in standard Korean digital fonts, delivering a cohesive corporate finish.

## Layout & Spacing
The layout system is tailored for wide desktop enterprise displays, centered on a maximum container width of **1600px** with secondary optimization for **1440px**:
- **Application Shell Architecture:**
  - **Fixed Global Header (56px):** Persistent top header housing product identity, status badges, and project context.
  - **Fixed 3-Step Wizard Navigation:** Visual stepper locked below the header, providing clear forward progress and safe step-back interaction.
  - **Persistent Bottom Action Dock (64px):** Locks primary action gates ("초안 만들기", "승인·출력으로", "승인하고 PDF 만들기") to prevent UI jumps as content panes scroll.
- **Tri-Column Workbench:**
  - **Left Rail (260px - 280px):** Configuration selectors or page outline index.
  - **Center Stage (Flexible / Min 680px):** Source selection workspace or 1:1 page editing canvas sheet.
  - **Right Inspector (340px - 380px):** Validation checklist, contextual preflight results, or collapsible AI assistant sidecar.
- **Viewport Adaptability:** Below 1280px, the right AI sidecar and inspection panel fold into an overlay drawer, and the page navigation panel collapses to icon-rail mode to preserve document canvas legibility.

## Elevation & Depth
Visual hierarchy relies primarily on **tonal contrast, border delineation, and soft ambient drop shadows**:
- **Base Canvas:** Flat slate background (`#F1F5F9`) serves as depth ground `z-0`.
- **Card and Work Panels:** Pure white surfaces (`#FFFFFF`) with `1px solid #E2E8F0` borders and an ambient diffuse shadow (`0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02)`).
- **Interactive Focus & Active Selections:** Selected source rows and active document blocks omit heavy drop shadows in favor of a crisp `2px solid #007A78` perimeter stroke and a subtle teal background tint (`#F8FDFA`), instantly grounding the active node.
- **Floating Modals & Toolbars:** Block context formatting bars and approval dialogs utilize high-elevation diffuse shadows (`0 10px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.06)`) with full opacity surfaces.

## Shapes
The design adopts a balanced **Rounded (`level 2`)** geometry to balance enterprise precision with modern accessibility:
- **Base Radius (8px / `0.5rem`):** Applied uniformly to inputs, list item containers, action buttons, and segmented controls.
- **Large Panels & Dialogs (12px to 16px / `0.75rem` to `1rem`):** Outer workbench cards, editor sheet wrappers, and validation review boxes.
- **Micro Pills & Badges (9999px):** Status chips, step indicator badges, and file count pill indicators maintain fully rounded ends for immediate semantic separation from functional cards.

## Components

### Primary & Secondary Buttons
- **Primary Action:** Solid `#007A78` background, `#FFFFFF` text, 8px radius, 10px 20px padding. Hover state shifts to `#0F766E` with active depression of 1px.
- **Secondary Action:** `#FFFFFF` background with `1px solid #E2E8F0` border, `#0F172A` text. Hover state introduces `#F8FAFC` background and `#CBD5E1` border.
- **Disabled State:** Solid `#F1F5F9` background, `#94A3B8` text, non-interactive cursor, accompanied by explicit helper text or tooltip detailing the required prerequisite.

### Step Navigation Bar
- Horizontal three-node track encased in a rounded capsule.
- Active milestone features a solid `#007A78` circular numeric badge with bold teal typography against an `#E6F4F1` background tint.
- Incomplete milestones use muted slate badges (`#E2E8F0` fill with `#64748B` numerals).
- Connected by subtle horizontal chevrons (`#94A3B8`).

### Data Source & File Cards
- Surface: `#FFFFFF` card bounded by `1px solid #E2E8F0`.
- Includes a dedicated file format icon badge (PPTX, TXT, PDF in muted navy/blue tones), filename in `headline-md`, metadata details, and explicit status pill ("읽기 완료", "일부 읽기").
- Checked state features a distinct `1.5px solid #007A78` outer border and highlighted checkbox.

### Status Badges & Pills
- **Success / Verified:** `#DEF7EC` background, `#03543F` text, accompanied by a checkmark icon.
- **Review / Warning:** `#FEF3C7` background, `#D97706` text, accompanied by an alert icon.
- **Session-Only Tag:** Pill format with `#EFF6FF` background and `#1D4ED8` text to signify temporary storage boundaries.

### AI Assistance Drawer / Card
- Dedicated editor panel framed with a subtle teal accent bar (`#0D9488`).
- Clearly separates original prompt input, "기존 문구" (neutral gray container), and "제안 문구" (`#F0FDFA` teal container with `#0F766E` text).
- Includes deterministic control buttons: "이 문구 적용" (primary teal CTA), "다시 요청" (ghost button), and "닫기".

### Form Controls & Selection Grids
- **Segmented Radio Tiles (e.g., Page count selection: 1, 4, 6, 8, 10):** White square tiles with neutral border; selected state fills solid `#007A78` with pure white bold text.
- **Dropdown & Input Fields:** High-contrast borders (`#CBD5E1`), 8px border-radius, `#0F172A` values with 14px typography and 8px internal padding. Focus triggers `#007A78` outer ring (2px alpha glow).