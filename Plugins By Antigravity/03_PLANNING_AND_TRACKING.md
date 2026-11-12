# Phase 3: Planning, Issue Tracking & Documentation

This guide explains how to trigger and use **Linear** and **Notion** in your Antigravity project prompts.

---

## 1. Linear (`linear_linear`)

Linear is a developer-centric project management tool. Antigravity can break requirements into issues, organize sprints/cycles, and update issue states as coding milestones are completed.

### What It Can Do
* **Issue Creation**: Automatically breaks down large PRDs or features into tracked user stories and tasks with priorities (`Urgent`, `High`, `Medium`, `Low`).
* **Milestones & Projects**: Groups tasks into roadmaps and cycles.
* **Status Updates**: Transitions tickets from `Todo` $\rightarrow$ `In Progress` $\rightarrow$ `Done` when implementations finish.

### How to Prompt Antigravity
* **Scaffolding an Entire Backlog**:
  > *"Break down our project requirements into 5 key epics and create corresponding issues in my Linear workspace under team 'DEV'."*
* **Sprint / Milestone Planning**:
  > *"Create a Linear milestone called 'MVP Launch' and assign the core authentication and database tasks to it."*
* **Progress Syncing**:
  > *"Mark the Linear issue 'Setup Supabase migrations' as Done and add a comment summarizing the schema changes made."*

---

## 2. Notion (`notion_notion`)

Notion serves as the knowledge base, product specification center, and technical wiki.

### What It Can Do
* **Reading Specifications**: Ingests user-written PRDs, design briefs, database designs, or meeting notes directly into Antigravity context.
* **Creating Project Documentation**: Exports completed API documentation, architectural decision records (ADRs), and setup instructions into a Notion page.
* **Database Tracking**: Creates or updates Notion databases for tracking bugs, feedback, or release notes.

### How to Prompt Antigravity
* **Fetching Initial Requirements**:
  > *"Search my Notion workspace for the page titled 'Product Requirements Doc' and use it as the source of truth for building this app."*
* **Generating Architecture Documentation**:
  > *"Create a new page in my Notion workspace titled '<Project Name> Technical Docs' and write a full breakdown of the folder structure, API endpoints, and environment variables."*
* **Creating a Meeting / Decision Summary**:
  > *"Document the architectural decisions we made for database selection into our Notion Engineering Wiki."*
