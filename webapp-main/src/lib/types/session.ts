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
    wall?: string;
}

// Indoor climbing session
export interface IndoorClimbSession extends BaseSession {
    activityType: 'indoor_climb';
    location: string;
    customLocation?: string;
    climbingType: string;         // Bouldering, Sport, Mixed
    trainingTypes: string[];      // Projecting, Onsighting, Campusing, Repeaters
    difficulty?: string;          // Easy, Medium, Hard, Max, Limit+
    categories?: string[];        // None, Technique, Strength, Strength-endurance, Power, Strength Capacity, Power Capacity
    energySystems?: string[];     // Aerobic capacity, Aerobic lactic power, etc.
    techniqueFocuses?: string[];  // None, Double-clutch, Standing on volumes, Trusting feet
    // WallAngles removed - now per climb
    fingerLoad: number;           // 1-5
    shoulderLoad: number;         // 1-5
    forearmLoad: number;          // 1-5
    openGrip: number;             // 1-5
    crimpGrip: number;            // 1-5
    pinchGrip: number;            // 1-5
    sloperGrip: number;           // 1-5
    jugGrip: number;              // 1-5
    climbs: ClimbEntry[];
}

// Outdoor climbing session
export interface OutdoorClimbSession extends BaseSession {
    activityType: 'outdoor_climb';
    area: string;                 // e.g., Portland, Swanage
    crag: string;                 // e.g., Blacknor North, Dancing Ledge
    sector?: string;              // e.g., Diamond Slab (optional text)
    climbingType: string;         // Boulder, Sport, Trad
    trainingTypes: string[];      // Projecting, Onsighting, etc.
    difficulty?: string;
    categories?: string[];
    energySystems?: string[];
    techniqueFocuses?: string[];
    fingerLoad: number;
    shoulderLoad: number;
    forearmLoad: number;
    openGrip: number;
    crimpGrip: number;
    pinchGrip: number;
    sloperGrip: number;
    jugGrip: number;
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

// Gym session (Strong/Hevy style)
export interface GymSet {
    weight: number;      // kg or lbs based on user pref (store as number)
    reps: number;
    isWarmup: boolean;
    isFailure: boolean;
    isDropSet: boolean;
    completed: boolean;  // If the user checked it off
}

export interface GymExercise {
    id: string;          // Unique ID for this exercise instance in the session
    name: string;        // "Barbell Squat"
    sets: GymSet[];
    notes?: string;
    linkedTo?: string;   // ID of another exercise if supersetted
    difficulty?: 'Green' | 'Yellow' | 'Orange' | 'Red';
}

export interface GymSession extends BaseSession {
    activityType: 'gym_session';
    name: string;        // e.g., "Leg Day", "Push A"
    exercises: GymExercise[];
    bodyweight?: number; // Optional bodyweight at time of session
    trainingBlock?: 'Strength' | 'Power' | 'Power Endurance' | 'Muscular Endurance';
}

// Union of all session types
export type Session = IndoorClimbSession | OutdoorClimbSession | FingerboardSession | CompetitionSession | GymSession;

