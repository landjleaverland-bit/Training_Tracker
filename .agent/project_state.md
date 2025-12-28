# Project State: Gym Logger (Go Backend)

## 1. System Overview
A secure, serverless gym workout logger using SvelteKit (SPA) and Go (Cloud Functions). The system utilizes a "Shared Secret" authentication pattern and Firestore in Native mode.

## 2. Architecture Snapshot
* **Frontend:** SvelteKit (GitHub Pages - 'gh-pages' branch, SPA Mode).
* **Backend:** Go 1.21 (Google Cloud Functions).
* **Database:** Firestore (Native Mode).
* **Auth:** Shared Secret (API Key Header validation).

## 3. Current Implementation State
* **Status:** Initialization / Hello World.
* **Frontend:** Scaffolded (Skeleton). No UI logic yet.
* **Backend:** Module initialized. No handlers yet.
* **Infrastructure:** Project and DB created manually.

## 4. Schema & Data Models
*(Placeholder: To be populated by Agent during implementation)*

## 5. Design Decisions
* **Go Backend:** Chosen for high concurrency handling and fast cold-start times on Cloud Functions.
* **SPA Mode:** Chosen for free hosting on GitHub Pages, relying on backend for all dynamic data.
* **UI Modularization:** Distinct UI elements are split into separate files/folders. Shared components require strict documentation in Project State to prevent regression.
* **Deployment:** Using 'gh-pages' branch to separate source code (main) from production build artifacts.
