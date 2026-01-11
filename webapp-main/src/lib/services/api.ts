/**
 * @file api.ts
 * @brief Main API service for interacting with Firebase Firestore.
 *
 * This module handles all CRUD operations for the application's data models:
 * - Indoor Climbs
 * - Outdoor Climbs
 * - Fingerboarding
 * - Competitions
 * - Gym Sessions
 *
 * It provides a standardized response wrapper and manages user-specific collections.
 */

import { db } from './firebase';
import { getCurrentUserId } from './auth';
import {
    collection,
    setDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    getDoc,
    query,
    where,
    orderBy,
    Timestamp,
    type DocumentData
} from 'firebase/firestore';

/**
 * @brief Standardized response wrapper to match existing app architecture.
 *
 * @template T Type of the data returned in case of success.
 */
interface ApiResponse<T> {
    ok: boolean;
    data?: T;
    error?: string;
}

/**
 * @brief Helper to handle Firestore errors consistently.
 *
 * @param e The error object caught from a try-catch block.
 * @returns {ApiResponse<any>} An error response object.
 */
function handleFirestoreError(e: unknown): ApiResponse<any> {
    console.error('Firestore Error:', e);
    return {
        ok: false,
        error: e instanceof Error ? e.message : 'Unknown Firestore error'
    };
}

/**
 * @brief Helper to convert Firestore dates (Timestamps) to ISO strings.
 *
 * Ensures that all date fields in the document are returned as ISO 8601 strings
 * instead of Firestore Timestamp objects, making them serializable for the frontend.
 *
 * @template T The expected return type.
 * @param docSnap The Firestore document snapshot data.
 * @returns {T} The formatted data object.
 */
function formattedDoc<T>(docSnap: DocumentData): T {
    const data = docSnap.data();
    return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || new Date().toISOString(),
        date: data.date // Assuming date is stored as string YYYY-MM-DD or similar, if Timestamp convert it too
    } as T;
}

/**
 * @brief Helper to get a reference to a user-specific collection.
 *
 * Ensures all data is namespaced under `users/{uid}/{collectionName}`.
 * Throws an error if the user is not authenticated.
 *
 * @param collectionName The name of the sub-collection.
 * @returns {CollectionReference} Firestore collection reference.
 */
function getUserCollectionRef(collectionName: string) {
    const uid = getCurrentUserId();
    if (!uid) throw new Error('User not authenticated');
    return collection(db, 'users', uid, collectionName);
}

/**
 * @brief Helper to get a reference to a specific document within a user's collection.
 *
 * @param collectionName The name of the sub-collection.
 * @param id The document ID.
 * @returns {DocumentReference} Firestore document reference.
 */
function getUserDocRef(collectionName: string, id: string) {
    const uid = getCurrentUserId();
    if (!uid) throw new Error('User not authenticated');
    return doc(db, 'users', uid, collectionName, id);
}

/**
 * @brief Helper to remove undefined fields from payload.
 *
 * Firestore rejects `undefined` values, so this function strips them out
 * by serializing and deserializing via JSON.
 *
 * @template T Type of the payload.
 * @param payload The object to sanitize.
 * @returns {T} The sanitized object.
 */
function sanitizePayload<T>(payload: T): T {
    // efficient way to remove undefined values
    return JSON.parse(JSON.stringify(payload));
}

/**
 * @brief Helper to generate a deterministic session ID.
 *
 * Format: `YYYY-MM-DD_HH-mm_Identifier`
 *
 * @param date The date string (YYYY-MM-DD).
 * @param time The time string (HH:mm).
 * @param identifier A unique identifier (e.g., location name).
 * @returns {string} The generated session ID.
 */
function generateSessionId(date: string, time: string, identifier: string): string {
    const cleanIdentifier = identifier.replace(/[^a-zA-Z0-9]/g, '_');
    return `${date}_${time.replace(':', '-')}_${cleanIdentifier}`;
}

// ------------------------------------------------------------------
// Indoor Sessions
// ------------------------------------------------------------------

/**
 * @brief Payload for creating or updating an Indoor Session.
 */
export interface IndoorSessionPayload {
    date: string;
    time: string;
    location: string;
    customLocation?: string;
    climbingType: string;
    trainingTypes: string[];
    difficulty?: string;
    categories?: string[];
    energySystems?: string[];
    techniqueFocuses?: string[];
    wallAngles?: string[];
    fingerLoad: number;
    shoulderLoad: number;
    forearmLoad: number;
    openGrip: number;
    crimpGrip: number;
    pinchGrip: number;
    sloperGrip: number;
    jugGrip: number;
    notes?: string;
    climbs: Array<{
        isSport: boolean;
        name: string;
        grade: string;
        attemptType: string;
        attemptsNum: number;
        notes: string;
    }>;
}

/**
 * @brief Indoor Session object as returned from the API.
 */
export interface RemoteIndoorSession extends IndoorSessionPayload {
    id: string;
    createdAt: string;
    updatedAt: string;
    activityType: 'indoor_climb';
}

/**
 * @brief Create a new Indoor Climbing Session.
 *
 * @param session The session data.
 * @returns {Promise<{ ok: boolean; id?: string; error?: string }>}
 */
export async function createIndoorSession(session: IndoorSessionPayload): Promise<{ ok: boolean; id?: string; error?: string }> {
    try {
        const uid = getCurrentUserId();
        if (!uid) return { ok: false, error: 'User not authenticated' };

        const id = generateSessionId(session.date, session.time, session.customLocation || session.location);
        const docRef = getUserDocRef('Indoor_Climbs', id);

        await setDoc(docRef, {
            ...sanitizePayload(session),
            activityType: 'indoor_climb',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        }, { merge: true });

        return { ok: true, id };
    } catch (e) {
        return handleFirestoreError(e);
    }
}

/**
 * @brief Update an existing Indoor Climbing Session.
 *
 * @param id The session ID.
 * @param session The updated session data.
 * @returns {Promise<{ ok: boolean; error?: string }>}
 */
export async function updateIndoorSession(id: string, session: IndoorSessionPayload): Promise<{ ok: boolean; error?: string }> {
    try {
        const uid = getCurrentUserId();
        if (!uid) return { ok: false, error: 'User not authenticated' };

        const docRef = getUserDocRef('Indoor_Climbs', id);
        await updateDoc(docRef, {
            ...sanitizePayload(session),
            updatedAt: Timestamp.now()
        });
        return { ok: true };
    } catch (e) {
        return handleFirestoreError(e);
    }
}

/**
 * @brief Fetch Indoor Climbing Sessions.
 *
 * @param since Optional ISO date string to fetch only sessions updated after this date.
 * @returns {Promise<{ ok: boolean; data?: RemoteIndoorSession[]; error?: string }>}
 */
export async function getIndoorSessions(since?: string): Promise<{ ok: boolean; data?: RemoteIndoorSession[]; error?: string }> {
    try {
        const uid = getCurrentUserId();
        if (!uid) return { ok: false, error: 'User not authenticated' };

        let q = query(getUserCollectionRef('Indoor_Climbs'), orderBy('date', 'desc'));

        // Client-side filtering optimization:
        // If dataset becomes large, rely on 'since' timestamp to fetch only deltas.
        if (since) {
            q = query(getUserCollectionRef('Indoor_Climbs'), where('updatedAt', '>', Timestamp.fromDate(new Date(since))));
        }

        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(d => ({
            ...formattedDoc<RemoteIndoorSession>(d),
            activityType: 'indoor_climb' as const
        }));
        return { ok: true, data };
    } catch (e) {
        return handleFirestoreError(e);
    }
}

/**
 * @brief Delete an Indoor Climbing Session.
 *
 * @param id The session ID.
 * @returns {Promise<{ ok: boolean; error?: string }>}
 */
export async function deleteIndoorSession(id: string): Promise<{ ok: boolean; error?: string }> {
    try {
        const uid = getCurrentUserId();
        if (!uid) return { ok: false, error: 'User not authenticated' };

        await deleteDoc(getUserDocRef('Indoor_Climbs', id));
        return { ok: true };
    } catch (e) {
        return handleFirestoreError(e);
    }
}

// ------------------------------------------------------------------
// Outdoor Sessions
// ------------------------------------------------------------------

/**
 * @brief Payload for creating or updating an Outdoor Session.
 */
export interface OutdoorSessionPayload {
    date: string;
    time: string;
    area: string;
    crag: string;
    sector?: string;
    climbingType: string;
    trainingTypes: string[];
    difficulty?: string;
    categories?: string[];
    energySystems?: string[];
    techniqueFocuses?: string[];
    fingerLoad?: number;
    shoulderLoad?: number;
    forearmLoad?: number;
    openGrip?: number;
    crimpGrip?: number;
    pinchGrip?: number;
    sloperGrip?: number;
    jugGrip?: number;
    notes?: string;
    climbs: Array<{
        isSport: boolean;
        name: string;
        grade: string;
        attemptType: string;
        attemptsNum: number;
        notes: string;
    }>;
}

/**
 * @brief Outdoor Session object as returned from the API.
 */
export interface RemoteOutdoorSession extends OutdoorSessionPayload {
    id: string;
    createdAt: string;
    updatedAt: string;
    activityType: 'outdoor_climb';
}

/**
 * @brief Create a new Outdoor Climbing Session.
 *
 * @param session The session data.
 * @returns {Promise<{ ok: boolean; id?: string; error?: string }>}
 */
export async function createOutdoorSession(session: OutdoorSessionPayload): Promise<{ ok: boolean; id?: string; error?: string }> {
    try {
        const uid = getCurrentUserId();
        if (!uid) return { ok: false, error: 'User not authenticated' };

        const id = generateSessionId(session.date, session.time, `${session.area}_${session.crag}`);
        const docRef = getUserDocRef('Outdoor_Climbs', id);

        await setDoc(docRef, {
            ...sanitizePayload(session),
            activityType: 'outdoor_climb',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        }, { merge: true });

        return { ok: true, id };
    } catch (e) {
        return handleFirestoreError(e);
    }
}

/**
 * @brief Update an existing Outdoor Climbing Session.
 *
 * @param id The session ID.
 * @param session The updated session data.
 * @returns {Promise<{ ok: boolean; error?: string }>}
 */
export async function updateOutdoorSession(id: string, session: OutdoorSessionPayload): Promise<{ ok: boolean; error?: string }> {
    try {
        const uid = getCurrentUserId();
        if (!uid) return { ok: false, error: 'User not authenticated' };

        const docRef = getUserDocRef('Outdoor_Climbs', id);
        await updateDoc(docRef, {
            ...sanitizePayload(session),
            updatedAt: Timestamp.now()
        });
        return { ok: true };
    } catch (e) {
        return handleFirestoreError(e);
    }
}

/**
 * @brief Fetch Outdoor Climbing Sessions.
 *
 * @param since Optional ISO date string to fetch only sessions updated after this date.
 * @returns {Promise<{ ok: boolean; data?: RemoteOutdoorSession[]; error?: string }>}
 */
export async function getOutdoorSessions(since?: string): Promise<{ ok: boolean; data?: RemoteOutdoorSession[]; error?: string }> {
    try {
        const uid = getCurrentUserId();
        if (!uid) return { ok: false, error: 'User not authenticated' };

        let q = query(getUserCollectionRef('Outdoor_Climbs'), orderBy('date', 'desc'));
        if (since) {
            q = query(getUserCollectionRef('Outdoor_Climbs'), where('updatedAt', '>', Timestamp.fromDate(new Date(since))));
        }
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(d => ({
            ...formattedDoc<RemoteOutdoorSession>(d),
            activityType: 'outdoor_climb' as const
        }));
        return { ok: true, data };
    } catch (e) {
        return handleFirestoreError(e);
    }
}

/**
 * @brief Delete an Outdoor Climbing Session.
 *
 * @param id The session ID.
 * @returns {Promise<{ ok: boolean; error?: string }>}
 */
export async function deleteOutdoorSession(id: string): Promise<{ ok: boolean; error?: string }> {
    try {
        const uid = getCurrentUserId();
        if (!uid) return { ok: false, error: 'User not authenticated' };

        await deleteDoc(getUserDocRef('Outdoor_Climbs', id));
        return { ok: true };
    } catch (e) {
        return handleFirestoreError(e);
    }
}

// ------------------------------------------------------------------
// Fingerboard Sessions
// ------------------------------------------------------------------

/**
 * @brief Payload for creating or updating a Fingerboard Session.
 */
export interface FingerboardSessionPayload {
    date: string;
    time: string;
    location: string;
    exercises: Array<{
        id: string;
        name: string;
        gripType: string;
        sets: number;
        details: Array<{
            weight: number;
            reps: number;
        }>;
        notes: string;
    }>;
    fingerLoad?: number;
    shoulderLoad?: number;
    forearmLoad?: number;
    openGrip?: number;
    crimpGrip?: number;
    pinchGrip?: number;
    sloperGrip?: number;
    jugGrip?: number;
}

/**
 * @brief Fingerboard Session object as returned from the API.
 */
export interface RemoteFingerboardSession extends FingerboardSessionPayload {
    id: string;
    createdAt: string;
    updatedAt: string;
    activityType: 'fingerboarding';
}

/**
 * @brief Create a new Fingerboard Session.
 *
 * @param session The session data.
 * @returns {Promise<{ ok: boolean; id?: string; error?: string }>}
 */
export async function createFingerboardSession(session: FingerboardSessionPayload): Promise<{ ok: boolean; id?: string; error?: string }> {
    try {
        const uid = getCurrentUserId();
        if (!uid) return { ok: false, error: 'User not authenticated' };

        const id = generateSessionId(session.date, session.time, 'Fingerboarding');
        const docRef = getUserDocRef('Fingerboarding', id);

        await setDoc(docRef, {
            ...sanitizePayload(session),
            activityType: 'fingerboarding',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        }, { merge: true });

        return { ok: true, id };
    } catch (e) {
        return handleFirestoreError(e);
    }
}

/**
 * @brief Update an existing Fingerboard Session.
 *
 * @param id The session ID.
 * @param session The updated session data.
 * @returns {Promise<{ ok: boolean; error?: string }>}
 */
export async function updateFingerboardSession(id: string, session: FingerboardSessionPayload): Promise<{ ok: boolean; error?: string }> {
    try {
        const uid = getCurrentUserId();
        if (!uid) return { ok: false, error: 'User not authenticated' };

        const docRef = getUserDocRef('Fingerboarding', id);
        await updateDoc(docRef, {
            ...sanitizePayload(session),
            updatedAt: Timestamp.now()
        });
        return { ok: true };
    } catch (e) {
        return handleFirestoreError(e);
    }
}

/**
 * @brief Fetch Fingerboard Sessions.
 *
 * @param since Optional ISO date string to fetch only sessions updated after this date.
 * @returns {Promise<{ ok: boolean; data?: RemoteFingerboardSession[]; error?: string }>}
 */
export async function getFingerboardSessions(since?: string): Promise<{ ok: boolean; data?: RemoteFingerboardSession[]; error?: string }> {
    try {
        const uid = getCurrentUserId();
        if (!uid) return { ok: false, error: 'User not authenticated' };

        let q = query(getUserCollectionRef('Fingerboarding'), orderBy('date', 'desc'));
        if (since) {
            q = query(getUserCollectionRef('Fingerboarding'), where('updatedAt', '>', Timestamp.fromDate(new Date(since))));
        }
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(d => ({
            ...formattedDoc<RemoteFingerboardSession>(d),
            activityType: 'fingerboarding' as const
        }));
        return { ok: true, data };
    } catch (e) {
        return handleFirestoreError(e);
    }
}

/**
 * @brief Delete a Fingerboard Session.
 *
 * @param id The session ID.
 * @returns {Promise<{ ok: boolean; error?: string }>}
 */
export async function deleteFingerboardSession(id: string): Promise<{ ok: boolean; error?: string }> {
    try {
        const uid = getCurrentUserId();
        if (!uid) return { ok: false, error: 'User not authenticated' };

        await deleteDoc(getUserDocRef('Fingerboarding', id));
        return { ok: true };
    } catch (e) {
        return handleFirestoreError(e);
    }
}

// ------------------------------------------------------------------
// Competition Sessions
// ------------------------------------------------------------------

/**
 * @brief Payload for creating or updating a Competition Session.
 */
export interface CompetitionSessionPayload {
    date: string;
    time: string;
    venue: string;
    customVenue?: string;
    type: string;
    fingerLoad?: number;
    shoulderLoad?: number;
    forearmLoad?: number;
    notes?: string;
    rounds: Array<{
        name: string;
        position?: number | null;
        climbs?: Array<{
            name: string;
            status: string;
            attemptCount: number;
            notes: string;
        }>;
    }>;
}

/**
 * @brief Competition Session object as returned from the API.
 */
export interface RemoteCompetitionSession extends CompetitionSessionPayload {
    id: string;
    createdAt: string;
    updatedAt: string;
    activityType: 'competition';
}

/**
 * @brief Create a new Competition Session.
 *
 * @param session The session data.
 * @returns {Promise<{ ok: boolean; id?: string; error?: string }>}
 */
export async function createCompetitionSession(session: CompetitionSessionPayload): Promise<{ ok: boolean; id?: string; error?: string }> {
    try {
        const uid = getCurrentUserId();
        if (!uid) return { ok: false, error: 'User not authenticated' };

        const id = generateSessionId(session.date, session.time, session.customVenue || session.venue);
        const docRef = getUserDocRef('Competitions', id);

        await setDoc(docRef, {
            ...sanitizePayload(session),
            activityType: 'competition',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        }, { merge: true });

        return { ok: true, id };
    } catch (e) {
        return handleFirestoreError(e);
    }
}

/**
 * @brief Update an existing Competition Session.
 *
 * @param id The session ID.
 * @param session The updated session data.
 * @returns {Promise<{ ok: boolean; error?: string }>}
 */
export async function updateCompetitionSession(id: string, session: CompetitionSessionPayload): Promise<{ ok: boolean; error?: string }> {
    try {
        const uid = getCurrentUserId();
        if (!uid) return { ok: false, error: 'User not authenticated' };

        const docRef = getUserDocRef('Competitions', id);
        await updateDoc(docRef, {
            ...sanitizePayload(session),
            updatedAt: Timestamp.now()
        });
        return { ok: true };
    } catch (e) {
        return handleFirestoreError(e);
    }
}

/**
 * @brief Fetch Competition Sessions.
 *
 * @param since Optional ISO date string to fetch only sessions updated after this date.
 * @returns {Promise<{ ok: boolean; data?: RemoteCompetitionSession[]; error?: string }>}
 */
export async function getCompetitionSessions(since?: string): Promise<{ ok: boolean; data?: RemoteCompetitionSession[]; error?: string }> {
    try {
        const uid = getCurrentUserId();
        if (!uid) return { ok: false, error: 'User not authenticated' };

        let q = query(getUserCollectionRef('Competitions'), orderBy('date', 'desc'));
        if (since) {
            q = query(getUserCollectionRef('Competitions'), where('updatedAt', '>', Timestamp.fromDate(new Date(since))));
        }
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(d => ({
            ...formattedDoc<RemoteCompetitionSession>(d),
            activityType: 'competition' as const
        }));
        return { ok: true, data };
    } catch (e) {
        return handleFirestoreError(e);
    }
}

/**
 * @brief Delete a Competition Session.
 *
 * @param id The session ID.
 * @returns {Promise<{ ok: boolean; error?: string }>}
 */
export async function deleteCompetitionSession(id: string): Promise<{ ok: boolean; error?: string }> {
    try {
        const uid = getCurrentUserId();
        if (!uid) return { ok: false, error: 'User not authenticated' };

        await deleteDoc(getUserDocRef('Competitions', id));
        return { ok: true };
    } catch (e) {
        return handleFirestoreError(e);
    }
}

// ------------------------------------------------------------------
// Gym Sessions
// ------------------------------------------------------------------

/**
 * @brief Payload for creating or updating a Gym Session.
 */
export interface GymSessionPayload {
    date: string;
    time: string;
    name: string;
    bodyweight?: number;
    trainingBlock?: 'Strength' | 'Power' | 'Power Endurance' | 'Muscular Endurance';
    notes?: string;
    exercises: Array<{
        id: string;
        name: string;
        notes?: string;
        linkedTo?: string;
        sets: Array<{
            weight: number;
            reps: number;
            isWarmup: boolean;
            isFailure: boolean;
            isDropSet: boolean;
            completed: boolean;
        }>;
    }>;
}

/**
 * @brief Gym Session object as returned from the API.
 */
export interface RemoteGymSession extends GymSessionPayload {
    id: string;
    createdAt: string;
    updatedAt: string;
    activityType: 'gym_session';
}

/**
 * @brief Create a new Gym Session.
 *
 * @param session The session data.
 * @returns {Promise<{ ok: boolean; id?: string; error?: string }>}
 */
export async function createGymSession(session: GymSessionPayload): Promise<{ ok: boolean; id?: string; error?: string }> {
    try {
        const uid = getCurrentUserId();
        if (!uid) return { ok: false, error: 'User not authenticated' };

        const id = generateSessionId(session.date, session.time, session.name);
        const docRef = getUserDocRef('Gym_Sessions', id);

        await setDoc(docRef, {
            ...sanitizePayload(session),
            activityType: 'gym_session',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        }, { merge: true });

        return { ok: true, id };
    } catch (e) {
        return handleFirestoreError(e);
    }
}

/**
 * @brief Update an existing Gym Session.
 *
 * @param id The session ID.
 * @param session The updated session data.
 * @returns {Promise<{ ok: boolean; error?: string }>}
 */
export async function updateGymSession(id: string, session: GymSessionPayload): Promise<{ ok: boolean; error?: string }> {
    try {
        const uid = getCurrentUserId();
        if (!uid) return { ok: false, error: 'User not authenticated' };

        const docRef = getUserDocRef('Gym_Sessions', id);
        await updateDoc(docRef, {
            ...sanitizePayload(session),
            updatedAt: Timestamp.now()
        });
        return { ok: true };
    } catch (e) {
        return handleFirestoreError(e);
    }
}

/**
 * @brief Fetch Gym Sessions.
 *
 * @param since Optional ISO date string to fetch only sessions updated after this date.
 * @returns {Promise<{ ok: boolean; data?: RemoteGymSession[]; error?: string }>}
 */
export async function getGymSessions(since?: string): Promise<{ ok: boolean; data?: RemoteGymSession[]; error?: string }> {
    try {
        const uid = getCurrentUserId();
        if (!uid) return { ok: false, error: 'User not authenticated' };

        let q = query(getUserCollectionRef('Gym_Sessions'), orderBy('date', 'desc'));
        if (since) {
            q = query(getUserCollectionRef('Gym_Sessions'), where('updatedAt', '>', Timestamp.fromDate(new Date(since))));
        }
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(d => ({
            ...formattedDoc<RemoteGymSession>(d),
            activityType: 'gym_session' as const
        }));
        return { ok: true, data };
    } catch (e) {
        return handleFirestoreError(e);
    }
}

/**
 * @brief Delete a Gym Session.
 *
 * @param id The session ID.
 * @returns {Promise<{ ok: boolean; error?: string }>}
 */
export async function deleteGymSession(id: string): Promise<{ ok: boolean; error?: string }> {
    try {
        const uid = getCurrentUserId();
        if (!uid) return { ok: false, error: 'User not authenticated' };

        await deleteDoc(getUserDocRef('Gym_Sessions', id));
        return { ok: true };
    } catch (e) {
        return handleFirestoreError(e);
    }
}

/**
 * @brief Check network connectivity.
 *
 * Helper primarily for legacy code compatibility, now largely handled by the SDK.
 * @returns {boolean} True if online, false otherwise.
 */
export function isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

// ------------------------------------------------------------------
// Timer Preferences
// ------------------------------------------------------------------

/**
 * @brief Payload for Timer Preferences.
 */
export interface TimerPreferencesPayload {
    workDuration: number;
    restDuration: number;
    allowOvertime: boolean;
}

/**
 * @brief Timer Preferences object as returned from the API.
 */
export interface RemoteTimerPreferences extends TimerPreferencesPayload {
    id: string; // exerciseId
    updatedAt: string;
}

/**
 * @brief Save Timer Preferences for a specific exercise.
 *
 * @param exerciseId The ID of the exercise.
 * @param preferences The preferences to save.
 * @returns {Promise<{ ok: boolean; error?: string }>}
 */
export async function saveTimerPreferences(exerciseId: string, preferences: TimerPreferencesPayload): Promise<{ ok: boolean; error?: string }> {
    try {
        const uid = getCurrentUserId();
        if (!uid) return { ok: false, error: 'User not authenticated' };

        const docRef = getUserDocRef('Timer_Preferences', exerciseId);
        await setDoc(docRef, {
            ...sanitizePayload(preferences),
            updatedAt: Timestamp.now()
        }, { merge: true });

        return { ok: true };
    } catch (e) {
        return handleFirestoreError(e);
    }
}

/**
 * @brief Get Timer Preferences for a specific exercise.
 *
 * @param exerciseId The ID of the exercise.
 * @returns {Promise<{ ok: boolean; data?: RemoteTimerPreferences; error?: string }>}
 */
export async function getTimerPreferences(exerciseId: string): Promise<{ ok: boolean; data?: RemoteTimerPreferences; error?: string }> {
    try {
        const uid = getCurrentUserId();
        if (!uid) return { ok: false, error: 'User not authenticated' };

        const docRef = getUserDocRef('Timer_Preferences', exerciseId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                ok: true,
                data: {
                    id: docSnap.id,
                    workDuration: data.workDuration,
                    restDuration: data.restDuration,
                    allowOvertime: data.allowOvertime,
                    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
                }
            };
        }
        return { ok: true, data: undefined }; // No prefs found
    } catch (e) {
        return handleFirestoreError(e);
    }
}


