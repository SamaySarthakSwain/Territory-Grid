# Antigravity Connected Tools & Plugins Guide

This directory contains instructions, trigger prompts, and workflows for every connected tool, plugin, and MCP server in your Antigravity environment.

---

## 🧭 Connected Tools Map

| Category | Tools / Services | Key Capabilities |
| :--- | :--- | :--- |
| **Design & UI** | [Figma](./01_DESIGN_AND_MEDIA.md#1-figma), [Canva](./01_DESIGN_AND_MEDIA.md#2-canva), [Mobbin](./01_DESIGN_AND_MEDIA.md#3-mobbin) | UI design tokens, component generation, brand assets, real-world UX flow references |
| **Backend & Databases** | [Supabase](./02_DATABASE_AND_BACKEND.md#1-supabase), [MongoDB Atlas](./02_DATABASE_AND_BACKEND.md#2-mongodb-atlas), [Firebase](./02_DATABASE_AND_BACKEND.md#3-firebase) | Database schema migrations, RLS security rules, TypeScript types, collections, serverless APIs |
| **Productivity & Tracking** | [Linear](./03_PLANNING_AND_TRACKING.md#1-linear), [Notion](./03_PROJECT_MANAGEMENT.md#2-notion) | Issue tracking, sprint milestones, PRD specs, project wikis, status reports |
| **Docs & Cloud Deploy** | [Context7](./04_DOCS_AND_DEPLOYMENT.md#1-context7), [Spacefast & Vercel](./04_DOCS_AND_DEPLOYMENT.md#2-spacefast--vercel-deployment), [DevTools](./04_DOCS_AND_DEPLOYMENT.md#3-chrome-devtools--accessibility) | Up-to-date framework documentation, one-click hosting, custom domains, a11y audits |
| **Ready-to-Use Prompts** | [Master Templates](./05_MASTER_PROMPTS.md) | Copy-pasteable starter prompts orchestrating all connectors together |

---

## ⚡ How Antigravity Uses Connected Tools

You do not need to call CLI commands or APIs directly. Antigravity monitors your natural language prompt and activates tools automatically when:
1. **You mention the service name** (e.g. *"Check my Notion workspace"*, *"Deploy to Spacefast"*).
2. **You provide an external resource identifier** (e.g. a Figma URL, Linear team name, or Supabase project).
3. **The task naturally requires it** (e.g. fetching up-to-date library syntax triggers Context7; checking UI accessibility triggers DevTools).

---

## 🚀 Quick Start: Using All Connectors in One Prompt

When starting any new project in Antigravity, use the standard **5-Phase Pipeline**:

```text
Create a new project named "<Project-Name>":
1. [SPEC]: Read my project spec from Notion page "<Page Name>" and create issues in Linear team "<Team>".
2. [DESIGN]: Match the typography, colors, and layout from Figma file "<URL>" (or reference Mobbin flows for inspiration).
3. [DOCS]: Use Context7 to check latest docs for our selected libraries.
4. [DATABASE]: Set up schema, tables, and RLS in Supabase (or MongoDB Atlas), and export TypeScript types.
5. [DEPLOY]: Configure the build and deploy a live preview to Spacefast.
```

See [05_MASTER_PROMPTS.md](./05_MASTER_PROMPTS.md) for full project templates.
