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

// Outdoor climbing session
export interface OutdoorClimbSession extends BaseSession {
    activityType: 'outdoor_climb';
    area: string;                 // e.g., Portland, Swanage
    crag: string;                 // e.g., Blacknor North, Dancing Ledge
    sector?: string;              // e.g., Diamond Slab (optional text)
    climbingType: string;         // Boulder, Sport, Trad
    trainingType: string;         // Projecting, Onsighting, etc.
    difficulty?: string;
    category?: string;
    energySystem?: string;
    techniqueFocus?: string;
    fingerLoad: number;
    shoulderLoad: number;
    forearmLoad: number;
    climbs: ClimbEntry[];
}

// Fingerboarding session
export interface ExerciseSet {
    weight: number;
    reps: number;
}

export interface FingerboardExercise {
    id: string;
    name: string;
    gripType: string;
    sets: number;
    details: ExerciseSet[];
    notes: string;
}

export interface FingerboardSession extends BaseSession {
    activityType: 'fingerboarding';
    location: string;
    exercises: FingerboardExercise[];
}

// Competition session
export interface CompetitionClimbResult {
    name: string;
    status: 'Flash' | 'Top' | 'Zone' | 'Attempt';
    attemptCount: number;
    notes: string;
}

export interface CompetitionRound {
    name: string;
    position?: number | null;
    climbs?: CompetitionClimbResult[];
}

export interface CompetitionSession extends BaseSession {
    activityType: 'competition';
    venue: string;
    customVenue?: string;
    type: 'Bouldering' | 'Lead' | 'Speed';
    fingerLoad?: number;
    shoulderLoad?: number;
    forearmLoad?: number;
    rounds: CompetitionRound[];
}

// Union of all session types
export type Session = IndoorClimbSession | OutdoorClimbSession | FingerboardSession | CompetitionSession;

