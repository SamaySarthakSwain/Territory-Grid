# Phase 4: Live Docs, Quality & Cloud Deployment

This guide explains how to trigger and use **Context7**, **Spacefast**, **Vercel**, and **Chrome DevTools** in your Antigravity project prompts.

---

## 1. Context7 (`context7_context7`)

Context7 queries official, up-to-date documentation and code examples for modern developer libraries, APIs, and frameworks. This prevents the agent from using deprecated syntax or obsolete patterns.

### What It Can Do
* **Real-time Documentation Lookup**: Pulls latest APIs for Next.js (App Router, Server Actions), React 19, Tailwind CSS v4, Vite, Prisma, TanStack Query, Radix UI, Lucide, and more.
* **Exact Code Snippets**: Provides working boilerplate based on the vendor's official guides.

### How to Prompt Antigravity
* **Modern Framework Conventions**:
  > *"Use Context7 to look up the official Next.js App Router guidelines for parallel routes and streaming before writing our layout."*
* **Third-Party Library Syntax**:
  > *"Query Context7 for the latest TanStack Query v5 syntax for optimistic UI updates."*
* **State Management & UI Kits**:
  > *"Check Context7 for Radix UI dialog accessibility attributes and write fully compliant modal components."*

---

## 2. Spacefast & Vercel (`spacefast_spacefast`, `vercel-plugin`)

Spacefast and Vercel handle automated builds, continuous deployment, custom domain routing, and production hosting.

### What It Can Do
* **Instant Deployment**: Packages your build and uploads it to an active hosting environment.
* **Live Previews**: Generates temporary preview URLs for testing before going live.
* **Custom Domain Management**: Configures custom domains, SSL certificates, and DNS records.
* **Environment Variables**: Ingests and verifies required production `.env` keys.

### How to Prompt Antigravity
* **One-Click Deploy**:
  > *"Build the frontend and deploy it to a new Spacefast site. Share the live preview URL."*
* **Custom Domain Connection**:
  > *"Configure my custom domain `app.mycompany.com` on Spacefast and verify the DNS records."*
* **Production Build Verification**:
  > *"Run the preflight build checks and ensure all environment variables are properly wired for production."*

---

## 3. Chrome DevTools & Accessibility (`a11y-debugging`, `memory-leak-debugging`)

The Chrome DevTools integration allows Antigravity to run live accessibility, performance, and DOM inspection audits against your web app.

### What It Can Do
* **A11y (WCAG) Compliance Audits**: Verifies contrast ratios, ARIA tags, semantic HTML hierarchy, and keyboard focus traps.
* **Performance & Memory Profiling**: Detects layout shifts, memory leaks, and oversized image assets.

### How to Prompt Antigravity
* **Accessibility Audit**:
  > *"Audit our web app's landing page using DevTools for WCAG AA compliance and fix any missing labels, button contrasts, or tab indices."*
* **Rendering & Performance**:
  > *"Check the Core Web Vitals and LCP (Largest Contentful Paint) of our dashboard layout and optimize asset loading."*
