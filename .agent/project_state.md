# Project State: Gym Logger (Go Backend)

## 1. System Overview
A secure, serverless gym workout logger using SvelteKit (SPA) and Go (Cloud Functions). The system utilizes a "Shared Secret" authentication pattern and Firestore in Native mode.

## 2. Architecture Snapshot
* **Frontend:** SvelteKit (GitHub Pages - 'gh-pages' branch, SPA Mode).
* **Backend:** Go 1.21 (Google Cloud Functions).
* **Database:** Firestore (Native Mode).
* **Auth:** Shared Secret (API Key Header validation).

## 3. Current Implementation State
* **Status:** Frontend UI in progress.
* **Frontend:** 
  - PWA support (manifest, service worker, icons)
  - 3-tab navigation: Log Data, View Data, Plot Data
  - Color scheme: Gold (#F4C430) + Teal (#4A9B9B)
  - Mobile-responsive (bottom-fixed tabs on mobile)
  - Log Data: Activity type dropdown with conditional form components
    - Forms in `$lib/components/forms/`: IndoorClimbForm, OutdoorClimbForm, GymSessionForm, FingerboardingForm, CompetitionForm
* **Backend:** Module initialized. No handlers yet.
* **Infrastructure:** Project and DB created manually.

## 4. Schema & Data Models
*(Placeholder: To be populated by Agent during implementation)*

## 5. Design Decisions
* **Go Backend:** Chosen for high concurrency handling and fast cold-start times on Cloud Functions.
* **SPA Mode:** Chosen for free hosting on GitHub Pages, relying on backend for all dynamic data.
* **UI Modularization:** Distinct UI elements are split into separate files/folders. Shared components require strict documentation in Project State to prevent regression.
* **Deployment:** Using 'gh-pages' branch to separate source code (main) from production build artifacts.
