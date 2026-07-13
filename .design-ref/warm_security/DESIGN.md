---
name: Warm Security
colors:
  surface: '#f7faf7'
  surface-dim: '#d7dbd8'
  surface-bright: '#f7faf7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f4f2'
  surface-container: '#ebefec'
  surface-container-high: '#e6e9e6'
  surface-container-highest: '#e0e3e1'
  on-surface: '#181c1b'
  on-surface-variant: '#3f4946'
  inverse-surface: '#2d3130'
  inverse-on-surface: '#eef1ef'
  outline: '#6f7976'
  outline-variant: '#bec9c5'
  surface-tint: '#0e6a5b'
  primary: '#005145'
  on-primary: '#ffffff'
  primary-container: '#0f6b5c'
  on-primary-container: '#99e8d5'
  inverse-primary: '#86d5c3'
  secondary: '#835400'
  on-secondary: '#ffffff'
  secondary-container: '#feb64e'
  on-secondary-container: '#714800'
  tertiary: '#723525'
  on-tertiary: '#ffffff'
  tertiary-container: '#8f4c3a'
  on-tertiary-container: '#ffcec1'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a2f2de'
  primary-fixed-dim: '#86d5c3'
  on-primary-fixed: '#00201a'
  on-primary-fixed-variant: '#005144'
  secondary-fixed: '#ffddb5'
  secondary-fixed-dim: '#ffb956'
  on-secondary-fixed: '#2a1800'
  on-secondary-fixed-variant: '#643f00'
  tertiary-fixed: '#ffdbd1'
  tertiary-fixed-dim: '#ffb5a1'
  on-tertiary-fixed: '#3a0b02'
  on-tertiary-fixed-variant: '#723525'
  background: '#f7faf7'
  on-background: '#181c1b'
  surface-variant: '#e0e3e1'
typography:
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  container-margin: 20px
  gutter: 16px
---

## Brand & Style

The design system is built on the concept of "Guided Stability." It targets Overseas Filipino Workers (OFWs) who require a bridge between high-technology blockchain efficiency and the emotional warmth of home. The brand personality is deeply rooted in reliability, calm, and family-centric values, avoiding the aggressive or overly technical aesthetics often associated with crypto-wallets.

The chosen style is **Modern-Tactile**. It utilizes a clean, professional foundation inspired by modern banking but softens the experience through organic shapes, warm color temperatures, and generous whitespace. Every interaction is designed to feel secure yet approachable, reducing the cognitive load of cross-border financial transactions.

## Colors

The palette is anchored in **Deep Teal**, a color that communicates institutional trust and sophisticated stability. **Warm Amber** serves as the primary accent, used sparingly to highlight key financial values and call-to-action buttons, evoking a sense of sunshine and optimism.

The background uses a **Warm Off-White** to reduce eye strain and move away from the sterile "cold white" of traditional tech apps. Status-driven colors are intentionally muted; **Sage Green** indicates a healthy, unlocked, or successful state, while **Muted Terracotta** signals a locked state or areas requiring attention, maintaining the warm, earthy feel of the overall system without inducing panic.

## Typography

The design system exclusively uses **Manrope**, a modern humanist sans-serif. Its geometric yet slightly rounded terminals provide the perfect balance between professional structure and approachable warmth. 

Typography is organized to prioritize clarity of financial figures. Headlines use a tighter letter-spacing and heavier weights to establish a strong hierarchy, while body text maintains a generous line height to ensure readability for users who may be navigating the app in high-stress environments or on the go. High-value numbers (remittance amounts) should always be rendered in `headline-lg` or `headline-md` using the primary Charcoal color to ensure maximum legibility.

## Layout & Spacing

This design system employs a **Fixed-Fluid hybrid grid**. On desktop, content is contained within a 12-column grid (max-width 1200px) centered on the page. On mobile, it transitions to a single-column fluid layout with 20px side margins.

Spacing follows an 8px base unit. Generous padding within cards (`lg` or 24px) is encouraged to create a "breathable" interface that feels calm. Grouped elements, such as input fields and their labels, use `xs` (4px) or `base` (8px) spacing to maintain clear visual association. Sections within a page should be separated by `xl` (32px) to prevent the UI from feeling cluttered.

## Elevation & Depth

Hierarchy is established using **Tonal Layering** combined with soft, ambient shadows. The background sits at the lowest level. 

1. **Surface Level (Cards):** These use the white surface color with a very soft, diffused shadow (15% opacity of the Deep Teal mixed with Gray) to appear slightly lifted. 
2. **Interactive Level (Buttons/Inputs):** Active elements have a slightly crisper shadow or a subtle 1px border in `Light Warm Gray` to define their boundaries without looking harsh.
3. **Overlay Level (Modals/Drawers):** These use a backdrop blur (glassmorphism) of the background color with a 70% opacity, ensuring the user remains aware of their context while focusing on the task at hand.

Avoid harsh black shadows; all shadows should be tinted with a hint of the Primary Deep Teal to maintain color harmony.

## Shapes

The shape language is defined by "Friendly Precision." 

- **Primary Radius:** 0.5rem (8px) for standard components like buttons and small input fields.
- **Large Radius (Lg):** 1rem (16px) for main containers and transaction cards. 
- **Extra Large (Xl):** 1.5rem (24px) for prominent feature banners or bottom sheets on mobile.

The consistent use of rounded corners removes the "sharp edges" of traditional finance, making the technology feel more like a personal service and less like an impersonal machine.

## Components

### Buttons
- **Primary:** Solid Deep Teal background with White text. High-emphasis actions.
- **Secondary:** Solid Warm Amber with Charcoal text. Used for "Key Value" actions or secondary CTAs.
- **Ghost:** Transparent background with Deep Teal border and text. Used for "Cancel" or "Back" actions.

### Cards & Lists
- Cards should feature 16px padding and 16px corner radius. 
- List items within cards should be separated by a 1px `Light Warm Gray` divider.
- Clickable list items should have a subtle hover state using a 2% opacity tint of the Primary color.

### Status Pills
- **Unlocked/Success:** Sage Green background (low opacity) with Sage Green text.
- **Locked/Attention:** Muted Terracotta background (low opacity) with Muted Terracotta text.
- Pills are fully rounded (pill-shaped) with `label-sm` typography.

### Input Fields
- Background is White with a 1px `Light Warm Gray` border.
- On focus, the border transitions to 2px Deep Teal with a soft glow shadow.
- Validation states: Terracotta for errors, Sage Green for success. Labels should always sit above the input field in `label-md` Charcoal.

### Progress Indicators
- For multi-step remittances, use a stepped progress bar in Deep Teal. Completed steps should feature a Sage Green checkmark icon.