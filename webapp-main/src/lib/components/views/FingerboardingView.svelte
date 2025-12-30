<script lang="ts">
    import { getFingerboardSessions, markAsSynced, markAsSyncError } from '$lib/services/cache';
    import { getFingerboardSessions as fetchRemote } from '$lib/services/api';
    import type { FingerboardSession } from '$lib/types/session';

    let sessions = $state<FingerboardSession[]>([]);
    let loading = $state(true);

    async function loadSessions() {
        loading = true;
        // Load local first
        sessions = getFingerboardSessions().sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        // Then try remote sync
        try {
            const result = await fetchRemote();
            if (result.ok && result.data) {
                // Determine what's new (simple logic: ID check)
                const newSessions = result.data
                    .filter(r => !sessions.find(l => l.id === r.id))
                    .map(r => ({
                        ...r,
                        activityType: 'fingerboarding' as const,
                        // If backend doesn't return created/updated, mock it or ensure backend does.
                        // Backend models have CreatedAt, but api.ts Remote... currently might not exposing it fully?
                        // Actually api.ts RemoteFingerboardSession extends Payload + ID. Payload has date.
                        // Let's use date for now or add optional fields to Remote interface.
                        // Ideally we should fix api.ts to include these, but for now specific conversion:
                        createdAt: new Date().toISOString(), 
                        updatedAt: new Date().toISOString(),
                        syncStatus: 'synced' as const
                    }));
                
                sessions = [...sessions, ...newSessions].sort((a, b) => 
                    new Date(b.date).getTime() - new Date(a.date).getTime()
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

    // Grouping by Date
    function groupByDate(sess: FingerboardSession[]) {
        const groups: Record<string, FingerboardSession[]> = {};
        for (const s of sess) {
            if (!groups[s.date]) groups[s.date] = [];
            groups[s.date].push(s);
        }
        return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
    }
</script>

<div class="view-content">
	<div class="header">
		<h3>🤏 Fingerboarding Log</h3>
		<button class="refresh-btn" onclick={loadSessions} title="Refresh">↻</button>
	</div>

    {#if loading && sessions.length === 0}
        <div class="loading">Loading sessions...</div>
    {:else if sessions.length === 0}
        <div class="empty-state">No fingerboarding sessions logged yet.</div>
    {:else}
        <div class="timeline">
            {#each groupByDate(sessions) as [date, daysSessions]}
                <div class="date-group">
                    <div class="date-header">{new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                    
                    {#each daysSessions as session}
                        <div class="session-card">
                            <div class="exercises-list">
                                {#each session.exercises as exercise}
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
                            <div class="session-meta">
                                <span class="sync-status" class:synced={session.syncStatus === 'synced'}>
                                    {session.syncStatus === 'synced' ? '✓ Synced' : '☁ Local'}
                                </span>
                            </div>
                        </div>
                    {/each}
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
	.view-content {
		animation: fadeIn 0.3s ease;
	}

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }

	h3 {
		margin: 0;
		color: var(--teal-secondary);
	}

    .refresh-btn {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: var(--text-secondary);
        padding: 0 0.5rem;
    }

    .timeline {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .date-header {
        font-weight: 600;
        color: var(--text-secondary);
        margin-bottom: 0.8rem;
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        position: sticky;
        top: 0;
        background: var(--bg-primary);
        padding: 0.5rem 0;
        z-index: 10;
        border-bottom: 1px solid #eee;
    }

    .session-card {
        background: white;
        border-radius: 12px;
        padding: 1rem;
        box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        border: 1px solid #eee;
        margin-bottom: 1rem;
    }

    .exercises-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .exercise-item {
        padding-bottom: 0.8rem;
        border-bottom: 1px dashed #eee;
    }

    .exercise-item:last-child {
        border-bottom: none;
        padding-bottom: 0;
    }

    .ex-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.4rem;
    }

    .ex-name {
        font-weight: 600;
        color: var(--teal-primary);
    }

    .ex-grip {
        font-size: 0.85rem;
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
        font-size: 0.85rem;
        background: #eefdfd;
        color: var(--teal-secondary);
        padding: 0.2rem 0.6rem;
        border-radius: 6px;
        border: 1px solid rgba(74, 155, 155, 0.15);
    }

    .x {
        color: #aaa;
        font-size: 0.75rem;
        margin: 0 1px;
    }

    .ex-notes {
        font-size: 0.8rem;
        color: var(--text-secondary);
        font-style: italic;
        margin-top: 0.3rem;
    }

    .session-meta {
        margin-top: 0.8rem;
        display: flex;
        justify-content: flex-end;
        border-top: 1px solid #f5f5f5;
        padding-top: 0.5rem;
    }

    .sync-status {
        font-size: 0.75rem;
        color: #aaa;
    }

    .sync-status.synced {
        color: var(--teal-secondary);
    }

    .loading, .empty-state {
        text-align: center;
        padding: 2rem;
        color: var(--text-secondary);
        font-style: italic;
    }
</style>
