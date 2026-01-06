# Project State: Gym Logger (Offline-First Firebase SDK)

## 1. System Overview
A secure, offline-first gym workout logger using SvelteKit (SPA) and Firebase Firestore. The system relies on the Firebase JS SDK for authentication, data persistence, and synchronization, removing the need for a custom Go backend for basic CRUD operations.

## 2. Architecture Snapshot
* **Frontend:** SvelteKit (GitHub Pages - 'gh-pages' branch, SPA Mode).
* **Backend:** Serverless (Google Firebase Firestore).
* **Database:** Firestore (Native Mode), structured as `users/{uid}/{CollectionName}`.
* **Auth:** Firebase Auth (Google Sign-In).
* **Offline Strategy:**
  *   **Persistence:** Firestore `persistentLocalCache` enabled in `firebase.ts`.
  *   **Syncing:** Handled automatically by the Firestore SDK when connectivity is restored.
  *   **Deduplication:** Deterministic ID generation (`YYYY-MM-DD_time_Identifier`) ensures idempotent writes.

## 3. Current Implementation State
* **Status:** Offline-first architecture implemented and UI verified.
* **Frontend:** 
  - PWA support (manifest, service worker, icons)
  - 3-tab navigation: Log Data, View Data, Plot Data
  - Color scheme: Gold (#F4C430) + Teal (#4A9B9B)
  - Mobile-responsive (bottom-fixed tabs on mobile)
  - **Log Data Tab** (`/log`):
    - Activity type dropdown with 5 options: Indoor Climb, Outdoor Climb, Gym Session, Fingerboarding, Competition
  - **Components**:
    - `MultiSelect.svelte`: Reusable component for multi-selection with chips/tags.
    - **Session Forms** (`$lib/components/forms/`): All forms updated to include a **Time** field for precise sorting and ID generation.
        - **IndoorClimbForm**: date, time, location, climbing_type, training_details, load metrics, climbs table.
        - **OutdoorClimbForm**: date, time, area (cascading dropdown -> crag), sector, climbing_type, training_details, load metrics, climbs table.
        - **GymSessionForm**: date, time, name, bodyweight, exercise flow, rich set logging.
        - **FingerboardingForm**: date, time, exercise cards, multi-set logging.
        - **CompetitionForm**: date, time, venue, type, round configuration.
  - **View Data Tab** (`/view`):
    - **Offline Capable:** All views use `api.ts` which wraps Firestore `getDocs` with caching. 
    - **Visuals:** Updated to display the `time` field for all session types.
    - **Components (`src/lib/components/views/`)**:
        - `IndoorClimbView.svelte`: Groups by Date + Location + Type.
        - `OutdoorClimbView.svelte`: Groups by Date + Area. 
        - `GymSessionView.svelte`: List view sorted by date/time.
        - `FingerboardingView.svelte`: Timeline view.
        - `CompetitionView.svelte`: Summary cards.
* **API Service (`$lib/services/api.ts`):**
  - **Direct SDK Integration:** Replaced fetch calls to Cloud Functions with direct Firestore `getDocs`, `setDoc`, `updateDoc`, `deleteDoc`.
  - **Deterministic IDs:** Helper `generateSessionId(date, time, identifier)` creates IDs like `2023-10-27_14-30_Rockstar`. 
  - **Idempotency:** `setDoc(..., { merge: true })` prevents duplicates if the same session is submitted twice while offline.

## 4. Schema & Data Models
* **Session types** defined in `$lib/types/session.ts` (All extend `BaseSession`):
  - `BaseSession`: id, activityType, date, **time** (HH:mm), createdAt, updatedAt, syncStatus (local/synced)
  - `IndoorClimbSession`: location, climbingType, trainingTypes, categories, energySystems, loads, climbs[]
  - `OutdoorClimbSession`: area, crag, sector, climbingType, trainingTypes, categories, energySystems, loads, climbs[]
  - `GymSession`: name, bodyweight, trainingBlock, exercises[] (sets w/ RPE/tags)
  - `FingerboardSession`: exercises[] (gripType, details)
  - `CompetitionSession`: venue, type, rounds[]

## 5. Design Decisions
* **Offline-First:** Critical requirement for gym usage. Implemented via Firebase SDK's built-in `enableIndexedDbPersistence` (modern `initializeFirestore` with cache settings).
* **Deterministic IDs:** Chosen over random UUIDs to solve the "offline duplicate" problem. If a user logs a session offline and syncs later, any retry or double-submit will overwrite the same document ID rather than creating a ghost duplicate.
* **SPA Mode:** continued usage of GitHub Pages for hosting.
* **User Isolation:** All data is strictly siloed under `users/{uid}/...` to ensure security rules can easily protect user data.

## 6. Visualization & Plotting
* **Plot Data Tab** (`/plot`):
  - **Technology:** Svelte 5 Runes + D3.js.
  - **Components**: `PieChart`, `BarChart`, `LineChart`.
  - **Logic**: `stats.ts` handles normalization of grades (V-Scale/French) and aggregation of load metrics.
  - **Views**: General Activity, Training Systems, Performance Pyramids, Venue Analysis, Periodization, Finger Strength.
