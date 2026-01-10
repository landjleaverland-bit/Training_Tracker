import { db } from './firebase';
import { getCurrentUserId } from './auth';
import {
    collection,
    setDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    query,
    where,
    orderBy,
    Timestamp,
    type DocumentData
} from 'firebase/firestore';

/**
 * Standardized response wrapper to match existing app architecture
 */
interface ApiResponse<T> {
    ok: boolean;
    data?: T;
    error?: string;
}

/**
 * Helper to handle Firestore errors
 */
function handleFirestoreError(e: unknown): ApiResponse<any> {
    console.error('Firestore Error:', e);
    return {
        ok: false,
        error: e instanceof Error ? e.message : 'Unknown Firestore error'
    };
}

/**
 * Helper to convert Firestore dates (Timestamps) to ISO strings
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
 * Helper to get user-specific collection
 */
function getUserCollectionRef(collectionName: string) {
    const uid = getCurrentUserId();
    if (!uid) throw new Error('User not authenticated');
    return collection(db, 'users', uid, collectionName);
}

/**
 * Helper to get user-specific document
 */
function getUserDocRef(collectionName: string, id: string) {
    const uid = getCurrentUserId();
    if (!uid) throw new Error('User not authenticated');
    return doc(db, 'users', uid, collectionName, id);
}

/**
 * Helper to remove undefined fields from payload (Firestore rejects undefined)
 */
function sanitizePayload<T>(payload: T): T {
    // efficient way to remove undefined values
    return JSON.parse(JSON.stringify(payload));
}

/**
 * Helper to generate deterministic session ID
 * Format: YYYY-MM-DD_HH-mm_Identifier
 */
function generateSessionId(date: string, time: string, identifier: string): string {
    const cleanIdentifier = identifier.replace(/[^a-zA-Z0-9]/g, '_');
    return `${date}_${time.replace(':', '-')}_${cleanIdentifier}`;
}

// ------------------------------------------------------------------
// Indoor Sessions
// ------------------------------------------------------------------

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

export interface RemoteIndoorSession extends IndoorSessionPayload {
    id: string;
    createdAt: string;
    updatedAt: string;
    activityType: 'indoor_climb';
}

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

export interface RemoteOutdoorSession extends OutdoorSessionPayload {
    id: string;
    createdAt: string;
    updatedAt: string;
    activityType: 'outdoor_climb';
}

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

export interface RemoteFingerboardSession extends FingerboardSessionPayload {
    id: string;
    createdAt: string;
    updatedAt: string;
    activityType: 'fingerboarding';
}

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

export interface RemoteCompetitionSession extends CompetitionSessionPayload {
    id: string;
    createdAt: string;
    updatedAt: string;
    activityType: 'competition';
}

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

export interface GymSessionPayload {
    date: string;
    time: string;
    name: string;
    bodyweight?: number;
    trainingBlock?: 'Strength' | 'Power' | 'Power Endurance' | 'Muscular Endurance';
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

export interface RemoteGymSession extends GymSessionPayload {
    id: string;
    createdAt: string;
    updatedAt: string;
    activityType: 'gym_session';
}

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
 * Check connectivity - largely handled by SDK but helper provided for existing code compatibility
 */
export function isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
}


