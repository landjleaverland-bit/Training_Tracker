import { describe, it, expect } from 'vitest';
import type { Session } from '$lib/types/session';
import {
    getClimbingTypeBreakdown,
    getGymSessionTypeBreakdown,
    getFingerboardSessionTypeBreakdown,
    getCampusWallTypeBreakdown,
    getCompetitionTypeBreakdown,
    getCategoryColor
} from './stats';

describe('Stats aggregation breakdowns', () => {
    it('getClimbingTypeBreakdown groups Lead and Sport for indoor climb but not for outdoor climb', () => {
        const mockSessions = [
            {
                id: '1',
                activityType: 'indoor_climb',
                date: '2026-06-10',
                climbingType: 'Boulder',
                createdAt: '',
                updatedAt: '',
                syncStatus: 'synced',
                climbs: []
            },
            {
                id: '2',
                activityType: 'indoor_climb',
                date: '2026-06-10',
                climbingType: 'Lead',
                createdAt: '',
                updatedAt: '',
                syncStatus: 'synced',
                climbs: []
            },
            {
                id: '3',
                activityType: 'indoor_climb',
                date: '2026-06-10',
                climbingType: 'Sport',
                createdAt: '',
                updatedAt: '',
                syncStatus: 'synced',
                climbs: []
            },
            {
                id: '4',
                activityType: 'outdoor_climb',
                date: '2026-06-10',
                climbingType: 'Boulder',
                createdAt: '',
                updatedAt: '',
                syncStatus: 'synced',
                climbs: []
            },
            {
                id: '5',
                activityType: 'outdoor_climb',
                date: '2026-06-10',
                climbingType: 'Sport',
                createdAt: '',
                updatedAt: '',
                syncStatus: 'synced',
                climbs: []
            },
            {
                id: '6',
                activityType: 'outdoor_climb',
                date: '2026-06-10',
                climbingType: 'Trad',
                createdAt: '',
                updatedAt: '',
                syncStatus: 'synced',
                climbs: []
            }
        ] as unknown as Session[];

        // Filter indoor only
        const indoorRes = getClimbingTypeBreakdown(mockSessions.filter(s => s.activityType === 'indoor_climb'));
        expect(indoorRes).toContainEqual({ label: 'Boulder', value: 1 });
        expect(indoorRes).toContainEqual({ label: 'Lead/Sport', value: 2 });
        expect(indoorRes.length).toBe(2);

        // Filter outdoor only
        const outdoorRes = getClimbingTypeBreakdown(mockSessions.filter(s => s.activityType === 'outdoor_climb'));
        expect(outdoorRes).toContainEqual({ label: 'Boulder', value: 1 });
        expect(outdoorRes).toContainEqual({ label: 'Sport', value: 1 });
        expect(outdoorRes).toContainEqual({ label: 'Trad', value: 1 });
        expect(outdoorRes.length).toBe(3);
    });

    it('getGymSessionTypeBreakdown aggregates trainingBlock properly', () => {
        const mockSessions = [
            {
                id: '1',
                activityType: 'gym_session',
                date: '2026-06-10',
                trainingBlock: 'Strength',
                name: 'Gym',
                exercises: [],
                createdAt: '',
                updatedAt: '',
                syncStatus: 'synced'
            },
            {
                id: '2',
                activityType: 'gym_session',
                date: '2026-06-10',
                trainingBlock: 'Power',
                name: 'Gym',
                exercises: [],
                createdAt: '',
                updatedAt: '',
                syncStatus: 'synced'
            },
            {
                id: '3',
                activityType: 'gym_session',
                date: '2026-06-10',
                trainingBlock: 'Strength',
                name: 'Gym',
                exercises: [],
                createdAt: '',
                updatedAt: '',
                syncStatus: 'synced'
            },
            {
                id: '4',
                activityType: 'gym_session',
                date: '2026-06-10',
                name: 'Gym',
                exercises: [],
                createdAt: '',
                updatedAt: '',
                syncStatus: 'synced'
            }
        ] as unknown as Session[];

        const res = getGymSessionTypeBreakdown(mockSessions);
        expect(res).toContainEqual({ label: 'Strength', value: 2 });
        expect(res).toContainEqual({ label: 'Power', value: 1 });
        expect(res).toContainEqual({ label: 'Other', value: 1 });
        expect(res.length).toBe(3);
    });

    it('getFingerboardSessionTypeBreakdown aggregates and normalizes exercise names', () => {
        const mockSessions = [
            {
                id: '1',
                activityType: 'fingerboarding',
                date: '2026-06-10',
                exercises: [
                    { name: 'Hangboard', gripType: 'Crimp', energySystem: '', sets: 1, details: [], notes: '' },
                    { name: 'max pickups', gripType: 'Pinch', energySystem: '', sets: 1, details: [], notes: '' }
                ],
                createdAt: '',
                updatedAt: '',
                syncStatus: 'synced'
            },
            {
                id: '2',
                activityType: 'fingerboarding',
                date: '2026-06-10',
                exercises: [
                    { name: 'Pinch block', gripType: 'Pinch', energySystem: '', sets: 1, details: [], notes: '' },
                    { name: 'Hangboard', gripType: 'Crimp', energySystem: '', sets: 1, details: [], notes: '' }
                ],
                createdAt: '',
                updatedAt: '',
                syncStatus: 'synced'
            }
        ] as unknown as Session[];

        const res = getFingerboardSessionTypeBreakdown(mockSessions);
        expect(res).toContainEqual({ label: 'Hang Board', value: 2 });
        expect(res).toContainEqual({ label: 'Pickups', value: 1 });
        expect(res).toContainEqual({ label: 'Pinch Block', value: 1 });
        expect(res.length).toBe(3);
    });

    it('getCampusWallTypeBreakdown groups and aggregates wall types', () => {
        const mockSessions = [
            {
                id: '1',
                activityType: 'campus_boarding',
                date: '2026-06-10',
                exercises: [
                    { wallType: 'Campus board rungs', exerciseType: '', sets: 1, details: [], notes: '' },
                    { wallType: 'Campus board balls', exerciseType: '', sets: 1, details: [], notes: '' }
                ],
                createdAt: '',
                updatedAt: '',
                syncStatus: 'synced'
            },
            {
                id: '2',
                activityType: 'campus_boarding',
                date: '2026-06-10',
                exercises: [
                    { wallType: 'Beast', exerciseType: '', sets: 1, details: [], notes: '' },
                    { wallType: 'Boulder walls', exerciseType: '', sets: 1, details: [], notes: '' }
                ],
                createdAt: '',
                updatedAt: '',
                syncStatus: 'synced'
            }
        ] as unknown as Session[];

        const res = getCampusWallTypeBreakdown(mockSessions);
        expect(res).toContainEqual({ label: 'Campus Board Rungs', value: 1 });
        expect(res).toContainEqual({ label: 'Campus Board Balls', value: 1 });
        expect(res).toContainEqual({ label: 'Beast', value: 1 });
        expect(res).toContainEqual({ label: 'Boulder Walls', value: 1 });
        expect(res.length).toBe(4);
    });

    it('getCompetitionTypeBreakdown maps competition types', () => {
        const mockSessions = [
            {
                id: '1',
                activityType: 'competition',
                date: '2026-06-10',
                type: 'Bouldering',
                createdAt: '',
                updatedAt: '',
                syncStatus: 'synced'
            },
            {
                id: '2',
                activityType: 'competition',
                date: '2026-06-10',
                type: 'Lead',
                createdAt: '',
                updatedAt: '',
                syncStatus: 'synced'
            },
            {
                id: '3',
                activityType: 'competition',
                date: '2026-06-10',
                type: 'Lead',
                createdAt: '',
                updatedAt: '',
                syncStatus: 'synced'
            }
        ] as unknown as Session[];

        const res = getCompetitionTypeBreakdown(mockSessions);
        expect(res).toContainEqual({ label: 'Bouldering', value: 1 });
        expect(res).toContainEqual({ label: 'Lead', value: 2 });
        expect(res.length).toBe(2);
    });

    it('getCategoryColor returns consistent stable colors', () => {
        expect(getCategoryColor('Boulder')).toBe('#0284C7');
        expect(getCategoryColor('Indoor Boulder')).toBe('#3B82F6');
        expect(getCategoryColor('Lead/Sport')).toBe('#16A34A');
        expect(getCategoryColor('Campus Board Rungs')).toBe('#EA580C');
        expect(getCategoryColor('Something custom and unknown')).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it('no two unique activity/category labels share a color in getCategoryColor', () => {
        const labels = [
            'Indoor Boulder', 'Indoor Lead', 'Indoor Sport', 'Indoor Lead/Sport',
            'Outdoor Boulder', 'Outdoor Sport', 'Outdoor Trad', 'Outdoor Lead/Sport',
            'Boulder', 'Bouldering', 'Lead', 'Sport', 'Lead/Sport', 'Mixed', 'Climb',
            'Speed', 'Speed Climbing', 'Gym Session', 'Strength', 'Power',
            'Power Endurance', 'Muscular Endurance', 'Fingerboarding', 'Hang Board',
            'Hangboard', 'Pickups', 'Lifting Edge', 'Pinch Block', 'Campus Boarding',
            'Campus Board', 'Campus Board Rungs', 'Campus Board Balls', 'Beast',
            'Boulder Walls', 'Competition'
        ];
        const colors = labels.map(l => getCategoryColor(l));
        const uniqueColors = new Set(colors);
        expect(colors.length).toBe(uniqueColors.size);
    });
});
