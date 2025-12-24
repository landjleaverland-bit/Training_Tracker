# Gemini Context: Deep Dive & Architecture

> [!IMPORTANT]
> **Read this before making architectural changes.**
> This codebase uses a hybrid online/offline architecture with specific data contracts that differ between Read and Write paths.

## 1. Core Architecture
- **Framework**: SvelteKit (SPA structure via `import { browser }` checks).
- **Backend**: Google Cloud Functions (Node.js 20) + BigQuery.
- **Client State**: Svelte `writable` stores persisted to `localStorage`.
- **Styling**: Vanilla CSS.

## 2. Data Flow & Contracts ("The Tricky Part")
The application has **asymmetric** data shapes for Reading vs. Writing.

### Write Path (`LogExercise.svelte` -> `saveLog.js`)
Components export `getData()` which returns a **nested** structure.
- **Protocol**: HTTP POST
- **Payload Structure**:
  ```json
  {
    "activity_type": "indoor" | "outdoor" | "fingerboard" | "competition",
    "location": "String" | Object,
    "climbs": [ ... ], // Array of RAW exercise objects
    "training": { ... },
    "isResultOnly": boolean
  }
  ```
- **Fingerboard Specifics**: `climbs` array contains objects with `details: [{ weight, reps }, ...]`.
- **Competition Specifics**: `climbs` array contains objects with `attempts` ("Flash" | "Top" | "Zone").

### Read Path (`getLogs.js` -> `ViewData.svelte`)
*The Backend normalizes data before sending it to the client.*
- **Protocol**: HTTP GET
- **Response Structure**: **FLATTENED** rows.
  - `indoor`/`outdoor`: One row = One Climb.
  - `fingerboard`: One row = One Grip/Exercise Combo. (If a user did 3 sets of the same grip, it might appear as one aggregated row or separate rows depending on exact usage, but usually flattened).
  - **Transformation**: `getLogs.js` converts complex `location` objects (e.g., Outdoor `{ area, crag }`) into a single string `"Area > Crag"`.

> [!WARNING]
> **Deduplication Hazard**: `ViewData.svelte` receives these flattened rows and tries to group them back into "Sessions". It dedups based on a generated key: `Date + Location + SessionType`. If you change how `getLogs.js` formats the location string, you will break the frontend grouping logic!

## 3. Critical Components

### `src/lib/components/LogExercise.svelte` ( The Orchestrator )
- **Responsibility**: Manages the "Save" button state, Sync logic, and Offline fallback.
- **Sync Logic**:
  - `onMount`: Checks presence of `pendingLogsCount`.
  - `syncOfflineLogs()`: Iterates `historyStore`, finds `synced: false` logs, POSTs them, then updates local store to `synced: true`.
  - **Implicit Contract**: It expects `activeComponent.getData()` to exist.

### `src/lib/stores/history.js` ( The Cache )
- **Responsibility**: Merges Server Data (from `fetchData`) with Local Data (from `localStorage`).
- **Merge Strategy**: `syncLogs(type, newLogs)`
  - It creates a `uniqueId` for every log to prevent duplicates.
  - **Key Formula**: `${date}|${location}|${session}|${JSON.stringify(climbs)}...`
  - **Priority**: If a local log exists (synced: false) and a remote log arrives (synced: true) with the exact same data content, the remote one usually supercedes, but exact matching is strict.

### `src/lib/stores/auth.js`
- **Security**: Basic SHA-256 hash of a password.
- **Mechanism**: The "API Key" stored in `localStorage` IS the password itself. It is sent as a Bearer token.
- **Gotcha**: The backend `saveLog.js` checks `process.env.APP_AUTH_KEY` against this token.

## 4. Backend (Functions)
- **`saveLog.js`**: Streams data to BigQuery. Handles `os.tmpdir()` file creation for NDJSON load jobs.
  - *Schema*: Defines explicit BigQuery schemas for each table type.
- **`getLogs.js`**: Runs SQL queries. **LIMIT 100**.
  - *Normalization*: This is where the Read/Write asymmetry happens.

## 5. Maintenance / Updates
When adding a new Activity Type:
1.  **Frontend**: Create `src/lib/components/log/NewActivity.svelte` implementing `getData()`.
2.  **Registration**: Add to `LogExercise.svelte` options list.
3.  **Store**: Update `history.js` `syncLogs` compatibility if the data shape is wildly different.
4.  **Backend**: Update `saveLog.js` (add table mapping & Schema) and `getLogs.js` (add normalization logic).
