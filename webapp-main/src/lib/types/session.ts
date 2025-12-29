/**
 * Data types for training sessions
 */

// Base session with sync tracking
export interface BaseSession {
    id: string;                    // Unique ID (UUID)
    activityType: string;          // indoor_climb, outdoor_climb, etc.
    date: string;                  // ISO date string (YYYY-MM-DD)
    createdAt: string;             // ISO timestamp
    updatedAt: string;             // ISO timestamp
    syncStatus: 'pending' | 'synced' | 'error';  // Sync state
    syncedAt?: string;             // When last successfully synced
}

// Climb entry in a session
export interface ClimbEntry {
    isSport: boolean;
    name: string;
    grade: string;
    attemptType: string;
    attemptsNum: number;
    notes: string;
}

// Indoor climbing session
export interface IndoorClimbSession extends BaseSession {
    activityType: 'indoor_climb';
    location: string;
    customLocation?: string;
    climbingType: string;         // Bouldering, Sport, Mixed
    trainingType: string;         // Projecting, Onsighting, Campusing, Repeaters
    difficulty?: string;          // Easy, Medium, Hard, Max, Limit+
    category?: string;            // None, Technique, Strength, Strength-endurance, Warm-up, Power
    energySystem?: string;        // Aerobic capacity, Aerobic lactic power, etc.
    techniqueFocus?: string;      // None, Double-clutch, Standing on volumes, Trusting feet
    wallAngle?: string;           // None, Overhang, Slab, Roof
    fingerLoad: number;           // 1-5
    shoulderLoad: number;         // 1-5
    forearmLoad: number;          // 1-5
    climbs: ClimbEntry[];
}

// Union of all session types
export type Session = IndoorClimbSession; // Add more as implemented: | OutdoorClimbSession | etc.
