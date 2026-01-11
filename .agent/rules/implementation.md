# Implementation Rules & Standards

## Code Generation Strategy
 * Architect: Gemini 3 Pro High.
 * Coder: Opus 4.5.

## Documentation & Knowledge Management (CRITICAL)
 * **Living Documentation:** You must maintain a detailed record of implementation decisions in .agent/project_state.md.
 * **Update Protocol:** Whenever you implement a new feature or change the architecture, YOU MUST update .agent/project_state.md first.
 * **Code Comments:** In complex areas, add comments directing reader to documentation.

## Frontend UI Strategy (Modularity)
 * **Component Separation:** Distinct UI elements (forms, tables, cards) MUST be split into their own .svelte files. Do not build monolithic page files.
 * **Organization:** Group components in folders matching their parent domain (e.g., src/lib/components/workout-log/WorkoutTable.svelte).
 * **Reusability:** If a component is used in multiple places (e.g., a "Button" or "Modal"), place it in src/lib/components/shared/. 
   * **WARNING:** Take extra care when modifying shared elements to avoid unintended consequences in other areas.
   * **PROTOCOL:** When using a shared element, add a code comment reminding yourself to detail its usage in .agent/project_state.md. Always check .agent/project_state.md before modifying any shared element definition.

## Backend Strategy (Go)
 * Runtime: Go 1.21 (or latest supported by GCF).
 * Structure:
   * function.go: Main entry point (Exported function WorkoutAPI).
   * cmd/main.go: Local development server.
   * internal/: Private packages for DB logic and Auth.
 * Filtering: Map URL url.Values to firestore.Query.

## Testing Protocol (MANDATORY)
 * **Continuous Testing:** For every new UI component, write a corresponding Playwright test file.
 * **Regression Check:** Run npm run test before marking tasks complete.
 * **Mocking:** Use page.route in Playwright; do not hit live backend for UI tests.

## SvelteKit Configuration (GitHub Pages)
 * Adapter: @sveltejs/adapter-static.
 * SPA Mode: src/routes/+layout.ts must have ssr = false and prerender = true.
 * Config: svelte.config.js must set fallback: 'index.html'.
 * Deployment: CI/CD must build to 'build/' directory and push to 'gh-pages' branch.

## Authentication Implementation
 * Frontend: src/lib/api.ts -> reads localStorage -> sets x-api-key header.
 * Backend: function.go -> compares r.Header.Get("x-api-key") vs os.Getenv("APP_SECRET_PASSWORD").

## Using Generated Documentation

For all implementation tasks, you MUST consult the generated documentation digest at `webapp-main/docs/llm_context.md`.

This file contains the most up-to-date information about:
- Component props and usage
- Service API signatures and types
- Data structures and constants

Always check this file before making assumptions about existing code or interfaces.
