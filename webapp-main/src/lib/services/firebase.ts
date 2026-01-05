import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firebaseConfig } from './firebaseConfig';

// Validate config
if (!firebaseConfig || !firebaseConfig.apiKey) {
    throw new Error('Firebase config is missing or invalid. Please check src/lib/services/firebaseConfig.ts');
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app, 'climbing-tracker-db');
export const auth = getAuth(app);
