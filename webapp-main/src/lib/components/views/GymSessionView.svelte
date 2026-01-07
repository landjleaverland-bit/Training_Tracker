<script lang="ts">
	// Gym Session View - displays gym session history
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import GymSessionFilters, { type FilterParams } from './gym/GymSessionFilters.svelte';
	import GymSessionCard from './gym/GymSessionCard.svelte';
	import { getGymSessions } from '$lib/services/api';
	import type { GymSession } from '$lib/types/session';
    import { downloadCSV } from '$lib/utils/export';

	// State
	let sessions = $state<GymSession[]>([]);
	let filteredSessions = $state<GymSession[]>([]);
	
	let isLoading = $state(false);
	let fetchError = $state('');
	
	// Filter state
	let filters = $state<FilterParams>({
		startDate: '',
		endDate: '',
		name: '',
		trainingBlock: ''
	});

	// Pagination state
	let visibleCount = $state(20);
	const ITEMS_PER_PAGE = 20;

	// Load initial data
	// Load initial data
	onMount(() => {
		handleFetchData();
	});

	async function handleFetchData() {
		isLoading = true;
		fetchError = '';

		try {
			const result = await getGymSessions();
			
			if (result.ok && result.data) {
				sessions = result.data.map(remote => ({
                    ...remote,
                    activityType: 'gym_session'
                })) as GymSession[];

		        sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
				applyFilters();
			} else {
				fetchError = result.error || 'Failed to fetch data';
			}
		} catch (e) {
			fetchError = e instanceof Error ? e.message : 'Unknown error';
		} finally {
			isLoading = false;
		}
	}

	function handleFilterChange(params: FilterParams) {
		filters = params;
		applyFilters();
	}

	function applyFilters() {
		visibleCount = ITEMS_PER_PAGE;

		filteredSessions = sessions.filter(session => {
			if (filters.startDate && session.date < filters.startDate) return false;
			if (filters.endDate && session.date > filters.endDate) return false;
			if (filters.name && !session.name.toLowerCase().includes(filters.name.toLowerCase())) return false;
			if (filters.trainingBlock && session.trainingBlock !== filters.trainingBlock) return false;
			return true;
		});
	}

	function loadMore() {
		visibleCount += ITEMS_PER_PAGE;
	}
</script>

<div class="view-container">
	<div class="view-header">
		<h2 class="view-title">🏋️ Gym Session History</h2>
        <div class="header-actions">
            <button 
                class="action-btn secondary" 
                onclick={() => downloadCSV(filteredSessions, 'gym_sessions')}
                title="Export filtered data to CSV"
            >
                📥 Export
            </button>
            <button 
                class="action-btn" 
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
	</div>

	{#if fetchError}
		<div class="error-banner" transition:slide>
			{fetchError}
		</div>
	{/if}

	<GymSessionFilters onFilterParamsChange={handleFilterChange} />

	<div class="sessions-list">
		{#each filteredSessions.slice(0, visibleCount) as session (session.id)}
			<GymSessionCard {session} onDelete={handleFetchData} onUpdate={handleFetchData} />
		{/each}
		
		{#if filteredSessions.length === 0}
			<div class="empty-state">
				<p>No gym sessions found.</p>
				{#if sessions.length > 0}
					<small>Try adjusting your filters.</small>
				{/if}
			</div>
		{/if}

		{#if visibleCount < filteredSessions.length}
			<div class="load-more-container">
				<button class="load-more-btn" onclick={loadMore}>
					Load More ({filteredSessions.length - visibleCount} remaining)
				</button>
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

    .header-actions {
        display: flex;
        gap: 0.5rem;
    }

	.view-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}

	.action-btn {
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

	.action-btn:hover:not(:disabled) {
		background: var(--teal-primary);
		transform: translateY(-1px);
	}

    .action-btn.secondary {
        background: white;
        color: var(--teal-secondary);
        border: 1px solid var(--teal-secondary);
    }

    .action-btn.secondary:hover {
        background: #f0fcfc;
    }

	.action-btn:disabled {
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
	
	.load-more-container {
		display: flex;
		justify-content: center;
		padding: 1rem 0 6rem 0;
	}

	.load-more-btn {
		background: white;
		border: 1px solid var(--teal-secondary);
		color: var(--teal-secondary);
		padding: 0.6rem 1.5rem;
		border-radius: 20px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		box-shadow: 0 2px 4px rgba(0,0,0,0.05);
	}

	.load-more-btn:hover {
		background: var(--teal-secondary);
		color: white;
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(74, 155, 155, 0.2);
	}
</style>
