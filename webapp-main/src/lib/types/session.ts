/**
 * @file session.ts
 * @brief Data types and interfaces for the application's training sessions.
 *
 * Defines the shape of data stored in Firestore and used throughout the application.
 */

/**
 * @brief Base session interface with common properties.
 *
 * All specific session types extend this interface.
 */
export interface BaseSession {
    /** Unique ID (UUID format). */
    id: string;
    /** Discriminator for session type (e.g., 'indoor_climb', 'outdoor_climb'). */
    activityType: string;
    /** Date string in ISO format (YYYY-MM-DD). */
    date: string;
    /** Time string (HH:mm). Optional for legacy records. */
    time?: string;
    /** ISO timestamp for creation time. */
    createdAt: string;
    /** ISO timestamp for last update. */
    updatedAt: string;
    /** offline sync status. managed by service worker/local DB logic. */
    syncStatus: 'pending' | 'synced' | 'error';
    /** Timestamp of last successful sync. */
    syncedAt?: string;
}

/**
 * @brief Represents a single climb within a session.
 */
export interface ClimbEntry {
    /** True if Sport/Lead, False if Bouldering. */
    isSport: boolean;
    /** Name of the climb or route. */
    name: string;
    /** Climbing grade (e.g., "V4", "7a"). */
    grade: string;
    /** Type of attempt (e.g., "Flash", "Redpoint"). */
    attemptType: string;
    /** Number of attempts made. */
    attemptsNum: number;
    /** Specific notes for this climb. */
    notes: string;
    /** Wall identifier (gym specific). */
    wall?: string;
    /** Technical focus for this climb. */
    techniqueFocus?: string;
}

/**
 * @brief Indoor climbing session payload.
 */
export interface IndoorClimbSession extends BaseSession {
    activityType: 'indoor_climb';
    /** Name of the gym/location. */
    location: string;
    /** Custom location name if 'Other' is selected. */
    customLocation?: string;
    /** General type: Bouldering, Sport, Mixed. */
    climbingType: string;
    /** Focus types: Projecting, Onsighting, Campusing, Repeaters, etc. */
    trainingTypes: string[];
    /** Perceived difficulty: Easy, Medium, Hard, Max, Limit+. */
    difficulty?: string;
    /** Training categories targeted. */
    categories?: string[];
    /** Energy systems targeted (e.g., Aerobic capacity). */
    energySystems?: string[];
    /** Wall angles used (Deprecrated in favor of per-climb or general notes in some contexts, still present in specific forms). */
    wallAngles?: string[];
    /** Subjective Finger load (1-5). */
    fingerLoad: number;
    /** Subjective Shoulder load (1-5). */
    shoulderLoad: number;
    /** Subjective Forearm load (1-5). */
    forearmLoad: number;
    /** Volume of Open Hand grip usage (1-5). */
    openGrip: number;
    /** Volume of Crimp grip usage (1-5). */
    crimpGrip: number;
    /** Volume of Pinch grip usage (1-5). */
    pinchGrip: number;
    /** Volume of Sloper grip usage (1-5). */
    sloperGrip: number;
    /** Volume of Jug grip usage (1-5). */
    jugGrip: number;
    /** List of individual climbs logged. */
    climbs: ClimbEntry[];
    /** General session notes. */
    notes?: string;
}

/**
 * @brief Outdoor climbing session payload.
 */
export interface OutdoorClimbSession extends BaseSession {
    activityType: 'outdoor_climb';
    /** Geographic area (e.g., Portland). */
    area: string;
    /** Specific Crag name. */
    crag: string;
    /** Specific Sector name (optional). */
    sector?: string;
    /** Climbing type: Boulder, Sport, Trad. */
    climbingType: string;
    trainingTypes: string[];
    difficulty?: string;
    categories?: string[];
    energySystems?: string[];
    wallAngles?: string[];
    fingerLoad: number;
    shoulderLoad: number;
    forearmLoad: number;
    openGrip: number;
    crimpGrip: number;
    pinchGrip: number;
    sloperGrip: number;
    jugGrip: number;
    climbs: ClimbEntry[];
    notes?: string;
}

/**
 * @brief Detail set for a fingerboard exercise.
 */
export interface ExerciseSet {
    /** Weight added or removed (kg). */
    weight: number;
    /** Duration in seconds or number of repetitions. */
    reps: number;
}

/**
 * @brief Fingerboard exercise entry.
 */
export interface FingerboardExercise {
    id: string;
    name: string;
    gripType: string;
    /** Number of sets performed. */
    sets: number;
    /** Breakdown of each set. */
    details: ExerciseSet[];
    notes: string;
}

/**
 * @brief Fingerboard session payload.
 */
export interface FingerboardSession extends BaseSession {
    activityType: 'fingerboarding';
    location: string;
    exercises: FingerboardExercise[];
    fingerLoad?: number;
    shoulderLoad?: number;
    forearmLoad?: number;
    openGrip?: number;
    crimpGrip?: number;
    pinchGrip?: number;
    sloperGrip?: number;
    jugGrip?: number;
    notes?: string;
}

/**
 * @brief Result of a single climb in a competition.
 */
export interface CompetitionClimbResult {
    name: string;
    status: 'Flash' | 'Top' | 'Zone' | 'Attempt';
    attemptCount: number;
    notes: string;
}

/**
 * @brief A round within a competition (e.g., Qualifiers, Finals).
 */
export interface CompetitionRound {
    name: string;
    /** Ranking/Position achieved in this round. */
    position?: number | null;
    /** List of climbs attempted in this round. */
    climbs?: CompetitionClimbResult[];
}

/**
 * @brief Competition session payload.
 */
export interface CompetitionSession extends BaseSession {
    activityType: 'competition';
    venue: string;
    customVenue?: string;
    type: 'Bouldering' | 'Lead' | 'Speed';
    fingerLoad?: number;
    shoulderLoad?: number;
    forearmLoad?: number;
    rounds: CompetitionRound[];
    notes?: string;
}

/**
 * @brief Set details for a Gym exercise.
 */
export interface GymSet {
    /** Weight used (kg or lbs). */
    weight: number;
    /** Number of repetitions. */
    reps: number;
    /** Is this a warmup set? */
    isWarmup: boolean;
    /** Was failure reached? */
    isFailure: boolean;
    /** Is this a drop set? */
    isDropSet: boolean;
    /** Marked as completed by user. */
    completed: boolean;
}

/**
 * @brief Gym exercise entry.
 */
export interface GymExercise {
    /** Unique ID within session. */
    id: string;
    /** Exercise name (e.g., "Barbell Squat"). */
    name: string;
    /** Sets details. */
    sets: GymSet[];
    notes?: string;
    /** ID of another exercise if supersetted. */
    linkedTo?: string;
    /** Perceived difficulty color code. */
    difficulty?: 'Green' | 'Yellow' | 'Orange' | 'Red';
}

/**
 * @brief Gym session payload (Weightlifting/Strength).
 */
export interface GymSession extends BaseSession {
    activityType: 'gym_session';
    /** Name of the workout (e.g., "Leg Day"). */
    name: string;
    exercises: GymExercise[];
    /** Bodyweight at time of session. */
    bodyweight?: number;
    /** Periodization block. */
    trainingBlock?: 'Strength' | 'Power' | 'Power Endurance' | 'Muscular Endurance';
    notes?: string;
}

/**
 * @brief Union of all possible session types.
 */
export type Session = IndoorClimbSession | OutdoorClimbSession | FingerboardSession | CompetitionSession | GymSession;

