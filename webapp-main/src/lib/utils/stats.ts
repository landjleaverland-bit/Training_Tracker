import * as d3 from 'd3';
import type { Session, IndoorClimbSession, OutdoorClimbSession, FingerboardSession } from '$lib/types/session';

// --- Types ---

export interface ChartDataPoint {
    label: string;
    value: number;
    color?: string;
}

export interface TimeSeriesPoint {
    date: Date;
    value: number;
    series: string; // e.g., "Crimp", "Sloper", "Training"
}

// --- Helpers ---

const isClimbing = (s: Session): boolean =>
    (s.activityType === 'indoor_climb' || s.activityType === 'outdoor_climb' || s.activityType === 'competition') && isValidDate(s.date);

const isFingerboard = (s: Session): boolean =>
    s.activityType === 'fingerboarding' && isValidDate(s.date);

const isValidDate = (dateStr: string): boolean => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d instanceof Date && !isNaN(d.getTime());
};

const getSessionDate = (s: Session): Date => new Date(s.date);

// --- 1. General Activity & Volume ---

export function getClimbingVsRestStats(sessions: Session[], dateRange?: { start: Date, end: Date }): ChartDataPoint[] {
    // Filter for valid dates first
    const validSessions = sessions.filter(s => isValidDate(s.date));
    if (validSessions.length === 0) return [];

    let firstDate: Date;
    let lastDate: Date;

    if (dateRange) {
        firstDate = new Date(dateRange.start);
        lastDate = new Date(dateRange.end);
    } else {
        const sorted = [...validSessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        firstDate = new Date(sorted[0].date);
        lastDate = new Date(); // Today
    }

    // Calculate total days in range
    const msPerDay = 1000 * 60 * 60 * 24;

    // Ensure we count inclusive of both start and end, and handle time of day
    firstDate.setHours(0, 0, 0, 0);
    lastDate.setHours(23, 59, 59, 999);

    const totalDays = Math.ceil((lastDate.getTime() - firstDate.getTime()) / msPerDay);

    // Count climbing days (unique dates where activity is climb)
    // Filter sessions to ensure they are within range (though sessions passed in should ideally be filtered already, 
    // strictly enforcing range helps if mixed data is passed)
    const climbingDays = new Set(
        sessions
            .filter(s => {
                if (!isClimbing(s)) return false;
                if (!dateRange) return true;
                const d = new Date(s.date);
                return d >= firstDate && d <= lastDate;
            })
            .map(s => s.date.split('T')[0])
    ).size;

    const restDays = Math.max(0, totalDays - climbingDays);

    return [
        { label: 'Climbing Days', value: climbingDays, color: '#4A9B9B' },
        { label: 'Rest Days', value: restDays, color: '#E5E7EB' }
    ];
}

export function getFingerboardingConsistency(sessions: Session[], dateRange?: { start: Date, end: Date }): ChartDataPoint[] {
    // Filter for valid dates first
    const validSessions = sessions.filter(s => isValidDate(s.date));
    if (validSessions.length === 0) return [];

    let firstDate: Date;
    let lastDate: Date;

    if (dateRange) {
        firstDate = new Date(dateRange.start);
        lastDate = new Date(dateRange.end);
    } else {
        const sorted = [...validSessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        firstDate = new Date(sorted[0].date);
        lastDate = new Date();
    }

    const msPerDay = 1000 * 60 * 60 * 24;
    firstDate.setHours(0, 0, 0, 0);
    lastDate.setHours(23, 59, 59, 999);

    const totalDays = Math.ceil((lastDate.getTime() - firstDate.getTime()) / msPerDay);

    const fbDays = new Set(
        sessions
            .filter(s => {
                if (!isFingerboard(s)) return false;
                if (!dateRange) return true;
                const d = new Date(s.date);
                return d >= firstDate && d <= lastDate;
            })
            .map(s => s.date.split('T')[0])
    ).size;

    return [
        { label: 'Fingerboarding', value: fbDays, color: '#F4C430' },
        { label: 'No Fingerboarding', value: Math.max(0, totalDays - fbDays), color: '#E5E7EB' }
    ];
}

export function getSessionTypeBreakdown(sessions: Session[]): ChartDataPoint[] {
    const counts: Record<string, number> = {};

    sessions.forEach(s => {
        if (!s.activityType) return;

        let typeLabel = formatActivityType(s.activityType);

        // Refine climbing types
        if (s.activityType === 'indoor_climb' || s.activityType === 'outdoor_climb') {
            const climb = s as IndoorClimbSession | OutdoorClimbSession;
            typeLabel = `${s.activityType === 'indoor_climb' ? 'Indoor' : 'Outdoor'} ${climb.climbingType || 'Climb'}`;
        }

        counts[typeLabel] = (counts[typeLabel] || 0) + 1;
    });

    return Object.entries(counts).map(([label, value]) => ({ label, value }));
}

function formatActivityType(type: string): string {
    if (!type) return 'Unknown';
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}


// --- 2. Training System Breakdown ---

export function getTrainingSystemStats(sessions: Session[]): ChartDataPoint[] {
    const systems: Record<string, number> = {};

    sessions.forEach(s => {
        const climb = s as IndoorClimbSession | OutdoorClimbSession;
        if (climb.energySystems) {
            climb.energySystems.forEach(sys => {
                systems[sys] = (systems[sys] || 0) + 1;
            });
        }
    });

    return Object.entries(systems)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value);
}

const FRENCH_TO_HUECO: Record<string, string> = {
    '3': 'V-easy',
    '4-': 'V0-',
    '4': 'V0',
    '4+': 'V0+',
    '5': 'V1',
    '5+': 'V2',
    '6A': 'V3',
    '6A+': 'V3',
    '6B': 'V4',
    '6B+': 'V4',
    '6C': 'V5',
    '6C+': 'V5',
    '7A': 'V6',
    '7A+': 'V7',
    '7B': 'V8',
    '7B+': 'V8+',
    '7C': 'V9',
    '7C+': 'V10',
    '8A': 'V11',
    '8A+': 'V12',
    '8B': 'V13',
    '8B+': 'V14',
    '8C': 'V15',
    '8C+': 'V16',
    '9A': 'V17'
};

const HUECO_TO_FRENCH: Record<string, string> = Object.entries(FRENCH_TO_HUECO).reduce((acc, [french, hueco]) => {
    acc[hueco] = french;
    return acc;
}, {} as Record<string, string>);

// --- 3. Performance Grade Pyramids ---
export function getGradeStats(sessions: Session[], type: 'boulder' | 'lead', location: 'indoor' | 'outdoor' | 'all' = 'all'): ChartDataPoint[] {
    // Structure: Grade -> { total: number, flash: number, redpoint: number, dogged: number, dnf: number }
    const grades: Record<string, { total: number, flash: number, redpoint: number, dogged: number, dnf: number }> = {};

    sessions.forEach(s => {
        if (!isClimbing(s)) return;

        // Filter by location
        if (location === 'indoor' && s.activityType !== 'indoor_climb') return;
        if (location === 'outdoor' && s.activityType !== 'outdoor_climb') return;

        const climbSession = s as IndoorClimbSession | OutdoorClimbSession;

        climbSession.climbs?.forEach(c => {
            // Check for explicit climbing type, otherwise fallback to isSport
            let isBoulderItem = !c.isSport;
            let isLeadItem = c.isSport;

            // Cast to any to check for climbingType that might exist in data but not type definition
            const typeTag = (c as any).climbingType;
            if (typeTag) {
                if (typeTag === 'Boulder') {
                    isBoulderItem = true;
                    isLeadItem = false;
                } else if (['Sport', 'Trad', 'Lead'].includes(typeTag)) {
                    isBoulderItem = false;
                    isLeadItem = true;
                }
            }

            // Normalize grade case (v2 -> V2)
            let gradeKey = c.grade.toUpperCase();

            // Apply conversions if it's a boulder grade
            if (type === 'boulder' && isBoulderItem) {
                // If it's a known French grade, convert it
                if (FRENCH_TO_HUECO[gradeKey]) {
                    gradeKey = FRENCH_TO_HUECO[gradeKey];
                }
            }

            // Apply conversions if it's a lead grade (Sport)
            if (type === 'lead' && isLeadItem) {
                // If it's a known Hueco grade, convert it to French
                if (HUECO_TO_FRENCH[gradeKey]) {
                    gradeKey = HUECO_TO_FRENCH[gradeKey];
                }
            }

            // Determine specific type
            if ((type === 'lead' && isLeadItem) || (type === 'boulder' && isBoulderItem)) {
                if (!grades[gradeKey]) {
                    grades[gradeKey] = { total: 0, flash: 0, redpoint: 0, dogged: 0, dnf: 0 };
                }

                grades[gradeKey].total++;

                const attempt = c.attemptType ? c.attemptType.trim().toLowerCase() : '';

                if (['flash', 'onsight'].includes(attempt)) {
                    grades[gradeKey].flash++;
                } else if (attempt === 'redpoint') {
                    grades[gradeKey].redpoint++;
                } else if (attempt === 'dogged') {
                    grades[gradeKey].dogged++;
                } else if (attempt === 'dnf') {
                    grades[gradeKey].dnf++;
                } else {
                    // Fallback for unknown types (count as redpoint? or just ignore breakdown but keep usage in total?)
                    // Let's count as redpoint for backward compatibility if "attemptType" is missing or odd
                    grades[gradeKey].redpoint++;
                }
            }
        });
    });

    return Object.entries(grades)
        .map(([label, stats]) => ({
            label,
            value: stats.total,
            flashCount: stats.flash,
            redpointCount: stats.redpoint,
            doggedCount: stats.dogged,
            dnfCount: stats.dnf
        }))
        .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
}

// --- 4. Venue & Location ---

export function getIndoorLocationStats(sessions: Session[]): ChartDataPoint[] {
    const locs: Record<string, number> = {};
    sessions.forEach(s => {
        if (s.activityType === 'indoor_climb') {
            const loc = (s as IndoorClimbSession).location;
            if (loc) locs[loc] = (locs[loc] || 0) + 1;
        }
    });

    return Object.entries(locs).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

export function getOutdoorCragStats(sessions: Session[]): ChartDataPoint[] {
    const crags: Record<string, number> = {};
    sessions.forEach(s => {
        if (s.activityType === 'outdoor_climb') {
            const crag = (s as OutdoorClimbSession).crag;
            if (crag) crags[crag] = (crags[crag] || 0) + 1;
        }
    });

    return Object.entries(crags).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

export function getOutdoorAreaStats(sessions: Session[]): ChartDataPoint[] {
    const areas: Record<string, number> = {};
    sessions.forEach(s => {
        if (s.activityType === 'outdoor_climb') {
            const area = (s as OutdoorClimbSession).area;
            if (area) areas[area] = (areas[area] || 0) + 1;
        }
    });

    return Object.entries(areas).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

// --- 5. Periodization (Time Series) ---

export function getWeeklyLoadStats(sessions: Session[]): TimeSeriesPoint[] {
    // Group by week
    const weeks: Record<string, number> = {};
    const weekFormat = d3.timeFormat("%Y-%W");

    sessions.forEach(s => {
        const date = getSessionDate(s);
        const weekKey = weekFormat(date); // e.g., "2024-05"

        // Calculate abstract load (sum of finger/shoulder/forearm load)
        let load = 0;
        if (isClimbing(s)) {
            const c = s as IndoorClimbSession; // or Outdoor, fields satisfy structural shape
            load = (c.fingerLoad || 0) + (c.shoulderLoad || 0) + (c.forearmLoad || 0);
        } else if (s.activityType === 'competition') {
            const c = s as unknown as any; // CompetitionSession
            load = (c.fingerLoad || 0) + (c.shoulderLoad || 0) + (c.forearmLoad || 0);
        }

        weeks[weekKey] = (weeks[weekKey] || 0) + load;
    });

    // Convert back to array
    const weekParse = d3.timeParse("%Y-%W");
    return Object.entries(weeks).map(([key, value]) => ({
        date: weekParse(key) || new Date(),
        value,
        series: 'Total Load'
    })).sort((a, b) => a.date.getTime() - b.date.getTime());
}

// --- 6. Finger Strength & Grip Load ---

export function getMaxHangStats(sessions: Session[]): TimeSeriesPoint[] {
    const points: TimeSeriesPoint[] = [];

    sessions.filter(isFingerboard).forEach(s => {
        const fb = s as FingerboardSession;
        const date = getSessionDate(fb);

        fb.exercises.forEach(ex => {
            const maxWeight = Math.max(...ex.details.map(set => set.weight));
            if (maxWeight > 0) {
                points.push({
                    date,
                    value: maxWeight,
                    series: ex.gripType
                });
            }
        });
    });

    return points.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function getGripLoadStats(sessions: Session[]): TimeSeriesPoint[] {
    const weeks: Record<string, Record<string, number>> = {}; // week -> series -> value
    const weekFormat = d3.timeFormat("%Y-%W");

    sessions.filter(isClimbing).forEach(s => {
        const c = s as IndoorClimbSession; // Shape compatible for grip fields
        const date = getSessionDate(c);
        const weekKey = weekFormat(date);

        if (!weeks[weekKey]) weeks[weekKey] = {};

        // Aggregate loads (Summing them for "Weekly Load")
        if (c.crimpGrip) weeks[weekKey]['Crimp'] = (weeks[weekKey]['Crimp'] || 0) + c.crimpGrip;
        if (c.openGrip) weeks[weekKey]['Open Hand'] = (weeks[weekKey]['Open Hand'] || 0) + c.openGrip;
        if (c.pinchGrip) weeks[weekKey]['Pinch'] = (weeks[weekKey]['Pinch'] || 0) + c.pinchGrip;
        if (c.sloperGrip) weeks[weekKey]['Sloper'] = (weeks[weekKey]['Sloper'] || 0) + c.sloperGrip;
        if (c.jugGrip) weeks[weekKey]['Jug'] = (weeks[weekKey]['Jug'] || 0) + c.jugGrip;
    });

    const parsedData: TimeSeriesPoint[] = [];
    const weekParse = d3.timeParse("%Y-%W");

    Object.entries(weeks).forEach(([weekKey, seriesData]) => {
        const date = weekParse(weekKey) || new Date();
        Object.entries(seriesData).forEach(([series, value]) => {
            parsedData.push({ date, value, series });
        });
    });

    return parsedData.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function getRecruitmentStats(sessions: Session[]): TimeSeriesPoint[] {
    const points: TimeSeriesPoint[] = [];

    sessions.filter(isFingerboard).forEach(s => {
        const fb = s as FingerboardSession;
        const date = getSessionDate(fb);

        fb.exercises.forEach(ex => {
            if (ex.name === 'Recruitment Pulls') {
                const maxWeight = Math.max(...ex.details.map(set => set.weight));
                if (maxWeight > 0) {
                    points.push({
                        date,
                        value: maxWeight,
                        series: 'Recruitment Pulls'
                    });
                }
            }
        });
    });

    return points.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function getMaxPickupStats(sessions: Session[]): TimeSeriesPoint[] {
    const points: TimeSeriesPoint[] = [];

    sessions.filter(isFingerboard).forEach(s => {
        const fb = s as FingerboardSession;
        const date = getSessionDate(fb);

        fb.exercises.forEach(ex => {
            if (ex.name === 'Max pick-ups') {
                const maxWeight = Math.max(...ex.details.map(set => set.weight));
                if (maxWeight > 0) {
                    points.push({
                        date,
                        value: maxWeight,
                        series: 'Max pick-ups'
                    });
                }
            }
        });
    });

    return points.sort((a, b) => a.date.getTime() - b.date.getTime());
}

// --- 7. Generic Load Tracking ---

export function movingAverage(data: TimeSeriesPoint[], windowSize: number): TimeSeriesPoint[] {
    if (data.length === 0) return [];

    // Sort just in case
    const sorted = [...data].sort((a, b) => a.date.getTime() - b.date.getTime());
    const averaged: TimeSeriesPoint[] = [];

    for (let i = 0; i < sorted.length; i++) {
        const start = Math.max(0, i - windowSize + 1);
        const windowSlice = sorted.slice(start, i + 1);
        const sum = windowSlice.reduce((acc, curr) => acc + curr.value, 0);
        const avg = sum / windowSlice.length;

        averaged.push({
            date: sorted[i].date,
            value: avg,
            series: `${sorted[i].series} (Avg)`
        });
    }

    return averaged;
}

export function getLoadStats(
    sessions: Session[],
    filterFn: (s: Session) => boolean,
    metricFn: (s: Session) => number,
    seriesName: string,
    groupBy: 'week' | 'day' = 'week',
    dateRange?: { start: Date, end: Date }
): TimeSeriesPoint[] {
    const groups: Record<string, number> = {};
    const format = groupBy === 'week' ? d3.timeFormat("%Y-%W") : d3.timeFormat("%Y-%m-%d");

    // 1. Populate with actual data
    sessions.forEach(s => {
        // First check if session matches the criteria (e.g. is Indoor Climb)
        if (!filterFn(s)) return;

        const date = getSessionDate(s);
        const key = format(date);

        // Then extract the metric (e.g. 1 for count, or s.fingerLoad for specific load)
        const val = Number(metricFn(s)) || 0;

        groups[key] = (groups[key] || 0) + val;
    });

    // 2. Zero-fill if range is provided
    if (dateRange) {
        let current = new Date(dateRange.start);
        const end = new Date(dateRange.end);

        // Normalize start to beginning of day to avoid infinite loops with time offsets
        current.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        // Safety break: don't loop more than 366 * 10 iterations
        let iterations = 0;
        const maxIterations = 4000;

        while (current <= end && iterations < maxIterations) {
            const key = format(current);
            // Only set if not already present (preserve actual data)
            if (groups[key] === undefined) {
                groups[key] = 0;
            }
            // Increment by 1 day
            current.setDate(current.getDate() + 1);
            iterations++;
        }
    }

    const parse = groupBy === 'week' ? d3.timeParse("%Y-%W") : d3.timeParse("%Y-%m-%d");

    return Object.entries(groups).map(([key, value]) => ({
        date: parse(key) || new Date(),
        value,
        series: seriesName
    })).sort((a, b) => a.date.getTime() - b.date.getTime());
}

