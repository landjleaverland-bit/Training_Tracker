# Project Structure & Architecture

## Overview
Training Tracker is a SvelteKit-based web application for tracking climbing and training activities (Indoor, Outdoor, Fingerboarding, Competition). It uses Google Cloud Functions (BigQuery) for backend persistence and `localStorage` for offline caching.

## Directory Structure

```text
Training_Tracker/
├── src/
│   ├── routes/              # SvelteKit pages
│   │   ├── +page.svelte     # Main dashboard & Log View
│   │   └── +layout.svelte   # App shell
│   ├── lib/
│   │   ├── components/      # UI Components
│   │   │   ├── log/         # Activity-specific logging forms (Indoor, Outdoor, etc.)
│   │   │   ├── common/      # Reusable UI (Metrics, etc.)
│   │   │   ├── ViewData.svelte # Main data view & filtering logic
│   │   │   └── LogExercise.svelte # Main logging container & orchestrator
│   │   ├── stores/          # Svelte Stores
│   │   │   ├── auth.js      # Authentication state
│   │   │   └── history.js   # Local data cache & sync logic
│   │   ├── utils/           # Helper functions
│   │   └── data/            # Static data (e.g., climbing areas)
│   └── service-worker.js    # Service worker (if enabled)
├── functions/               # Google Cloud Functions (Backend)
│   ├── saveLog.js           # Writes logs to BigQuery
│   ├── getLogs.js           # Reads logs from BigQuery
│   └── deleteLog.js         # Deletes logs from BigQuery
└── docs/                    # Project documentation
```

## Key Components

### Frontend (SvelteKit)
- **`LogExercise.svelte`**: The central coordinator for logging. It handles:
  - Form selection (Indoor, Outdoor, etc.).
  - Orchestrating saving to the backend (`submitToBigQuery`).
  - Offline fallback (saving to `localStorage` via `history.js` store).
  - Syncing offline logs when online.

- **`ViewData.svelte`**: The main view for exploring history. It handles:
  - Fetching data from `getLogs.js`.
  - Merging local (offline) and remote data.
  - Filtering and grouping logs by date/session.

- **`history.js` (Store)**:
  - Manages the local cache of logs.
  - Handles the "Sync" logic (merging new server data with local data).
  - Persists to `localStorage`.

### Backend (Google Cloud Functions)
- **`saveLog.js`**: Accepts a JSON payload, transforms it to BigQuery schema, and streams it to BigQuery. Support for nested "climbs" or "details".
- **`getLogs.js`**: Queries BigQuery for user logs.
- **`deleteLog.js`**: Removes entries.

## Data Flow
1. **Logging**: User fills form -> `LogExercise` -> `saveLog.js` (GCF) -> BigQuery.
   - *Offline*: `LogExercise` -> `history.js` (Store) -> `localStorage`.
   - *Sync*: `LogExercise` (on mount/online) -> sends pending logs -> calls `saveLog.js`.
2. **Viewing**: `ViewData` -> `getLogs.js` (GCF) -> BigQuery.
   - Data is merged with `history.js` store to show immediate local updates.

## Interdependencies
- **`LogExercise.svelte` <-> `log/*.svelte` components**: The child components must export a `getData()` function that returns a specific object structure expected by `LogExercise`.
- **`ViewData.svelte` <-> `history.js`**: Strongly coupled for reliable "optimistic UI" updates (showing saved logs immediately without refetching).
