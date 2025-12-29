# Project State: Gym Logger (Go Backend)

## 1. System Overview
A secure, serverless gym workout logger using SvelteKit (SPA) and Go (Cloud Functions). The system utilizes a "Shared Secret" authentication pattern and Firestore in Native mode.

## 2. Architecture Snapshot
* **Frontend:** SvelteKit (GitHub Pages - 'gh-pages' branch, SPA Mode).
* **Backend:** Go 1.21 (Google Cloud Functions).
* **Database:** Firestore (Native Mode).
* **Auth:** Shared Secret (API Key Header validation).
  - Frontend: `$lib/services/auth.ts` - client-side SHA-256 hash verification, stores password in localStorage
  - Backend: Validates `x-api-key` header against `APP_SECRET_PASSWORD` env var
  - Password hash script: `scripts/generate-password-hash.sh`

## 3. Current Implementation State
* **Status:** Frontend UI in progress.
* **Frontend:** 
  - PWA support (manifest, service worker, icons)
  - 3-tab navigation: Log Data, View Data, Plot Data
  - Color scheme: Gold (#F4C430) + Teal (#4A9B9B)
  - Mobile-responsive (bottom-fixed tabs on mobile)
  - **Log Data Tab** (`/log`):
    - Activity type dropdown with 5 options: Indoor Climb, Outdoor Climb, Gym Session, Fingerboarding, Competition
    - Conditional form components in `$lib/components/forms/`
    - **IndoorClimbForm**: date, location (6 options + Other), climbing_type, session_type, load metrics (finger/shoulder/forearm 1-5), climbs table (sport?, name, grade, attempt type, attempts)
    - **Sync banner**: Shows when sessions are pending sync; includes "Sync Now" button when online, offline indicator when offline
  - **View Data Tab** (`/view`):
    - Activity type dropdown (same 5 options as Log Data)
    *   **View Data (`src/lib/components/views/`)**:
        *   `IndoorClimbView.svelte`: Implemented. Features date/location/grade filtering and remote data fetching.
        *   `indoor/IndoorClimbFilters.svelte`: Expandable filter panel.
        *   `indoor/IndoorClimbCard.svelte`: Expandable session card with load metrics and sync status.
        *   `indoor/IndoorClimbEntry.svelte`: Nested expandable climb details.
        *   (Other activity views are placeholders)
* **Backend:** Go 1.21 Cloud Function with Firestore integration.
  - `function.go`: Main entry point with CORS, auth, routing
  - `handlers.go`: CRUD handlers for indoor sessions
  - `firestore.go`: Client init (database: `climbing-tracker-db`, collection: `Indoor_Climbs`)
  - `models.go`: Go structs for IndoorSession
  - Endpoints: GET/POST/PUT/DELETE `/indoor_sessions`
* **Infrastructure:** Project and DB created manually.

## 4. Schema & Data Models
* **Session types** defined in `$lib/types/session.ts`:
  - `BaseSession`: id, activityType, date, createdAt, updatedAt, **syncStatus** (pending/synced/error), syncedAt
  - `IndoorClimbSession`: extends BaseSession with location, climbingType, sessionType, loads, climbs[]
* **Cache service** in `$lib/services/cache.ts`:
  - Uses localStorage with key `training_tracker_sessions`
  - Tracks sync status: `pending` (not synced), `synced` (uploaded to cloud), `error` (sync failed)
  - Functions: `getAllSessions`, `addSession`, `updateSession`, `deleteSession`, `getPendingSessions`, `markAsSynced`, `markAsSyncError`
* **Sync service** in `$lib/services/sync.ts`:
  - `syncAllPending()`: Batch syncs all pending sessions, returns success/failed counts
  - `getPendingCount()`: Returns count of unsynced sessions
  - Handles per-activity-type syncing (currently supports indoor_climb)
* **API service** in `$lib/services/api.ts`:
  - URL: `https://func-workout-api-825153765638.europe-west1.run.app`
  - Functions: `createIndoorSession`, `getIndoorSessions`, `deleteIndoorSession`, `isOnline`
  - Authenticates via `x-api-key` header

## 5. Design Decisions
* **Go Backend:** Chosen for high concurrency handling and fast cold-start times on Cloud Functions.
* **SPA Mode:** Chosen for free hosting on GitHub Pages, relying on backend for all dynamic data.
* **UI Modularization:** Distinct UI elements are split into separate files/folders. Shared components require strict documentation in Project State to prevent regression.
* **Deployment:** Using 'gh-pages' branch to separate source code (main) from production build artifacts.
* **Form-to-Page Communication:** Forms dispatch `window.dispatchEvent(new CustomEvent('session-saved'))` after saving sessions. Parent pages listen for this event to update sync banner pending counts.
