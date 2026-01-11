
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as crud from '$lib/services/crud';
import * as api from '$lib/services/api';
import { Timestamp } from 'firebase/firestore';

// Mock Firebase
vi.mock('$lib/services/firebase', () => ({
    db: {}
}));

// Mock Auth
vi.mock('$lib/services/auth', () => ({
    getCurrentUserId: vi.fn(() => 'test-user-id')
}));

// Mock Firestore
const mockSetDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockCollection = vi.fn();
const mockDoc = vi.fn();

vi.mock('firebase/firestore', () => ({
    collection: (...args: any[]) => mockCollection(...args),
    doc: (...args: any[]) => mockDoc(...args),
    setDoc: (...args: any[]) => mockSetDoc(...args),
    updateDoc: (...args: any[]) => mockUpdateDoc(...args),
    getDocs: vi.fn(),
    getDoc: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    Timestamp: {
        now: () => ({ toDate: () => new Date('2024-01-01T12:00:00Z') }),
        fromDate: (d: Date) => d
    }
}));

describe('API ID Generation Consistency', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('Indoor Session: Generates correct ID from customLocation', async () => {
        const payload: any = {
            date: '2024-03-20',
            time: '14:30',
            location: 'Gym A',
            customLocation: 'Secret Gym',
            climbingType: 'Boulder'
        };

        await api.createIndoorSession(payload);

        // check doc path: users/test-user-id/Indoor_Climbs/ID
        expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'users', 'test-user-id', 'Indoor_Climbs', '2024-03-20_14-30_Secret_Gym');
    });

    it('Indoor Session: Generates correct ID from location (fallback)', async () => {
        const payload: any = {
            date: '2024-03-20',
            time: '14:30',
            location: 'Gym B',
            climbingType: 'Boulder'
        };

        await api.createIndoorSession(payload);

        expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'users', 'test-user-id', 'Indoor_Climbs', '2024-03-20_14-30_Gym_B');
    });

    it('Outdoor Session: Generates correct ID from area + crag', async () => {
        const payload: any = {
            date: '2024-05-15',
            time: '09:00',
            area: 'Peak District',
            crag: 'Stanage Edge',
            climbingType: 'Trad'
        };

        await api.createOutdoorSession(payload);

        // Expected ID: DATE_TIME_Area_Crag
        // Logic: `${area}_${crag}` passed to identifier
        // cleanIdentifier replaces spaces with _
        // So identifier "Peak District_Stanage Edge" -> "Peak_District_Stanage_Edge"
        // Full ID: 2024-05-15_09-00_Peak_District_Stanage_Edge

        expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'users', 'test-user-id', 'Outdoor_Climbs', '2024-05-15_09-00_Peak_District_Stanage_Edge');
    });

    it('Fingerboard Session: Generates correct fixed ID segment', async () => {
        const payload: any = {
            date: '2024-01-01',
            time: '18:00',
            location: 'Home'
        };

        await api.createFingerboardSession(payload);

        expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'users', 'test-user-id', 'Fingerboarding', '2024-01-01_18-00_Fingerboarding');
    });

    it('Competition Session: Generates correct ID from venue', async () => {
        const payload: any = {
            date: '2024-06-01',
            time: '10:00',
            venue: 'Olympics',
            type: 'Lead'
        };

        await api.createCompetitionSession(payload);

        expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'users', 'test-user-id', 'Competitions', '2024-06-01_10-00_Olympics');
    });

    it('Gym Session: Generates correct ID from name', async () => {
        const payload: any = {
            date: '2024-02-14',
            time: '20:00',
            name: 'Leg Day',
            exercises: []
        };

        await api.createGymSession(payload);

        expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'users', 'test-user-id', 'Gym_Sessions', '2024-02-14_20-00_Leg_Day');
    });
});
