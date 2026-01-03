<script lang="ts">
	import { getFingerboardSessions, mergeSessions, deleteSession } from '$lib/services/cache';
	import { syncAllPending } from '$lib/services/sync';
	import { getFingerboardSessions as fetchRemote } from '$lib/services/api';
	import type { FingerboardSession } from '$lib/types/session';
	import { slide } from 'svelte/transition';
	import DeleteConfirmModal from '$lib/components/common/DeleteConfirmModal.svelte';

	let sessions = $state<FingerboardSession[]>([]);
	let loading = $state(true);
	let startDate = $state('');
	let endDate = $state('');
	let expandedDetails = $state<Set<string>>(new Set());

	// Pagination
	let visibleCount = $state(20);
	const ITEMS_PER_PAGE = 20;

	// Reset pagination when filters change
	$effect(() => {
		startDate;
		endDate;
		visibleCount = ITEMS_PER_PAGE;
	});

	// Delete state
	let showDeleteModal = $state(false);
	let selectedSessionId = $state<string | null>(null);

	function handleDeleteSession(id: string) {
		selectedSessionId = id;
		showDeleteModal = true;
	}

	function confirmDeleteSession() {
		if (selectedSessionId) {
			deleteSession(selectedSessionId);
			selectedSessionId = null;
			showDeleteModal = false;
			// Reload local data
			sessions = getFingerboardSessions().sort(
				(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
			);
		}
	}

	async function loadSessions() {
		loading = true;
		// Load local first
		sessions = getFingerboardSessions().sort(
			(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
		);

		// Then try remote sync
		try {
			// Sync ALL pending local changes (deletes, creates, updates) to the server first.
			// This ensures our local queue is empty before we pull down new data.
			await syncAllPending();
			const result = await fetchRemote();
			if (result.ok && result.data) {
				// Determine what's new (simple logic: ID check)
				const formattedRemoteSessions = result.data.map((r) => ({
					...r,
					activityType: 'fingerboarding' as const,

					// Use date if created/updated At are missing or correct case
					createdAt: r.createdAt || new Date().toISOString(),
					updatedAt: r.updatedAt || new Date().toISOString(),
					syncStatus: 'synced' as const
				}));

				// Persist
				mergeSessions(formattedRemoteSessions);

				// Update local state display
				// Reload local state to reflect merge & ID updates
				sessions = getFingerboardSessions().sort(
					(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
				);
			}
		} catch (e) {
			console.error('Failed to sync', e);
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

	// Grouping by Date
	function groupByDate(sess: FingerboardSession[]) {
		const groups: Record<string, FingerboardSession[]> = {};
		for (const s of sess) {
			if (!groups[s.date]) groups[s.date] = [];
			groups[s.date].push(s);
		}
		return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
	}

	function toggleExpand(id: string) {
		if (expandedDetails.has(id)) {
			expandedDetails.delete(id);
		} else {
			expandedDetails.add(id);
		}
		// Force update since Set mutation doesn't trigger reactivity by itself if not reassigned
		expandedDetails = new Set(expandedDetails);
	}

	function getTotalSets(s: FingerboardSession) {
		return s.exercises.reduce((acc, ex) => acc + ex.details.length, 0);
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
				<div class="session-card" class:expanded={expandedDetails.has(session.id)}>
					<div
						class="card-header"
						role="button"
						tabindex="0"
						onclick={() => toggleExpand(session.id)}
						onkeydown={(e) => e.key === 'Enter' && toggleExpand(session.id)}
					>
						<div class="header-main">
							<span class="session-date">
								{new Date(session.date).toLocaleDateString(undefined, {
									weekday: 'short',
									month: 'short',
									day: 'numeric',
									year: 'numeric'
								})}
							</span>
							<span class="meta">
								{#if session.location && session.location !== 'N/A' && session.location !== 'Home'}
									{session.location} ·
								{/if}
								{session.exercises.length} Exercises · {getTotalSets(session)} Sets
							</span>
						</div>
						<div class="header-status">
							<span
								class="sync-dot"
								class:synced={session.syncStatus === 'synced'}
								title={session.syncStatus === 'synced' ? 'Synced' : 'Local'}>●</span
							>

							<button
								class="btn-icon delete-btn"
								title="Delete Session"
								onclick={(e) => {
									e.stopPropagation();
									handleDeleteSession(session.id);
								}}
							>
								🗑️
							</button>

							<span class="chevron">{expandedDetails.has(session.id) ? '▲' : '▼'}</span>
						</div>
					</div>

					{#if expandedDetails.has(session.id)}
						<div class="card-body" transition:slide={{ duration: 150 }}>
							<div class="exercises-list">
								{#each session.exercises || [] as exercise}
									<div class="exercise-item">
										<div class="ex-header">
											<span class="ex-name">{exercise.name}</span>
											<span class="ex-grip">{exercise.gripType}</span>
										</div>
										<div class="ex-sets">
											{#each exercise.details as set, i}
												<span class="set-tag">
													{set.weight > 0 ? `+${set.weight}kg` : 'BW'}
													<span class="x">x</span>
													{set.reps}s/reps
												</span>
											{/each}
										</div>
										{#if exercise.notes}
											<div class="ex-notes">"{exercise.notes}"</div>
										{/if}
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>
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

<DeleteConfirmModal
	isOpen={showDeleteModal}
	title="Delete Fingerboard Session"
	message="Are you sure you want to delete this session? This cannot be undone."
	onConfirm={confirmDeleteSession}
	onCancel={() => (showDeleteModal = false)}
/>

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

	.btn-icon {
		background: none;
		border: none;
		cursor: pointer;
		padding: 4px;
		opacity: 0.6;
		transition: opacity 0.2s;
		font-size: 0.9rem;
		margin-left: 0.5rem;
	}

	.btn-icon:hover {
		opacity: 1;
		background: rgba(0, 0, 0, 0.05);
		border-radius: 4px;
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

	.session-card {
		background: white;
		border-radius: 12px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
		border: 1px solid #eee;
		overflow: hidden;
		content-visibility: auto;
		contain-intrinsic-size: 100px;
	}

	.card-header {
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		padding: 0.8rem 1rem;
		background: white;
		border: none;
		cursor: pointer;
		text-align: left;
	}

	.timeline {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding-bottom: 2rem;
	}

	.session-date {
		font-weight: 600;
		color: var(--teal-primary);
		font-size: 1rem;
	}

	.meta {
		font-size: 0.8rem;
		color: var(--text-secondary);
	}

	.header-status {
		display: flex;
		align-items: center;
		gap: 0.8rem;
	}

	.sync-dot {
		font-size: 0.6rem;
		color: #ccc;
	}
	.sync-dot.synced {
		color: var(--teal-secondary);
	}

	.chevron {
		color: #aaa;
		font-size: 0.8rem;
	}

	.card-body {
		border-top: 1px solid #f5f5f5;
		background: #fafafa;
		padding: 1rem;
	}

	.exercises-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.exercise-item {
		padding-bottom: 0.8rem;
		border-bottom: 1px dashed #eee;
		background: white;
		padding: 0.8rem;
		border-radius: 8px;
		border: 1px solid #eee;
	}

	.exercise-item:last-child {
		margin-bottom: 0;
	}

	.ex-header {
		display: flex;
		justify-content: space-between;
		margin-bottom: 0.4rem;
	}

	.ex-name {
		font-weight: 600;
		color: var(--text-primary);
		font-size: 0.9rem;
	}

	.ex-grip {
		font-size: 0.75rem;
		color: var(--text-secondary);
		background: #f0f0f0;
		padding: 0.1rem 0.5rem;
		border-radius: 4px;
	}

	.ex-sets {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.set-tag {
		font-size: 0.8rem;
		background: #eefdfd;
		color: var(--teal-secondary);
		padding: 0.2rem 0.5rem;
		border-radius: 6px;
		border: 1px solid rgba(74, 155, 155, 0.15);
	}

	.x {
		color: #aaa;
		font-size: 0.7rem;
		margin: 0 1px;
	}

	.ex-notes {
		font-size: 0.8rem;
		color: var(--text-secondary);
		font-style: italic;
		margin-top: 0.5rem;
		padding-top: 0.5rem;
		border-top: 1px solid #f9f9f9;
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
