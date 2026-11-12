# Phase 2: Backend, Databases & Auth

This guide explains how to trigger and use **Supabase**, **MongoDB Atlas**, and **Firebase** in your Antigravity project prompts.

---

## 1. Supabase (`supabase_mcp`)

Supabase provides Postgres database hosting, authentication, storage, and edge functions. Antigravity can directly administer your Supabase project.

### What It Can Do
* **Database Migrations & SQL**: Executes DDL scripts, creates tables, indexes, relations, and foreign keys.
* **Row Level Security (RLS)**: Generates and applies declarative RLS security policies so data is locked down per user.
* **TypeScript Types**: Generates end-to-end type definitions (`types/supabase.ts`) directly from your live schema.
* **Edge Functions**: Scaffolds and deploys serverless Deno/TypeScript edge functions.

### How to Prompt Antigravity
* **Full Schema Setup**:
  > *"Connect to my Supabase project and create tables for `users`, `teams`, `projects`, and `tasks`. Enable RLS on all tables and allow users to read/write only their own records."*
* **Exporting Types**:
  > *"Generate TypeScript database definitions from my live Supabase schema and save them to `src/types/database.types.ts`."*
* **Querying / Inspection**:
  > *"Inspect the existing tables in my Supabase database and list their column types and active migrations."*

---

## 2. MongoDB Atlas (`mongodb-atlas`)

MongoDB Atlas provides fully managed NoSQL document databases, aggregation pipelines, and search indexes.

### What It Can Do
* **Cluster Inspection**: Inspects existing clusters, databases, and collections.
* **Collection Creation & Indexing**: Creates collections and defines single-field, compound, and text indexes.
* **Aggregation Pipelines & Queries**: Writes and tests MongoDB aggregation stages (`$match`, `$group`, `$lookup`, `$unwind`).
* **Schema Validation**: Configures JSON schema validation rules on collections.

### How to Prompt Antigravity
* **Collection Provisioning**:
  > *"In my MongoDB Atlas database, create a `products` collection with schema validation for title, price, category, and inventory count."*
* **Index Optimization**:
  > *"Create compound indexes on `{ organizationId: 1, createdAt: -1 }` to optimize queries for our dashboard timeline."*
* **Mongoose / Driver Integration**:
  > *"Scaffold Mongoose schema models in `src/models/` matching our MongoDB Atlas database structure."*

---

## 3. Firebase (`firebase-firestore`, `firebase-auth-basics`)

Firebase provides managed serverless backends, Firestore NoSQL storage, Authentication, and Cloud Functions.

### What It Can Do
* **Security Rules Authoring**: Creates strict `firestore.rules` and `storage.rules`.
* **Auth Setup**: Sets up Google, Email/Password, or OAuth login flows.
* **Firebase AI Logic**: Integrates Gemini API calls through Firebase backend triggers.

### How to Prompt Antigravity
* **Security Rules**:
  > *"Write production-ready `firestore.rules` enforcing that only authenticated users can update their user profiles and only team members can edit shared documents."*
* **Auth Integration**:
  > *"Set up Firebase Auth in React with Google Sign-In and protect all routes inside `/dashboard`."*
