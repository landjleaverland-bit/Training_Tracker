<script lang="ts">
    import { getCompetitionSessions, mergeSessions, deleteSession } from '$lib/services/cache';
    import { syncAllPending } from '$lib/services/sync';
    import { getCompetitionSessions as fetchRemote } from '$lib/services/api';
    import type { CompetitionSession } from '$lib/types/session';
    import { slide } from 'svelte/transition';
    import DeleteConfirmModal from '$lib/components/common/DeleteConfirmModal.svelte';

    let sessions = $state<CompetitionSession[]>([]);
    let loading = $state(true);
    let expandedDetails = $state<Set<string>>(new Set());

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
            sessions = getCompetitionSessions().sort((a, b) => 
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );
        }
    }

    async function loadSessions() {
        loading = true;
        // Load local first
        sessions = getCompetitionSessions().sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        // Then try remote sync
        try {
            // Sync ALL pending local changes (deletes, creates, updates) to the server first.
            // This ensures our local queue is empty before we pull down new data.
            await syncAllPending();
            const result = await fetchRemote();
            if (result.ok && result.data) {
                // Format remote sessions
                const formattedRemoteSessions = result.data.map(r => ({
                    ...r,
                    activityType: 'competition' as const,
                    type: r.type as 'Bouldering' | 'Lead' | 'Speed',
                    rounds: r.rounds.map(round => ({
                        ...round,
                        climbs: round.climbs?.map(c => ({
                            ...c,
                            status: c.status as 'Flash' | 'Top' | 'Zone' | 'Attempt'
                        }))
                    })),
                    // Fallback fields
                    createdAt: r.createdAt || new Date().toISOString(),
                    updatedAt: r.updatedAt || new Date().toISOString(),
                    syncStatus: 'synced' as const
                }));

                // Persist
                mergeSessions(formattedRemoteSessions);

                // Update local state by reloading from cache (source of truth)
                // This ensures we catch any ID swaps performed by mergeSessions
                sessions = getCompetitionSessions().sort((a, b) => 
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                );
            }
        } catch (e) {
            console.error('Failed to sync', e);
        } finally {
            loading = false;
        }
    }

    loadSessions();

    function toggleExpand(id: string) {
        if (expandedDetails.has(id)) expandedDetails.delete(id);
        else expandedDetails.add(id);
        expandedDetails = new Set(expandedDetails);
    }

    function getResultSummary(session: CompetitionSession) {
        // Quick summary for header
        if (!session.rounds || session.rounds.length === 0) return 'No rounds';
        const lastRound = session.rounds[session.rounds.length - 1]; // usually Final
        
        if (lastRound.position) return `#${lastRound.position} ${lastRound.name}`;
        
        if (lastRound.climbs) {
            const tops = lastRound.climbs.filter(c => c.status === 'Top' || c.status === 'Flash').length;
            const zones = lastRound.climbs.filter(c => c.status === 'Zone').length;
            return `${session.rounds.length} Rnds · Final: ${tops}T ${zones + tops}Z`;
        }
        return lastRound.name;
    }
</script>

<div class="view-content">
	<div class="header">
		<h3>🏆 Competition Log</h3>
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

    {#if loading && sessions.length === 0}
        <div class="loading">Loading sessions...</div>
    {:else if sessions.length === 0}
        <div class="empty-state">No competitions logged yet.</div>
    {:else}
        <div class="timeline">
            {#each sessions as session}
                <div class="session-card" class:expanded={expandedDetails.has(session.id)}>
                    <div 
                        class="card-header" 
                        role="button" 
                        tabindex="0" 
                        onclick={() => toggleExpand(session.id)}
                        onkeydown={(e) => e.key === 'Enter' && toggleExpand(session.id)}
                    >
                        <div class="header-main">
                            <div class="left-col">
                                <span class="venue">{session.customVenue || session.venue}</span>
                                <span class="date">{new Date(session.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                            </div>
                            <div class="right-col">
                                <div class="badges">
                                    <span class="type-tag">{session.type}</span>
                                    <span class="result-tag">{getResultSummary(session)}</span>
                                </div>
                            </div>
                        </div>
                        <div class="header-status">
                            <span class="sync-dot" class:synced={session.syncStatus === 'synced'} title={session.syncStatus === 'synced' ? 'Synced' : 'Local'}>●</span>
                            <button 
                                class="btn-icon delete-btn" 
                                title="Delete Session"
                                onclick={(e) => { e.stopPropagation(); handleDeleteSession(session.id); }}
                            >
                                🗑️
                            </button>
                            <span class="chevron">{expandedDetails.has(session.id) ? '▲' : '▼'}</span>
                        </div>
                    </div>

                    {#if expandedDetails.has(session.id)}
                        <div class="card-body" transition:slide={{ duration: 200 }}>
                            {#if session.rounds}
                                <div class="rounds-list">
                                    {#each session.rounds as round}
                                        <div class="round-item">
                                            <div class="round-header">
                                                <span class="round-name">{round.name}</span>
                                                {#if round.position}
                                                    <span class="round-pos">#{round.position}</span>
                                                {/if}
                                            </div>
                                            
                                            {#if round.climbs}
                                                <div class="climbs-list">
                                                    {#each round.climbs as climb}
                                                        <div class="climb-row">
                                                            <div class="climb-info">
                                                                <span class="c-name">{climb.name}</span>
                                                                {#if climb.attemptCount > 1}
                                                                    <span class="c-attempts">({climb.attemptCount} tries)</span>
                                                                {/if}
                                                            </div>
                                                            <div class="climb-result">
                                                                <span class="status-badge" class:top={climb.status === 'Top' || climb.status === 'Flash'} class:zone={climb.status === 'Zone'}>
                                                                    {climb.status}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {#if climb.notes}
                                                            <div class="climb-notes">"{climb.notes}"</div>
                                                        {/if}
                                                    {/each}
                                                </div>
                                            {/if}
                                        </div>
                                    {/each}
                                </div>
                            {/if}

                            <!-- Load info if exists -->
                            {#if session.fingerLoad || session.shoulderLoad}
                                <div class="load-meta">
                                    <span>Detailed Load: Fingers {session.fingerLoad}/5, Shoulders {session.shoulderLoad}/5, Forearms {session.forearmLoad}/5</span>
                                </div>
                            {/if}

                            <div class="session-footer">
                                <span class="sync-status" class:synced={session.syncStatus === 'synced'}>
                                    {session.syncStatus === 'synced' ? '✓ Synced' : '☁ Local'}
                                </span>
                            </div>
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    {/if}
    <DeleteConfirmModal 
        isOpen={showDeleteModal}
        title="Delete Competition"
        message="Are you sure you want to delete this competition session? This action cannot be undone."
        onConfirm={confirmDeleteSession}
        onCancel={() => showDeleteModal = false}
    />
</div>

<style>
	.view-content { animation: fadeIn 0.3s ease; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
	h3 { margin: 0; color: var(--teal-secondary); }

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

    .header-status {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .btn-icon {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        opacity: 0.6;
        transition: opacity 0.2s;
        font-size: 0.9rem;
    }

    .btn-icon:hover {
        opacity: 1;
        background: rgba(0,0,0,0.05);
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
		to { transform: rotate(360deg); }
	}

    .timeline { display: flex; flex-direction: column; gap: 0.8rem; }

    .session-card {
        background: white; border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.04); border: 1px solid #eee;
        overflow: hidden;
    }

    .card-header {
        width: 100%; display: flex; justify-content: space-between; align-items: center;
        padding: 0.8rem 1rem; background: white; border: none; cursor: pointer; text-align: left;
    }

    .header-main { display: flex; flex: 1; justify-content: space-between; align-items: center; padding-right: 1rem; }
    
    .left-col { display: flex; flex-direction: column; }
    .venue { font-weight: 600; color: var(--text-primary); font-size: 0.95rem; }
    .date { font-size: 0.8rem; color: #aaa; }

    .right-col { display: flex; align-items: center; }
    .badges { display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: flex-end; }
    
    .type-tag { font-size: 0.7rem; background: #eefdfd; color: var(--teal-secondary); padding: 0.1rem 0.4rem; border-radius: 4px; border: 1px solid rgba(74,155,155,0.1); }
    .result-tag { font-size: 0.75rem; font-weight: 600; color: var(--text-primary); }

    .chevron { color: #ccc; font-size: 0.8rem; }

    .card-body { border-top: 1px solid #f5f5f5; background: #fafafa; padding: 1rem; }

    .rounds-list { display: flex; flex-direction: column; gap: 1rem; }
    .round-item { background: white; border: 1px solid #eee; border-radius: 8px; overflow: hidden; }
    
    .round-header {
        background: #f8f9fa; padding: 0.5rem 0.8rem; border-bottom: 1px solid #eee;
        display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 600; color: var(--text-secondary);
    }
    .round-pos { color: var(--teal-primary); }

    .climb-row {
        display: flex; justify-content: space-between; align-items: center;
        padding: 0.6rem 0.8rem; border-bottom: 1px solid #f9f9f9;
        font-size: 0.9rem;
    }
    .climb-row:last-child { border-bottom: none; }

    .c-name { font-weight: 500; color: var(--text-primary); }
    .c-attempts { font-size: 0.8rem; color: #aaa; margin-left: 0.4rem; }

    .status-badge {
        font-size: 0.75rem; padding: 0.1rem 0.5rem; border-radius: 10px;
        background: #eee; color: #777; font-weight: 600;
    }
    .status-badge.top { background: #d4edda; color: #155724; }
    .status-badge.zone { background: #fff3cd; color: #856404; }

    .climb-notes {
        padding: 0 0.8rem 0.6rem 0.8rem; font-size: 0.8rem; color: #888; font-style: italic; border-bottom: 1px solid #f9f9f9;
    }
    .climb-notes:last-child { border-bottom: none; }

    .load-meta { margin-top: 1rem; font-size: 0.75rem; color: #aaa; text-align: center; }

    .session-footer { margin-top: 0.8rem; display: flex; justify-content: flex-end; }
    .sync-status { font-size: 0.7rem; color: #ccc; }
    .sync-status.synced { color: var(--teal-secondary); }

    .loading, .empty-state { text-align: center; padding: 2rem; color: var(--text-secondary); font-style: italic; }
</style>
