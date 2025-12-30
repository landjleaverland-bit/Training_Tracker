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
  - **Components**:
    - `MultiSelect.svelte`: Reusable component for multi-selection with chips/tags.
    - Conditional form components in `$lib/components/forms/`:
    - **IndoorClimbForm**: date, location (6 options + Other), climbing_type, **training_details** (Multi-select: Type, Category, Energy System, Technique, Wall Angle), load metrics, climbs table
    - **OutdoorClimbForm**: date, area (cascading dropdown -> crag), sector, climbing_type, **training_details** (Multi-select), load metrics, climbs table
    - **FingerboardingForm**: date, exercise cards (Name, Grip), multi-set logging (Weight/Reps), notes
    - **CompetitionForm**: date, venue (list + Custom), type (Boulder/Lead/Speed), round configuration (Standard vs Result modes), dynamic climbs table or final position input
    - **Sync banner**: Shows when sessions are pending sync; includes "Sync Now" button when online, offline indicator when offline
  - **View Data Tab** (`/view`):
    - Activity type dropdown (same 5 options as Log Data)
    *   **View Data (`src/lib/components/views/`)**:
        *   **Persistence:** All views now use `cache.mergeSessions()` to persist fetched remote data to local storage, ensuring offline availability.
        *   `IndoorClimbView.svelte`: Implemented. **Visual Grouping:** Groups sessions by Date + Location + Type. Features date/location/grade filtering. **Sync:** Calls `syncAllPending()` before fetching.
        *   `OutdoorClimbView.svelte`: Implemented. **Visual Grouping:** Groups sessions by Date + Area + Crag + Type. Features date/area/crag filtering. Supports cascading location display. **Sync:** Calls `syncAllPending()` before fetching.
        *   `FingerboardingView.svelte`: Implemented. Timeline view with date filtering and collapsible session details. **Sync:** Calls `syncAllPending()` before fetching.
        *   `CompetitionView.svelte`: Implemented. Compact summary cards with expandable details for rounds and individual climb results. **Sync:** Calls `syncAllPending()` before fetching.
        *   `indoor/IndoorClimbFilters.svelte`: Expandable filter panel.
        *   `indoor/IndoorClimbCard.svelte`: Expandable session card with collapsed load metrics summary and sync status.
        *   `indoor/IndoorClimbEntry.svelte`: Nested expandable climb details.
        *   `outdoor/OutdoorClimbFilters.svelte`: Expandable filter panel.
        *   `outdoor/OutdoorClimbCard.svelte`: Expandable session card with collapsed load metrics summary and sync status.
        *   `outdoor/OutdoorClimbEntry.svelte`: Nested expandable climb details (distinct from indoor).
* **Backend:** Go 1.21 Cloud Function with Firestore integration.
  - `function.go`: Main entry point with CORS, auth, naming routing for indoor/outdoor/fingerboard/competition
  - `handlers.go`: CRUD handlers for all 4 session types
  - `firestore.go`: Client init (database: `climbing-tracker-db`, collections: `Indoor_Climbs`, `Outdoor_Climbs`, `Fingerboarding`, `Competitions`)
  - `models.go`: Go structs for Indoor, Outdoor, Fingerboard, and Competition sessions
  - Endpoints: GET/POST/PUT/DELETE for `/indoor_sessions`, `/outdoor_sessions`, `/fingerboard_sessions`, `/competition_sessions`
* **Infrastructure:** Project and DB created manually.

## 4. Schema & Data Models
* **Session types** defined in `$lib/types/session.ts`:
  - `BaseSession`: id, activityType, date, createdAt, updatedAt, **syncStatus** (pending/synced/error), syncedAt
  - `IndoorClimbSession`: extends BaseSession with location, climbingType, **trainingTypes**, **categories**, **energySystems**, **techniqueFocuses**, **wallAngles**, loads, climbs[]
  - `OutdoorClimbSession`: extends BaseSession with area, crag, sector, climbingType, **trainingTypes**, **categories**, **energySystems**, **techniqueFocuses**, loads, climbs[]
  - `FingerboardSession`: extends BaseSession with exercises[] (gripType, details[{ weight, reps }])
  - `CompetitionSession`: extends BaseSession with venue, type, loads, rounds[] (climbs/position)
* **Cache service** in `$lib/services/cache.ts`:
  - Uses localStorage with key `training_tracker_sessions`
  - Tracks sync status: `pending` (not synced), `synced` (uploaded to cloud), `error` (sync failed)
  - **Deduplication Strategy:** "Local-First". When fetching remote data, we only add sessions that do not exist locally by ID.
  - **Smart Merge:** Detects "ghost" duplicates (remote session matches pending local session by content but has different ID). Updates local ID to match remote ID and marks as synced.
  - **ID Management:** Local sessions get temporary UUIDs. Upon successful sync, `updateSessionId` swaps these for permanent backend IDs.
  - **Delete Handling:** Deletes prompt local removel immediately. If session was synced, ID is added to `pending_deletes` queue in localStorage for sync.
  - Functions: `getAllSessions`, `addSession`, `updateSession`, `deleteSession`, `getPendingSessions`, `markAsSynced`, `markAsSyncError`, `mergeSessions`, `updateSessionId`, `getPendingDeletes`, `addPendingDelete`, `removePendingDelete`
  - Helpers: `create...` and `get...` for specific session types
* **Sync service** in `$lib/services/sync.ts`:
  - `syncAllPending()`: Batch syncs all pending sessions AND deletes. Pushes pending deletes first, then pending creates/updates. Returns success/failed counts.
  - `getPendingCount()`: Returns count of unsynced sessions
  - Handles per-activity-type syncing (supports indoor, outdoor, fingerboard, competition)
* **API service** in `$lib/services/api.ts`:
  - URL: `https://func-workout-api-825153765638.europe-west1.run.app`
  - Functions: `create...` and `get...` for all 4 session types
  - Authenticates via `x-api-key` header

* **Manual Schema Migration:**
  - Transitioned from singular `trainingType` (etc.) to plural `trainingTypes` (`[]string`).
  - Backward compatibility code was removed from the frontend to keep the codebase clean.
  - Existing Firestore documents must be manually migrated to move data from the old singular fields to the new array fields, otherwise they will appear empty in the UI.

## 6. Design Decisions
* **Go Backend:** Chosen for high concurrency handling and fast cold-start times on Cloud Functions.
* **SPA Mode:** Chosen for free hosting on GitHub Pages, relying on backend for all dynamic data.
* **UI Modularization:** Distinct UI elements are split into separate files/folders. Shared components require strict documentation in Project State to prevent regression.
* **Deployment:** Using 'gh-pages' branch to separate source code (main) from production build artifacts.
* **Form-to-Page Communication:** Forms dispatch `window.dispatchEvent(new CustomEvent('session-saved'))` after saving sessions. Parent pages listen for this event to update sync banner pending counts.

## 7. Visualization & Plotting
* **Plot Data Tab** (`/plot`):
  - **Technology:** Svelte 5 Runes (`$state`, `$derived`, `$props`) + D3.js (for scales and path generation).
  - **Components (`$lib/components/`)**:
    - `PieChart.svelte`: Donut-style, with external responsive legend suitable for mobile. Center hole displays total count.
    - `BarChart.svelte`: Supports both Vertical and Horizontal orientations to handle long labels.
    - `LineChart.svelte`: Supports Multi-Series plotting (multiple lines) with auto-generated legend.
  - **Logic (`$lib/utils/stats.ts`)**:
    - Aggregates data purely from the local cache (`getAllSessions()`).
    - **Grade Normalization:** Automatically converts and creates a unified scale.
        - **Boulder:** Converts French/Font grades to Hueco (V-Scale).
        - **Sport:** Converts Hueco grades to French.
        - **Case Insensitive:** Handles `v2` vs `V2`.
    - **Logic handled:**
      - "Rest Days" calculated against the full date range of logs.
      - "Grip Load" aggregated by week and grip type.
      - "Recruitment/Max Pickups" filtered by specific exercise filtering.
  - **Filtering:** "Time Range" selector (Past Week, Past Month, Specific Week, Specific Month, All Time).
  - **Views (Dropdown Controlled):**
    1. General Activity (Pie Charts: Climb vs Rest, Fingerboard Consistency).
    2. Training Systems (Horizontal Bar).
    3. Performance Grade Pyramids (Vertical Bar, split Boulder/Lead).
    4. Venue Analysis (Horizontal Bar: Indoor Gym, Outdoor Crag, Outdoor Area).
    5. Periodization (Monthly/Weekly Load Bar).
    6. Finger Strength (Multi-line charts: Grip Load, Max Hang, Recruitment Pulls, Max Pick-ups).
