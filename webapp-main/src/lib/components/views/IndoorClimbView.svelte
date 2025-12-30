<script lang="ts">
	// Indoor Climb View - displays indoor climbing history
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import IndoorClimbFilters, { type FilterParams } from './indoor/IndoorClimbFilters.svelte';
	import IndoorClimbCard from './indoor/IndoorClimbCard.svelte';
	import { getSessionsByType, mergeSessions } from '$lib/services/cache';
	import { getIndoorSessions, type RemoteIndoorSession } from '$lib/services/api';
	import { syncAllPending } from '$lib/services/sync';
	import type { IndoorClimbSession } from '$lib/types/session';

	// State
	let sessions = $state<IndoorClimbSession[]>([]);
	let filteredSessions = $state<IndoorClimbSession[]>([]);
	
	let isLoading = $state(false);
	let fetchError = $state('');
	
	// Filter state
	let filters = $state<FilterParams>({
		startDate: '',
		endDate: '',
		location: '',
		sessionType: '',
		grade: ''
	});

	// Load initial local data
	onMount(() => {
		loadLocalData();
	});

	function loadLocalData() {
		const localData = getSessionsByType('indoor_climb') as IndoorClimbSession[];
		// Sort by date desc
		sessions = localData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
		applyFilters();
	}

	async function handleFetchData() {
		isLoading = true;
		fetchError = '';

		try {
			// Sync ALL pending local changes (deletes, creates, updates) to the server first.
			// This ensures our local queue is empty before we pull down new data.
			await syncAllPending();
			const result = await getIndoorSessions();
			
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

	function mergeRemoteData(remoteData: RemoteIndoorSession[]) {
		// Convert remote sessions to IndoorClimbSession format
		const formattedRemoteSessions: IndoorClimbSession[] = remoteData.map(remote => ({
			...remote,
			activityType: 'indoor_climb',
			createdAt: new Date().toISOString(), // Fallback
			updatedAt: new Date().toISOString(), // Fallback
			syncStatus: 'synced', // It came from remote, so it's synced
			syncedAt: new Date().toISOString()
		}));

		// Persist to local storage
		mergeSessions(formattedRemoteSessions);

		// Update local state by reloading from cache (source of truth)
		const localData = getSessionsByType('indoor_climb') as IndoorClimbSession[];
		sessions = localData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
		applyFilters();
	}

	function handleFilterChange(params: FilterParams) {
		filters = params;
		applyFilters();
	}

	function applyFilters() {
		// Filter raw sessions
		filteredSessions = sessions.filter(session => {
			// Date Range
			if (filters.startDate && session.date < filters.startDate) return false;
			if (filters.endDate && session.date > filters.endDate) return false;

			// Location
			if (filters.location && session.location !== filters.location) return false;

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
	}
</script>

<div class="view-container">
	<div class="view-header">
		<h2 class="view-title">🧗 Indoor Climbing History</h2>
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

	<IndoorClimbFilters onFilterParamsChange={handleFilterChange} />

	<!-- Load Key -->
	<div class="load-key">
		<span class="key-label">Load:</span>
		<div class="key-item"><span class="dot finger"></span> Finger</div>
		<div class="key-item"><span class="dot shoulder"></span> Shoulder</div>
		<div class="key-item"><span class="dot forearm"></span> Forearm</div>
	</div>

	<div class="sessions-list">
		{#each filteredSessions as session (session.id)}
			<IndoorClimbCard {session} onDelete={loadLocalData} />
		{/each}
		
		{#if filteredSessions.length === 0}
			<div class="empty-state">
				<p>No indoor climbing sessions found.</p>
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
