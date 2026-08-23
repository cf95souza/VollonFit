---
name: VollonFit Kinetic
colors:
  surface: '#101417'
  surface-dim: '#101417'
  surface-bright: '#36393e'
  surface-container-lowest: '#0b0f12'
  surface-container-low: '#181c20'
  surface-container: '#1c2024'
  surface-container-high: '#272a2e'
  surface-container-highest: '#323539'
  on-surface: '#e0e2e8'
  on-surface-variant: '#c4c9ac'
  inverse-surface: '#e0e2e8'
  inverse-on-surface: '#2d3135'
  outline: '#8e9379'
  outline-variant: '#444933'
  surface-tint: '#abd600'
  primary: '#ffffff'
  on-primary: '#283500'
  primary-container: '#c3f400'
  on-primary-container: '#556d00'
  inverse-primary: '#506600'
  secondary: '#c6c6ca'
  on-secondary: '#2f3034'
  secondary-container: '#4a4b4f'
  on-secondary-container: '#bbbbbf'
  tertiary: '#ffffff'
  on-tertiary: '#00363a'
  tertiary-container: '#7df4ff'
  on-tertiary-container: '#006f77'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#c3f400'
  primary-fixed-dim: '#abd600'
  on-primary-fixed: '#161e00'
  on-primary-fixed-variant: '#3c4d00'
  secondary-fixed: '#e2e2e6'
  secondary-fixed-dim: '#c6c6ca'
  on-secondary-fixed: '#1a1c1f'
  on-secondary-fixed-variant: '#45474a'
  tertiary-fixed: '#7df4ff'
  tertiary-fixed-dim: '#00dbe9'
  on-tertiary-fixed: '#002022'
  on-tertiary-fixed-variant: '#004f54'
  background: '#101417'
  on-background: '#e0e2e8'
  surface-variant: '#323539'
typography:
  display-xl:
    fontFamily: Montserrat
    fontSize: 64px
    fontWeight: '900'
    lineHeight: 72px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '800'
    lineHeight: 32px
  headline-md:
    fontFamily: Montserrat
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  data-display:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-caps:
    fontFamily: Montserrat
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.1em
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
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 16px
  container-max: 1280px
---

## Brand & Style
The design system embodies "High-Performance Kineticism." It is built for a fitness SaaS that demands both the precision of a professional athlete and the adrenaline of a gaming platform. The brand personality is aggressive, professional, and uncompromising.

The aesthetic follows a **Modern-Glassmorphic** approach with a **Dark-First** foundation. It leverages high-contrast accents against deep, structural backgrounds to drive focus toward performance metrics. Visual elements should feel fast—using leaning angles, vibrant glows, and blurred depth to simulate motion and progress.

## Colors
The palette is anchored by **Electric Lime (#CCFF00)**, used exclusively for primary actions, progress completion, and critical brand moments. This high-frequency hue ensures the UI feels "active" even when static.

The core interface uses a tiered Dark Mode system. The background is a true **Deep Charcoal (#121417)**, while interactive surfaces utilize slightly lighter Slate tones to create a sense of hierarchy. **Neon Blue (#00F0FF)** acts as a functional accent specifically for "Squads," community interactions, and gamified achievement layers, distinguishing social features from individual performance data. 

For the B2B portal, the system flips to a "High-Clean" light mode where white surfaces replace charcoal, but the Electric Lime remains the primary focal point to maintain brand energy.

## Typography
The typography strategy creates a clear distinction between "Energy" and "Information." 

**Montserrat** is the voice of the brand, used for all headers and displays. It should be used in heavy weights (ExtraBold/Black) with tight letter spacing to evoke a sense of strength and urgency.

**Inter** provides a neutral, highly legible foundation for workout logs, descriptions, and dashboard content.

**JetBrains Mono** is introduced as a functional "Data" font. It is used specifically for technical metrics—1RM (One Rep Max), heart rate intervals, volume totals, and countdown timers. This monospaced quality ensures that numbers do not shift during live tracking, providing a "precision instrument" feel to the performance dashboards.

## Layout & Spacing
The design system utilizes an **8px grid system** for consistent rhythm. 

For the mobile PWA (Athlete view), the layout is **Fluid**, utilizing 16px side margins to maximize screen real estate for charts and lists. For the B2B Dashboard (Coach view), the layout transitions to a **Fixed Grid** with a 12-column structure and 24px gutters to handle complex data density.

Spacing should be generous between major sections (`lg` or `xl`) to prevent the high-energy colors from feeling cluttered, but tight within component groups (`xs` or `sm`) to maintain a "packed" and efficient data aesthetic.

## Elevation & Depth
Depth is created through **Tonal Layering** and **Glassmorphism**, rather than traditional shadows.

1.  **Base Layer:** Deep Charcoal background.
2.  **Surface Layer:** Slate containers with subtle 1px inner borders (opacity 10% white) to define edges.
3.  **Active Layer (Glass):** For PWA cards and overlays, use a background blur (12px to 20px) with a 40% opaque dark fill. This keeps the user connected to the background workout context while focusing on the current task.
4.  **Accent Glows:** Use low-opacity outer glows (color-matched to Electric Lime or Neon Blue) for active progress rings and "in-session" indicators to simulate a powered-on state.

## Shapes
The shape language is "Aggressive-Soft." Standard components use a **0.5rem (8px)** radius to feel modern and professional. 

Interactive elements like CTAs and badges utilize the **Pill-shaped (rounded-xl)** style to provide a "gamified" feel that contrasts against the structured, rectangular grid of the data dashboards. Progress bars must have fully rounded end-caps to communicate fluid movement.

## Components
- **Buttons:** Primary buttons use the Electric Lime background with Black text (Montserrat Bold). Secondary buttons use a transparent background with a 2px Electric Lime border. All buttons should have a subtle "lift" effect on hover using a lime-colored outer glow.
- **Cards:** Use the glassmorphism style for workout cards. Include a "live" indicator (Neon Blue pulse) for active squads.
- **Data Visualizations:** Progress rings should use a thick stroke (8px+) with rounded caps. The track should be the secondary slate color, and the progress should be the primary Electric Lime.
- **Input Fields:** Use a dark-filled style with a focus state that changes the bottom border to Electric Lime. Use JetBrains Mono for numeric inputs.
- **Squad Feed:** Social elements should use "Avatar Rings" that glow Neon Blue when a user is "In-Gym" or "Live." 
- **Badges:** Performance badges should use metallic gradients (Gold, Silver, Bronze) but maintain the geometric, bold style of the typography system.
- **Leaderboards:** Use high-contrast alternating row colors (Surface Mixed) with JetBrains Mono for the rank numbers to ensure they stand out.