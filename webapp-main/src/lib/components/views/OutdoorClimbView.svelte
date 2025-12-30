<script lang="ts">
	// Outdoor Climb View - displays outdoor climbing history
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import OutdoorClimbFilters, { type FilterParams } from './outdoor/OutdoorClimbFilters.svelte';
	import OutdoorClimbCard from './outdoor/OutdoorClimbCard.svelte';
	import { getSessionsByType, mergeSessions } from '$lib/services/cache';
	import { getOutdoorSessions, type RemoteOutdoorSession } from '$lib/services/api';
	import type { OutdoorClimbSession } from '$lib/types/session';

	// State
	let sessions = $state<OutdoorClimbSession[]>([]);
	let filteredSessions = $state<OutdoorClimbSession[]>([]);
	
	let isLoading = $state(false);
	let fetchError = $state('');
	
	// Filter state
	let filters = $state<FilterParams>({
		startDate: '',
		endDate: '',
		area: '',
        crag: '',
		sessionType: '',
		grade: ''
	});

	// Load initial local data
	onMount(() => {
		loadLocalData();
	});

	function loadLocalData() {
		const localData = getSessionsByType('outdoor_climb') as OutdoorClimbSession[];
		// Sort by date desc
		sessions = localData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
		applyFilters();
	}

	async function handleFetchData() {
		isLoading = true;
		fetchError = '';

		try {
			const result = await getOutdoorSessions();
			
			if (result.ok && result.data) {
				mergeRemoteData(result.data);
			} else {
				fetchError = result.error || 'Failed to fetch data';
			}
		} catch (e) {
			fetchError = e instanceof Error ? e.message : 'Unknown error';
		} finally {
			isLoading = false;
		}
	}

	function mergeRemoteData(remoteData: RemoteOutdoorSession[]) {
		// Convert remote sessions to OutdoorClimbSession format
		const formattedRemoteSessions: OutdoorClimbSession[] = remoteData.map(remote => ({
			...remote,
			activityType: 'outdoor_climb',
			createdAt: new Date().toISOString(), // Fallback
			updatedAt: new Date().toISOString(), // Fallback
			syncStatus: 'synced', // It came from remote, so it's synced
			syncedAt: new Date().toISOString()
		}));

		// Persist to local storage
		mergeSessions(formattedRemoteSessions);

		// Reload from cache (source of truth)
		const localData = getSessionsByType('outdoor_climb') as OutdoorClimbSession[];
		sessions = localData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
		applyFilters();
	}

	function handleFilterChange(params: FilterParams) {
		filters = params;
		applyFilters();
	}

	interface SessionGroup {
		id: string; // Composite key
		date: string;
		sessions: OutdoorClimbSession[]; // The underlying sessions
		// Aggregated fields for display
		locationLabel: string;
		gradeLabel: string; // e.g. "6a - 7b"
		climbCount: number;
	}

	let groupedSessions = $state<SessionGroup[]>([]);

	function applyFilters() {
		// 1. Filter raw sessions first
		const filtered = sessions.filter(session => {
			// Date Range
			if (filters.startDate && session.date < filters.startDate) return false;
			if (filters.endDate && session.date > filters.endDate) return false;

			// Area (Partial match)
			if (filters.area && !session.area.toLowerCase().includes(filters.area.toLowerCase())) return false;
            
            // Crag (Partial match)
            if (filters.crag && !session.crag.toLowerCase().includes(filters.crag.toLowerCase())) return false;

			// Session Type matches Training Type
			if (filters.sessionType && session.trainingType !== filters.sessionType) return false;

			// Grade (Exact match on any climb in the session)
			if (filters.grade) {
				const searchGrade = filters.grade.trim().toLowerCase();
				const hasGrade = session.climbs.some(c => c.grade.trim().toLowerCase() === searchGrade);
				if (!hasGrade) return false;
			}

			return true;
		});

		// 2. Group them
		// Key: date|area|crag|climbingType
		const groups: Record<string, OutdoorClimbSession[]> = {};
		
		filtered.forEach(s => {
			// Normalize keys to ensure matching
			const key = `${s.date}|${s.area.trim()}|${s.crag.trim()}|${s.climbingType}`;
			if (!groups[key]) groups[key] = [];
			groups[key].push(s);
		});

		// 3. Convert to SessionGroup objects
		groupedSessions = Object.entries(groups).map(([key, groupSessions]) => {
			// Use the first session as representative for shared fields
			const rep = groupSessions[0];
			
			// Calculate grade range
			const allGrades = groupSessions.flatMap(s => s.climbs.map(c => c.grade));
			// (Simple display for now, could be more complex sorting)
			const uniqueGrades = [...new Set(allGrades)];
			const gradeLabel = uniqueGrades.length > 3 
				? `${uniqueGrades.length} grades`
				: uniqueGrades.join(', ');

			return {
				id: key,
				date: rep.date,
				sessions: groupSessions,
				locationLabel: `${rep.area} - ${rep.crag}`,
				gradeLabel,
				climbCount: groupSessions.reduce((acc, s) => acc + s.climbs.length, 0)
			};
		}).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
		
		// For backward compatibility with existing "filteredSessions" usage if strictly needed,
		// but we will update the view loop to use groupedSessions.
		filteredSessions = filtered; 
	}

</script>

<div class="view-container">
	<div class="view-header">
		<h2 class="view-title">⛰️ Outdoor Climbing History</h2>
		<button 
			class="fetch-btn" 
			onclick={handleFetchData} 
			disabled={isLoading}
			title="Fetch data from cloud"
		>
			{#if isLoading}
				<span class="spinner"></span> Fetching...
			{:else}
				☁️ Fetch Data
			{/if}
		</button>
	</div>

	{#if fetchError}
		<div class="error-banner" transition:slide>
			{fetchError}
		</div>
	{/if}

	<OutdoorClimbFilters onFilterParamsChange={handleFilterChange} />

	<!-- Load Key -->
	<div class="load-key">
		<span class="key-label">Load:</span>
		<div class="key-item"><span class="dot finger"></span> Finger</div>
		<div class="key-item"><span class="dot shoulder"></span> Shoulder</div>
		<div class="key-item"><span class="dot forearm"></span> Forearm</div>
	</div>

	<div class="sessions-list">
		{#each groupedSessions as group (group.id)}
			<!-- 
				Create a "Virtual" session that merges all climbs from the group.
				We pick metadata from the first session.
			-->
			{@const mergedSession = {
				...group.sessions[0],
				climbs: group.sessions.flatMap(s => s.climbs),
				// If any session in group is synced, show as synced (or show mixed status?)
				// Let's rely on the first one or show 'synced' only if all are synced.
				syncStatus: (group.sessions.every(s => s.syncStatus === 'synced') ? 'synced' : 'pending') as 'synced' | 'pending' | 'error'
			}}
			<OutdoorClimbCard session={mergedSession} />
		{/each}
		
		{#if groupedSessions.length === 0}
			<div class="empty-state">
				<p>No outdoor climbing sessions found.</p>
				{#if sessions.length > 0}
					<small>Try adjusting your filters.</small>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.view-container {
		animation: fadeIn 0.3s ease;
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(8px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.view-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
	}

	.view-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}

	.fetch-btn {
		background: var(--teal-secondary);
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 8px;
		font-weight: 600;
		font-size: 0.9rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		transition: background 0.2s ease, transform 0.1s ease;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.fetch-btn:hover:not(:disabled) {
		background: var(--teal-primary);
		transform: translateY(-1px);
	}

	.fetch-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.spinner {
		width: 14px;
		height: 14px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.error-banner {
		background: rgba(217, 83, 79, 0.1);
		color: #d9534f;
		padding: 0.75rem;
		border-radius: 8px;
		margin-bottom: 1rem;
		font-size: 0.9rem;
		text-align: center;
		border: 1px solid rgba(217, 83, 79, 0.2);
	}

	.empty-state {
		text-align: center;
		padding: 3rem 1rem;
		color: var(--text-secondary);
		background: rgba(255, 255, 255, 0.5);
		border-radius: 12px;
		border: 2px dashed rgba(74, 155, 155, 0.15);
	}

	.empty-state p {
		margin: 0 0 0.5rem 0;
		font-size: 1.1rem;
	}

	.empty-state small {
		opacity: 0.7;
	}

	.load-key {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 0.75rem;
		padding: 0 0.5rem;
		font-size: 0.75rem;
		color: var(--text-secondary);
	}

	.key-label {
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.key-item {
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
	}

	.dot.finger { background: #E57373; }
	.dot.shoulder { background: #64B5F6; }
	.dot.forearm { background: #81C784; }
</style>
