<script lang="ts">
	import { getFingerboardSessions } from '$lib/services/api';
	import type { FingerboardSession } from '$lib/types/session';
	import FingerboardSessionCard from './fingerboarding/FingerboardSessionCard.svelte';

	let sessions = $state<FingerboardSession[]>([]);
	let loading = $state(true);
	let startDate = $state('');
	let endDate = $state('');

	// Pagination
	let visibleCount = $state(20);
	const ITEMS_PER_PAGE = 20;

	// Reset pagination when filters change
	$effect(() => {
		startDate;
		endDate;
		visibleCount = ITEMS_PER_PAGE;
	});

	async function loadSessions() {
		loading = true;
		try {
			const result = await getFingerboardSessions();
			if (result.ok && result.data) {
				// Format remote sessions
				sessions = result.data.map((r) => ({
					...r,
					activityType: 'fingerboarding' as const,
                    syncStatus: 'synced' as const
				})).sort(
					(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
				);
			}
		} catch (e) {
			console.error('Failed to fetch sessions', e);
		} finally {
			loading = false;
		}
	}

	// Load on mount
	loadSessions();

	let filteredSessions = $derived(
		sessions.filter((s) => {
			if (startDate && new Date(s.date) < new Date(startDate)) return false;
			if (endDate && new Date(s.date) > new Date(endDate)) return false;
			return true;
		})
	);

	function loadMore() {
		visibleCount += ITEMS_PER_PAGE;
	}

    function handleSessionDeleted() {
        loadSessions(); // Reload to reflect deletion
    }
</script>

<div class="view-content">
	<div class="header">
		<h3>🤏 Fingerboarding Log</h3>
		<button
			class="fetch-btn"
			onclick={loadSessions}
			disabled={loading}
			title="Fetch data from cloud"
		>
			{#if loading}
				<span class="spinner"></span> Fetching...
			{:else}
				☁️ Fetch Data
			{/if}
		</button>
	</div>

	<div class="filters">
		<div class="filter-group">
			<label for="start-date">From</label>
			<input type="date" id="start-date" bind:value={startDate} />
		</div>
		<div class="filter-group">
			<label for="end-date">To</label>
			<input type="date" id="end-date" bind:value={endDate} />
		</div>
	</div>

	{#if loading && sessions.length === 0}
		<div class="loading">Loading sessions...</div>
	{:else if filteredSessions.length === 0}
		<div class="empty-state">
			{#if sessions.length > 0}
				No sessions match filter.
			{:else}
				No fingerboarding sessions logged yet.
			{/if}
		</div>
	{:else}
		<div class="timeline">
			{#each filteredSessions.slice(0, visibleCount) as session}
                <FingerboardSessionCard {session} onDelete={handleSessionDeleted} />
			{/each}

			{#if visibleCount < filteredSessions.length}
				<div class="load-more-container">
					<button class="load-more-btn" onclick={loadMore}>
						Load More ({filteredSessions.length - visibleCount} remaining)
					</button>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.view-content {
		animation: fadeIn 0.3s ease;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.filters {
		display: flex;
		gap: 1rem;
		margin-bottom: 1.5rem;
		background: white;
		padding: 0.8rem;
		border-radius: 8px;
		border: 1px solid #eee;
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		flex: 1;
	}

	.filter-group label {
		font-size: 0.75rem;
		color: var(--text-secondary);
		margin-bottom: 0.2rem;
	}

	.filter-group input {
		border: 1px solid #ddd;
		border-radius: 4px;
		padding: 0.4rem;
		font-size: 0.9rem;
		color: var(--text-primary);
	}

	h3 {
		margin: 0;
		color: var(--teal-secondary);
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
		transition:
			background 0.2s ease,
			transform 0.1s ease;
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
		to {
			transform: rotate(360deg);
		}
	}

	.timeline {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding-bottom: 2rem;
	}

	.loading,
	.empty-state {
		text-align: center;
		padding: 2rem;
		color: var(--text-secondary);
		font-style: italic;
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
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}

	.load-more-btn:hover {
		background: var(--teal-secondary);
		color: white;
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(74, 155, 155, 0.2);
	}
</style>
