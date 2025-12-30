<script lang="ts">
    import { getCompetitionSessions, markAsSynced, markAsSyncError } from '$lib/services/cache';
    import { getCompetitionSessions as fetchRemote } from '$lib/services/api';
    import type { CompetitionSession } from '$lib/types/session';

    let sessions = $state<CompetitionSession[]>([]);
    let loading = $state(true);

    async function loadSessions() {
        loading = true;
        // Load local first
        sessions = getCompetitionSessions().sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        // Then try remote sync
        try {
            const result = await fetchRemote();
            if (result.ok && result.data) {
                const newSessions = result.data
                    .filter(r => !sessions.find(l => l.id === r.id))
                    .map(r => ({
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

    function getResultSummary(session: CompetitionSession) {
        if (!session.rounds || session.rounds.length === 0) return 'No rounds';
        const lastRound = session.rounds[session.rounds.length - 1];
        
        if (lastRound.position !== undefined && lastRound.position !== null) {
            return `Position: #${lastRound.position}`;
        }
        
        if (lastRound.climbs) {
            const tops = lastRound.climbs.filter(c => c.status === 'Top' || c.status === 'Flash').length;
            const zones = lastRound.climbs.filter(c => c.status === 'Zone').length;
            return `${tops} Tops · ${zones + tops} Zones`;
        }
        
        return lastRound.name;
    }
</script>

<div class="view-content">
	<div class="header">
		<h3>🏆 Competition Log</h3>
		<button class="refresh-btn" onclick={loadSessions} title="Refresh">↻</button>
	</div>

    {#if loading && sessions.length === 0}
        <div class="loading">Loading sessions...</div>
    {:else if sessions.length === 0}
        <div class="empty-state">No competitions logged yet.</div>
    {:else}
        <div class="timeline">
            {#each sessions as session}
                <div class="session-card">
                    <div class="card-top">
                        <div class="session-date">
                            {new Date(session.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                        </div>
                        <div class="venue-badge">{session.customVenue || session.venue}</div>
                    </div>
                    
                    <div class="session-info">
                        <div class="info-row">
                            <span class="type-tag">{session.type}</span>
                            <span class="result-summary">{getResultSummary(session)}</span>
                        </div>
                        
                        {#if session.rounds}
                            <div class="rounds-list">
                                {#each session.rounds as round}
                                    <div class="round-item">
                                        <div class="round-name">{round.name}</div>
                                        {#if round.climbs}
                                            <div class="climbs-grid">
                                                {#each round.climbs as climb}
                                                    <div class="climb-badge" class:top={climb.status === 'Top' || climb.status === 'Flash'} class:zone={climb.status === 'Zone'}>
                                                        <span class="c-name">{climb.name}</span>
                                                        <span class="c-status">
                                                            {#if climb.status === 'Flash'}⚡
                                                            {:else if climb.status === 'Top'}T
                                                            {:else if climb.status === 'Zone'}Z
                                                            {:else}-
                                                            {/if}
                                                        </span>
                                                    </div>
                                                {/each}
                                            </div>
                                        {/if}
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>

                    <div class="session-meta">
                        <span class="sync-status" class:synced={session.syncStatus === 'synced'}>
                            {session.syncStatus === 'synced' ? '✓ Synced' : '☁ Local'}
                        </span>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
	.view-content { animation: fadeIn 0.3s ease; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
	h3 { margin: 0; color: var(--teal-secondary); }

    .refresh-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-secondary); padding: 0 0.5rem; }

    .timeline { display: flex; flex-direction: column; gap: 1rem; }

    .session-card {
        background: white; border-radius: 12px; padding: 1rem;
        box-shadow: 0 2px 8px rgba(0,0,0,0.04); border: 1px solid #eee;
    }

    .card-top { display: flex; justify-content: space-between; margin-bottom: 0.8rem; align-items: center; }
    .session-date { font-weight: 600; color: var(--text-primary); }
    .venue-badge { font-size: 0.8rem; background: #f8f9fa; padding: 0.2rem 0.6rem; border-radius: 4px; color: var(--text-secondary); border: 1px solid #eee; }

    .info-row { display: flex; gap: 0.8rem; align-items: center; margin-bottom: 1rem; }
    .type-tag { font-size: 0.75rem; background: var(--teal-primary); color: white; padding: 0.2rem 0.5rem; border-radius: 4px; }
    .result-summary { font-weight: 600; color: var(--text-primary); font-size: 0.95rem; }

    .rounds-list { display: flex; flex-direction: column; gap: 0.8rem; }
    .round-name { font-size: 0.8rem; font-weight: 600; color: #aaa; margin-bottom: 0.4rem; text-transform: uppercase; }

    .climbs-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    
    .climb-badge {
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        width: 40px; height: 40px; border-radius: 6px;
        background: #f8f9fa; border: 1px solid #eee;
        font-size: 0.75rem;
    }

    .climb-badge.top { background: #d4edda; border-color: #c3e6cb; color: #155724; }
    .climb-badge.zone { background: #fff3cd; border-color: #ffeeba; color: #856404; }

    .c-name { font-weight: 600; font-size: 0.7rem; margin-bottom: -2px; }
    .c-status { font-weight: 700; font-size: 0.9rem; }

    .session-meta { margin-top: 1rem; display: flex; justify-content: flex-end; border-top: 1px solid #f5f5f5; padding-top: 0.5rem; }
    .sync-status { font-size: 0.75rem; color: #aaa; }
    .sync-status.synced { color: var(--teal-secondary); }

    .loading, .empty-state { text-align: center; padding: 2rem; color: var(--text-secondary); font-style: italic; }
</style>
