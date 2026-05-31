# Add Campus Boarding Activity Type

This implementation plan details the addition of a "Campus Boarding" logging option in the Training Tracker application. This feature allows users to log campus boarding exercises with options for wall types, exercise types, and grades (specifically for boulder walls and beast boards), along with set-by-set weight and repetition logging, load metrics, combined history views, and plotting support.

## User Review Required

> [!NOTE]
> Database fields for the new activity will be stored in a new Firestore collection under `users/{userId}/Campus_Sessions` and the local storage draft key will be `campus_session_draft`.
>
> Svelte 5 syntax (runes, `onclick`, etc.) will be strictly followed to ensure consistency with the current codebase.

## Open Questions

*No open questions at this stage. The requirements are fully detailed.*

## Proposed Changes

We will group the changes into:
1. Svelte Session Types
2. API Service Configuration
3. Common Components & Page Routing
4. New Forms and Views (Campus Boarding Form, Session Card, and list view)
5. Chart & Statistics integration

---

### Svelte Types

#### [MODIFY] [session.ts](file:///home/jleaverland/repo/Training_Tracker/webapp-main/src/lib/types/session.ts)
* Add `CampusSet`, `CampusExercise`, and `CampusSession` interfaces.
* Extend the `Session` union to include `CampusSession`.

---

### API Configuration

#### [MODIFY] [api.ts](file:///home/jleaverland/repo/Training_Tracker/webapp-main/src/lib/services/api.ts)
* Export CRUD operations for `CampusSession` using `createCrudService`.
* Database collection name: `Campus_Sessions`.
* Identifier generator strategy: fallback to a generic string (e.g. "Campus Boarding").

---

### Svelte Components & Pages

#### [MODIFY] [+page.svelte (Log Page)](file:///home/jleaverland/repo/Training_Tracker/webapp-main/src/routes/log/+page.svelte)
* Register `campus_boarding` in `activityTypes` with list label "Campus Boarding" and icon "🪜".
* Import and render `<CampusBoardingForm />` dynamically.

#### [MODIFY] [+page.svelte (View Page)](file:///home/jleaverland/repo/Training_Tracker/webapp-main/src/routes/view/+page.svelte)
* Register `campus_boarding` in `activityTypes` with list label "Campus Boarding" and icon "🪜".
* Import and render `<CampusBoardingView />` dynamically.

#### [MODIFY] [CombinedView.svelte](file:///home/jleaverland/repo/Training_Tracker/webapp-main/src/lib/components/views/CombinedView.svelte)
* Import and use `getCampusSessions` API call in `handleFetchData`.
* Add `campus_boarding` mapping, labels (`🪜 Campus`), colors, and render `<CampusSessionCard />`.

#### [MODIFY] [EditSessionModal.svelte](file:///home/jleaverland/repo/Training_Tracker/webapp-main/src/lib/components/common/EditSessionModal.svelte)
* Support editing `campus_boarding` sessions by rendering `<CampusBoardingForm {initialData} />`.

#### [MODIFY] [CalendarView.svelte](file:///home/jleaverland/repo/Training_Tracker/webapp-main/src/lib/components/common/CalendarView.svelte)
* Register the `campus_boarding` type in `typeColorMap` with a unique Rose/Pink color.
* Add css styles for `.day.type-campus_boarding`.
* Add "Campus" legend entry for combined activities.

#### [MODIFY] [+page.svelte (Plot Page)](file:///home/jleaverland/repo/Training_Tracker/webapp-main/src/routes/plot/+page.svelte)
* Fetch `getCampusSessions` alongside other session types.
* Add `campus_boarding` type to the activity selector.
* Register `campus_boarding` in `viewsByActivity` allowing `general`, `periodization`, and `load` analyses.

#### [MODIFY] [stats.ts](file:///home/jleaverland/repo/Training_Tracker/webapp-main/src/lib/utils/stats.ts)
* Support `campus_boarding` session mapping in `getWeeklyLoadStats` to track fatigue levels.

---

### New Forms & Cards

#### [NEW] [CampusBoardingForm.svelte](file:///home/jleaverland/repo/Training_Tracker/webapp-main/src/lib/components/forms/CampusBoardingForm.svelte)
* Svelte 5 component utilizing runes for reactivity.
* Inputs: Date, Time.
* Multi-exercise list with Add/Remove Exercise buttons.
* Exercise Details:
  * Wall Type selector (`Campus board rings`, `Campus board balls`, `Boulder walls`, `Beast`).
  * Exercise Type selector (`Matched laddering`, `Alternate hand laddering`, `Double dyno laddering`, `Max double dyno`, `One hand bumps`, `Single deadpoint moves`, `Deadpoint and lock moves`, `Lock-off campusing`).
  * Conditional Grade Input (renders only when wall type is `Boulder walls` or `Beast`).
  * Set manager (Add/Remove sets with Added Weight and Reps fields).
  * Exercise Notes input.
* Load & Grip Metrics section.
* Session Notes section.
* Draft saving logic (`localStorage` using `campus_session_draft`).
* API saving/updating logic.

#### [NEW] [CampusSessionCard.svelte](file:///home/jleaverland/repo/Training_Tracker/webapp-main/src/lib/components/views/campus/CampusSessionCard.svelte)
* Svelte 5 component to render a single campus boarding log card in the combined history.
* Lists each exercise with wall type, exercise type, grade (if applicable), sets breakdown, and notes.
* Shows load metrics indicators.
* Offers Delete option.

#### [NEW] [CampusBoardingView.svelte](file:///home/jleaverland/repo/Training_Tracker/webapp-main/src/lib/components/views/CampusBoardingView.svelte)
* Svelte 5 view component listing Campus Boarding logs.
* Filters logs by selected date.
* Connects with delete and edit modal workflows.

---

## Verification Plan

### Automated Tests
* We can run the existing Vitest suite (`npm run test` or similar) to verify no regressions in other files.

### Manual Verification
* Run the local Svelte dev server (`npm run dev`) and test logging, viewing, editing, and deleting campus boarding logs.
* Test that selecting "Boulder walls" or "Beast" renders the grade input box.
* Verify that draft saving keeps form data if navigation occurs.
* Verify that Campus Boarding sessions display in the combined feed.
* Verify that weekly load graph plots correctly with campus boarding sessions included.
