<script lang="ts">
	import { getFingerboardSessions, deleteFingerboardSession, updateFingerboardSession } from '$lib/services/api';
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

    // Edit state
    let editingState = $state<{ sessionId: string; exerciseId: string } | null>(null);
    let editedNotes = $state('');
    let isSavingNotes = $state(false);

    function startEditing(sessionId: string, exerciseId: string, currentNotes: string) {
        editingState = { sessionId, exerciseId };
        editedNotes = currentNotes;
    }

    function cancelEditing() {
        editingState = null;
        editedNotes = '';
    }

    async function handleSaveExNotes() {
        if (!editingState || isSavingNotes) return;

        const { sessionId, exerciseId } = editingState;
        const session = sessions.find(s => s.id === sessionId);
        if (!session) return;

        isSavingNotes = true;
        try {
            // Clone exercises to avoid mutation before save (though we will mutate generic sessions array after)
            const updatedExercises = session.exercises.map(ex => {
                if (ex.id === exerciseId) {
                    return { ...ex, notes: editedNotes.trim() };
                }
                return ex;
            });

            const payload = {
                date: session.date,
                time: session.time || '',
                location: session.location,
                exercises: updatedExercises
            };

            const result = await updateFingerboardSession(sessionId, payload);

            if (result.ok) {
                // Update local state
                const sessionIndex = sessions.findIndex(s => s.id === sessionId);
                if (sessionIndex !== -1) {
                    sessions[sessionIndex] = { ...sessions[sessionIndex], exercises: updatedExercises };
                }
                cancelEditing();
            } else {
                console.error('Failed to update notes:', result.error);
                alert('Failed to update notes');
            }
        } catch (e) {
            console.error('Error saving notes:', e);
            alert('Error saving notes');
        } finally {
            isSavingNotes = false;
        }
    }

	function handleDeleteSession(id: string) {
		selectedSessionId = id;
		showDeleteModal = true;
	}

	async function confirmDeleteSession() {
		if (selectedSessionId) {
            try {
                const result = await deleteFingerboardSession(selectedSessionId);
                if (result.ok) {
                    selectedSessionId = null;
                    showDeleteModal = false;
                    // Reload data
                    loadSessions();
                } else {
                    console.error('Failed to delete session:', result.error);
                    alert('Failed to delete session');
                }
            } catch (e) {
                console.error('Exception deleting session:', e);
            }
		}
	}

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
								<span class="time-tag">{session.time || '12:00'}</span>
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
											<div class="ex-title-group">
												<span class="ex-name">{exercise.name}</span>
												<span class="ex-grip">{exercise.gripType}</span>
											</div>
											{#if !(editingState?.sessionId === session.id && editingState?.exerciseId === exercise.id)}
												<button 
													class="btn-icon edit-btn"
													title="Edit notes"
													onclick={() => startEditing(session.id, exercise.id, exercise.notes)}
												>
													✏️
												</button>
											{/if}
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
										
										{#if editingState?.sessionId === session.id && editingState?.exerciseId === exercise.id}
											<div class="edit-notes-container">
												<textarea 
													bind:value={editedNotes}
													class="notes-input"
													placeholder="Add notes..."
													rows="2"
												></textarea>
												<div class="edit-actions">
													<button 
														class="action-btn save" 
														onclick={handleSaveExNotes}
														disabled={isSavingNotes}
													>
														{isSavingNotes ? 'Saving...' : 'Save'}
													</button>
													<button 
														class="action-btn cancel" 
														onclick={cancelEditing}
														disabled={isSavingNotes}
													>
														Cancel
													</button>
												</div>
											</div>
										{:else if exercise.notes}
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
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.time-tag {
		font-size: 0.8rem;
		color: var(--text-secondary);
		font-weight: 500;
		background: rgba(0,0,0,0.03);
		padding: 0.1rem 0.4rem;
		border-radius: 4px;
		font-family: 'Geist Mono', monospace;
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
		align-items: flex-start;
		margin-bottom: 0.4rem;
	}

	.ex-title-group {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
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

	.edit-btn {
		opacity: 0;
		transition: opacity 0.2s;
		font-size: 0.8rem;
		padding: 0.2rem;
	}

	.exercise-item:hover .edit-btn {
		opacity: 0.5;
	}

	.exercise-item:hover .edit-btn:hover {
		opacity: 1;
		background: rgba(0,0,0,0.05);
	}

	.edit-notes-container {
		margin-top: 0.8rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.notes-input {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid var(--teal-secondary);
		border-radius: 6px;
		font-size: 0.9rem;
		font-family: inherit;
		resize: vertical;
	}
	
	.notes-input:focus {
		outline: none;
		box-shadow: 0 0 0 2px rgba(74, 155, 155, 0.2);
	}

	.edit-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
	}

	.action-btn {
		border: none;
		border-radius: 4px;
		padding: 0.3rem 0.8rem;
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}

	.action-btn.save {
		background: var(--teal-secondary);
		color: white;
	}

	.action-btn.save:hover {
		background: var(--teal-primary);
	}

	.action-btn.cancel {
		background: #eee;
		color: #666;
	}

	.action-btn.cancel:hover {
		background: #ddd;
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
