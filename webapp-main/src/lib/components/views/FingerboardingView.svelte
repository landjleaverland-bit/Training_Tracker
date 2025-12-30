<script lang="ts">
    import { getFingerboardSessions } from '$lib/services/cache';
    import { getFingerboardSessions as fetchRemote } from '$lib/services/api';
    import type { FingerboardSession } from '$lib/types/session';
    import { slide } from 'svelte/transition';

    let sessions = $state<FingerboardSession[]>([]);
    let loading = $state(true);
    let startDate = $state('');
    let endDate = $state('');
    let expandedDetails = $state<Set<string>>(new Set());

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
                        
                        // Use date if created/updated At are missing or correct case
                        createdAt: r.createdAt || new Date().toISOString(),
                        updatedAt: r.updatedAt || new Date().toISOString(),
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

    let filteredSessions = $derived(
        sessions.filter(s => {
            if (startDate && new Date(s.date) < new Date(startDate)) return false;
            if (endDate && new Date(s.date) > new Date(endDate)) return false;
            return true;
        })
    );

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
		<button class="refresh-btn" onclick={loadSessions} title="Refresh">↻</button>
	</div>

    <div class="filters">
        <div class="filter-group">
            <label for="start-date">From</label>
            <input type="date" id="start-date" bind:value={startDate}>
        </div>
        <div class="filter-group">
            <label for="end-date">To</label>
            <input type="date" id="end-date" bind:value={endDate}>
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
            {#each groupByDate(filteredSessions) as [date, daysSessions]}
                <div class="date-group">
                    <div class="date-header">{new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                    
                    {#each daysSessions as session}
                        <div class="session-card" class:expanded={expandedDetails.has(session.id)}>
                            <button class="card-header" onclick={() => toggleExpand(session.id)}>
                                <div class="header-main">
                                    <span class="location">{session.location}</span>
                                    <span class="meta">{session.exercises.length} Exercises · {getTotalSets(session)} Sets</span>
                                </div>
                                <div class="header-status">
                                    <span class="sync-dot" class:synced={session.syncStatus === 'synced'} title={session.syncStatus === 'synced' ? 'Synced' : 'Local'}>●</span>
                                    <span class="chevron">{expandedDetails.has(session.id) ? '▲' : '▼'}</span>
                                </div>
                            </button>

                            {#if expandedDetails.has(session.id)}
                                <div class="card-body" transition:slide={{ duration: 200 }}>
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
                                </div>
                            {/if}
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
        padding-bottom: 2rem;
    }

    .date-header {
        font-weight: 600;
        color: var(--text-secondary);
        margin-bottom: 0.6rem;
        font-size: 0.85rem;
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
        box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        border: 1px solid #eee;
        margin-bottom: 0.8rem;
        overflow: hidden;
    }

    .card-header {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background: white;
        border: none;
        cursor: pointer;
        text-align: left;
    }

    .header-main {
        display: flex;
        flex-direction: column;
    }

    .location {
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
    .sync-dot.synced { color: var(--teal-secondary); }

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

    .loading, .empty-state {
        text-align: center;
        padding: 2rem;
        color: var(--text-secondary);
        font-style: italic;
    }
</style>
