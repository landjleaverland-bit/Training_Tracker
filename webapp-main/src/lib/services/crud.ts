/**
 * @file crud.ts
 * @brief Generic CRUD service factory for Firestore operations.
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
    type DocumentData,
    type CollectionReference,
    type DocumentReference
} from 'firebase/firestore';

export interface ApiResponse<T> {
    ok: boolean;
    data?: T;
    error?: string;
}

/**
 * @brief Helper to handle Firestore errors consistently.
 */
export function handleFirestoreError(e: unknown): ApiResponse<any> {
    console.error('Firestore Error:', e);
    return {
        ok: false,
        error: e instanceof Error ? e.message : 'Unknown Firestore error'
    };
}

/**
 * @brief Helper to convert Firestore dates (Timestamps) to ISO strings.
 */
export function formattedDoc<T>(docSnap: DocumentData): T {
    const data = docSnap.data();
    return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || new Date().toISOString(),
        date: data.date
    } as T;
}

/**
 * @brief Helper to remove undefined fields from payload.
 */
export function sanitizePayload<T>(payload: T): T {
    return JSON.parse(JSON.stringify(payload));
}

/**
 * @brief Helper to generate a deterministic session ID.
 */
export function generateSessionId(date: string, time: string, identifier: string): string {
    const cleanIdentifier = identifier.replace(/[^a-zA-Z0-9]/g, '_');
    return `${date}_${time.replace(':', '-')}_${cleanIdentifier}`;
}

/**
 * @brief Helper to get a reference to a user-specific collection.
 */
export function getUserCollectionRef(collectionName: string): CollectionReference {
    const uid = getCurrentUserId();
    if (!uid) throw new Error('User not authenticated');
    return collection(db, 'users', uid, collectionName);
}

/**
 * @brief Helper to get a reference to a specific document within a user's collection.
 */
export function getUserDocRef(collectionName: string, id: string): DocumentReference {
    const uid = getCurrentUserId();
    if (!uid) throw new Error('User not authenticated');
    return doc(db, 'users', uid, collectionName, id);
}

export interface BaseSessionPayload {
    date: string;
    time?: string;
}

export interface CrudConfig<TPayload extends BaseSessionPayload, TRemote> {
    collectionName: string;
    activityType: string;
    getIdentifier: (session: TPayload) => string;
}

/**
 * @brief Factory function to create a CRUD service for a specific session type.
 */
export function createCrudService<TPayload extends BaseSessionPayload, TRemote>(config: CrudConfig<TPayload, TRemote>) {

    async function create(session: TPayload): Promise<{ ok: boolean; id?: string; error?: string }> {
        try {
            const uid = getCurrentUserId();
            if (!uid) return { ok: false, error: 'User not authenticated' };

            const id = generateSessionId(session.date, session.time || '12:00', config.getIdentifier(session));
            const docRef = getUserDocRef(config.collectionName, id);

            await setDoc(docRef, {
                ...sanitizePayload(session), // Sanitize undefined values
                activityType: config.activityType,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            }, { merge: true });

            return { ok: true, id };
        } catch (e) {
            return handleFirestoreError(e);
        }
    }

    async function update(id: string, session: TPayload): Promise<{ ok: boolean; error?: string }> {
        try {
            const uid = getCurrentUserId();
            if (!uid) return { ok: false, error: 'User not authenticated' };

            const docRef = getUserDocRef(config.collectionName, id);
            await updateDoc(docRef, {
                ...sanitizePayload(session), // Sanitize undefined values
                updatedAt: Timestamp.now()
            } as any);
            return { ok: true };
        } catch (e) {
            return handleFirestoreError(e);
        }
    }

    async function get(since?: string): Promise<{ ok: boolean; data?: TRemote[]; error?: string }> {
        try {
            const uid = getCurrentUserId();
            if (!uid) return { ok: false, error: 'User not authenticated' };

            let q = query(getUserCollectionRef(config.collectionName), orderBy('date', 'desc'));

            if (since) {
                q = query(getUserCollectionRef(config.collectionName), where('updatedAt', '>', Timestamp.fromDate(new Date(since))));
            }

            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(d => ({
                ...formattedDoc<TRemote>(d),
                activityType: config.activityType as any // Force strict type for the consumer
            }));
            return { ok: true, data };
        } catch (e) {
            return handleFirestoreError(e);
        }
    }

    async function remove(id: string): Promise<{ ok: boolean; error?: string }> {
        try {
            const uid = getCurrentUserId();
            if (!uid) return { ok: false, error: 'User not authenticated' };

            await deleteDoc(getUserDocRef(config.collectionName, id));
            return { ok: true };
        } catch (e) {
            return handleFirestoreError(e);
        }
    }

    return { create, update, get, delete: remove };
}
