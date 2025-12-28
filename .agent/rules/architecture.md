# System Architecture

## Overview
A web application hosted on GitHub Pages (Static SPA) interacting with a Google Cloud Serverless backend.

## Components
 * **Frontend:** SvelteKit (SPA Mode).
   * Hosting: GitHub Pages.
   * Deployment: Static build pushed to 'gh-pages' branch.
   * Routing: Client-side only (Fallback to index.html).
   * Auth: "Shared Secret" pattern (API Key in localStorage).
 * **Backend:** Google Cloud Functions (Go 1.21+).
   * Pattern: RESTful Resource (One function handling GET/POST/PUT/DELETE).
   * Auth: Validates 'x-api-key' header against server-side Env Var.
   * Querying: API must support filtering/range queries via URL params mapped to Firestore clauses.
 * **Database:** Google Firestore.
   * Access: Blocked to public. Only accessible via Cloud Function Identity.

## Security Model
 * Frontend: No secrets allowed in source code.
 * Backend: Service Account Identity used for DB access.
