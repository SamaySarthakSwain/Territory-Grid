# Phase 5: Master Project Prompt Templates

Copy and adapt these complete initial prompts to have Antigravity orchestrate all your connected tools together from the very first message.

---

## Template 1: Full-Stack Web Application (SaaS / Dashboard)
**Connectors Used**: Notion + Linear + Figma + Context7 + Supabase + Spacefast

```text
I want to build a modern full-stack web application called "[Project Name]" ([Brief Description, e.g. An AI-powered collaborative task manager]).

Please orchestrate this using my connected tools:

1. [PLANNING & REQUIREMENTS]:
   - Fetch the product specs from my Notion workspace (Page: "[Page Title or URL]").
   - Break down the implementation into 4 milestones in Linear (Team: "[Team Key]"), creating prioritized issues for each phase.

2. [DESIGN & UI]:
   - Inspect my Figma design file ([Figma Link]) for color tokens, typography hierarchy, and spacing.
   - Build the frontend in React 18 + Vite + TypeScript with Tailwind CSS.
   - Use Context7 to reference the latest documentation for Radix UI, Lucide React, and TanStack Query.

3. [DATABASE & BACKEND]:
   - Connect to my Supabase project.
   - Create tables with foreign key relations for [Entities, e.g. Users, Workspaces, Projects, Tasks].
   - Apply Row Level Security (RLS) policies so authenticated users only read/write data belonging to their team.
   - Generate TypeScript definitions from the schema into `src/types/supabase.ts`.

4. [DEPLOYMENT]:
   - Configure the production build script and deploy a live preview using Spacefast.
   - Return the live URL and summary of completed Linear issues.

Please start by summarizing the execution plan before writing code.
```

---

## Template 2: Mobile / Web App with MongoDB Atlas & Canva
**Connectors Used**: Notion + Mobbin + Canva + Context7 + MongoDB Atlas + DevTools

```text
Let's build a new application called "[Project Name]" ([e.g. E-Commerce Marketplace with Recommendations]).

Please coordinate our tools as follows:

1. [UX & INSPIRATION]:
   - Search Mobbin for top-performing mobile-friendly ecommerce checkout and product detail screen flows.
   - Adopt the cleanest 3-step checkout pattern.

2. [BRANDING & ASSETS]:
   - Check my Canva brand kit for primary branding guidelines.
   - Generate an app logo and an OpenGraph preview banner (1200x630) using Canva and place them in `public/assets/`.

3. [DATABASE ARCHITECTURE]:
   - In MongoDB Atlas, design collections for `products`, `orders`, and `reviews`.
   - Create compound indexes on `{ category: 1, rating: -1 }` and text indexes on `{ title: "text", description: "text" }`.
   - Scaffold the corresponding TypeScript models using Mongoose.

4. [QUALITY & AUDIT]:
   - Run Chrome DevTools accessibility audits across all pages to ensure WCAG AA compliance.
   - Document the API endpoints in a new page on my Notion workspace.
```

---

## Template 3: Rapid Prototyping & AI App
**Connectors Used**: Context7 + Supabase / Firebase + Spacefast + Linear

```text
Build a working prototype for "[Project Name]" ([e.g. AI Document Summarizer & Q&A Assistant]).

1. Use Context7 to look up current documentation for streaming AI completions and markdown rendering.
2. Store document metadata, conversation history, and user settings in Supabase with RLS enabled.
3. Track remaining roadmap items and future feature tickets in Linear.
4. Deploy the live prototype to Spacefast and verify that real-time streaming works in the browser.
```
