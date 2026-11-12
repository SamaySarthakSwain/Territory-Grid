# Phase 1: Design, Media & UI Reference

This guide explains how to trigger and use **Figma**, **Canva**, and **Mobbin** in your Antigravity project prompts.

---

## 1. Figma (`figma_figma`)

Antigravity connects directly to your Figma workspaces to inspect designs, extract design tokens, generate matching React/Tailwind components, and create diagrams.

### What It Can Do
* **Inspect Frames & Components**: Reads layout hierarchies, padding, fonts, hex colors, border-radii, and shadows.
* **Code Connect**: Automatically translates Figma component properties into React props and Tailwind classes.
* **Generate Design Files & Diagrams**: Can create new design drafts, FigJam flows, or architecture diagrams directly in Figma.

### How to Prompt Antigravity
* **Direct File Link**: 
  > *"Inspect this Figma frame: `https://www.figma.com/design/...` and convert the hero section into a responsive React component with Tailwind CSS."*
* **Design Token Extraction**:
  > *"Read the color styles and typography from my connected Figma file and write them into `tailwind.config.ts`."*
* **Diagram Creation**:
  > *"Create a system architecture flow diagram in a new FigJam file explaining our auth and database pipeline."*

---

## 2. Canva (`canva_canva`)

Use Canva to generate promotional imagery, social cards, logos, and presentation decks for your application.

### What It Can Do
* **Asset & Logo Generation**: Creates logos, avatars, and hero graphics according to your brand colors.
* **Brand Kits**: Accesses saved brand palettes, typography, and logo assets.
* **Design Templates**: Instantiates banners, presentation templates, and OG (Open Graph) social preview cards.
* **Exporting**: Downloads assets directly to your project's `public/assets/` folder.

### How to Prompt Antigravity
* **Logo & Favicon**:
  > *"Generate a modern SVG/PNG logo for '<Project Name>' using Canva and save it to `public/logo.png`."*
* **Social Preview Cards**:
  > *"Create a 1200x630 Open Graph banner design in Canva featuring our app title and tag line, and link it in `index.html`."*
* **Brand Kit Alignment**:
  > *"List my Canva brand kits and use our primary brand palette for the landing page theme."*

---

## 3. Mobbin (`mobbin_mobbin`)

Mobbin provides real-world UI/UX inspiration and design flow patterns from top iOS, Android, and Web applications.

### What It Can Do
* **Screen & Flow Search**: Finds real production examples of onboarding, checkout, dashboard, settings, or search interfaces.
* **UX Best Practices**: Analyzes how apps like Airbnb, Spotify, Linear, or Stripe lay out specific user journeys.

### How to Prompt Antigravity
* **Onboarding & Sign-Up UX**:
  > *"Search Mobbin for modern SaaS user onboarding flows. Recommend the best 3-step pattern and scaffold the React components accordingly."*
* **Dashboard Layouts**:
  > *"Search Mobbin for analytics dashboard screen references with dark mode support, and implement a similar card grid."*
* **Checkout & Pricing**:
  > *"Look up subscription pricing table flows on Mobbin and create a high-converting pricing page with monthly/yearly toggles."*
