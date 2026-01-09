<script lang="ts">
    import type { CompetitionSession } from '$lib/types/session';
    import { deleteCompetitionSession } from '$lib/services/api';
    import { invalidateAll } from '$app/navigation';
    import { slide } from 'svelte/transition';
    import DeleteConfirmModal from '$lib/components/common/DeleteConfirmModal.svelte';
    import EditSessionModal from '$lib/components/common/EditSessionModal.svelte';

    interface Props {
        session: CompetitionSession;
    }

    let { session }: Props = $props();

    let isExpanded = $state(false);
    let showDeleteModal = $state(false);
    let showEditModal = $state(false);

    function toggleExpand() {
        isExpanded = !isExpanded;
    }

    function handleDeleteSession() {
        showDeleteModal = true;
    }
    
    function handleEditSession() {
        showEditModal = true;
    }

    function closeEditModal() {
        showEditModal = false;
    }
    
    async function handleSessionSaved() {
        showEditModal = false;
        await invalidateAll();
    }

    async function confirmDeleteSession() {
        try {
            const result = await deleteCompetitionSession(session.id);
            if (result.ok) {
                showDeleteModal = false;
                await invalidateAll();
            } else {
                console.error('Failed to delete session:', result.error);
                alert('Failed to delete session');
            }
        } catch (e) {
            console.error('Exception deleting session:', e);
            alert('Error deleting session');
        }
    }

    function getResultSummary(session: CompetitionSession) {
        // Quick summary for header
        if (!session.rounds || session.rounds.length === 0) return 'No rounds';
        const lastRound = session.rounds[session.rounds.length - 1]; // usually Final

        if (lastRound.position) return `#${lastRound.position} ${lastRound.name}`;

        if (lastRound.climbs) {
            const tops = lastRound.climbs.filter(
                (c) => c.status === 'Top' || c.status === 'Flash'
            ).length;
            const zones = lastRound.climbs.filter((c) => c.status === 'Zone').length;
            return `${session.rounds.length} Rnds · Final: ${tops}T ${zones + tops}Z`;
        }
        return lastRound.name;
    }
    
    function getStatusClass(status: string) {
        switch (status) {
            case 'Flash': return 'status-flash';
            case 'Top': return 'status-top';
            case 'Zone': return 'status-zone';
            default: return 'status-attempt';
        }
    }
</script>

<div class="session-card" class:expanded={isExpanded}>
    <div
        class="card-header"
        role="button"
        tabindex="0"
        onclick={toggleExpand}
        onkeydown={(e) => e.key === 'Enter' && toggleExpand()}
    >
        <div class="header-main">
            <span class="session-date">
                {new Date(session.date).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                })}
                <span class="type-tag">{session.type}</span>
            </span>
            <div class="venue-row">
                <span class="venue">
                    {session.venue === 'Other' ? session.customVenue : session.venue}
                </span>
                <span class="result-summary">
                    {getResultSummary(session)}
                </span>
            </div>
        </div>
        
        <div class="header-status">
            <span
                class="sync-dot"
                class:synced={session.syncStatus === 'synced'}
                title={session.syncStatus === 'synced' ? 'Synced' : 'Local'}>●</span
            >
            
            <button
                class="btn-icon edit-session"
                title="Edit Session"
                onclick={(e) => {
                    e.stopPropagation();
                    handleEditSession();
                }}
            >
                ✏️
            </button>
            <button
                class="btn-icon delete-btn"
                title="Delete Session"
                onclick={(e) => {
                    e.stopPropagation();
                    handleDeleteSession();
                }}
            >
                🗑️
            </button>

            <span class="chevron">{isExpanded ? '▲' : '▼'}</span>
        </div>
    </div>

    {#if isExpanded}
        <div class="card-body" transition:slide={{ duration: 150 }}>
            <!-- Loads -->
            <div class="loads-row">
                <div class="load-item">
                    <span class="label">Fingers</span>
                    <div class="bar-container">
                        <div class="bar" style="width: {(session.fingerLoad || 0) * 20}%"></div>
                    </div>
                </div>
                <div class="load-item">
                    <span class="label">Shoulders</span>
                    <div class="bar-container">
                        <div class="bar" style="width: {(session.shoulderLoad || 0) * 20}%"></div>
                    </div>
                </div>
                <div class="load-item">
                    <span class="label">Forearms</span>
                    <div class="bar-container">
                        <div class="bar" style="width: {(session.forearmLoad || 0) * 20}%"></div>
                    </div>
                </div>
            </div>

            <!-- Notes -->
            {#if session.notes}
                <div class="notes-section">
                    <div class="notes-display">
                        <span class="note-icon">📝</span>
                        <p>{session.notes}</p>
                    </div>
                </div>
            {/if}

            <!-- Rounds -->
            <div class="rounds-list">
                {#each session.rounds as round}
                    <div class="round-card">
                        <div class="round-header">
                            <h4>{round.name}</h4>
                            {#if round.position}
                                <span class="position-badge">#{round.position}</span>
                            {/if}
                        </div>
                        
                        {#if round.climbs && round.climbs.length > 0}
                            <div class="climbs-grid">
                                {#each round.climbs as climb}
                                    <div class="climb-chip {getStatusClass(climb.status)}">
                                        <span class="climb-name">{climb.name}</span>
                                        <span class="climb-status">{climb.status}</span>
                                        {#if climb.attemptCount > 1}
                                            <span class="climb-attempts">({climb.attemptCount})</span>
                                        {/if}
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
        </div>
    {/if}
</div>

<DeleteConfirmModal
    isOpen={showDeleteModal}
    title="Delete Competition Session"
    message="Are you sure you want to delete this session? This cannot be undone."
    onConfirm={confirmDeleteSession}
    onCancel={() => (showDeleteModal = false)}
/>

<EditSessionModal 
    isOpen={showEditModal} 
    activityType="competition" 
    initialData={session} 
    onClose={closeEditModal} 
    onSaved={handleSessionSaved} 
/>

<style>
    .session-card {
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        border: 1px solid #eee;
        overflow: hidden;
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

    .header-main {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
    }

    .session-date {
        font-weight: 600;
        color: var(--teal-primary);
        font-size: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .type-tag {
        font-size: 0.75rem;
        background: #eefdfd;
        color: var(--teal-secondary);
        padding: 0.1rem 0.4rem;
        border-radius: 4px;
        font-weight: 500;
    }

    .venue-row {
        font-size: 0.9rem;
        color: var(--text-secondary);
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }
    
    .result-summary {
        font-weight: 600;
        color: var(--text-primary);
    }
    
    .header-status {
        display: flex;
        align-items: center;
        gap: 0.8rem;
    }

    .sync-dot { font-size: 0.6rem; color: #ccc; }
    .sync-dot.synced { color: var(--teal-secondary); }
    .chevron { color: #aaa; font-size: 0.8rem; }
    
    .btn-icon {
        background: none; border: none; cursor: pointer; padding: 4px;
        opacity: 0.6; transition: opacity 0.2s; font-size: 0.9rem;
    }
    .btn-icon:hover { opacity: 1; background: rgba(0,0,0,0.05); border-radius: 4px; }

    .card-body {
        border-top: 1px solid #f5f5f5;
        background: #fafafa;
        padding: 1rem;
    }

    .loads-row {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 1rem;
        margin-bottom: 1.5rem;
    }
    
    .load-item { text-align: center; }
    .label { font-size: 0.75rem; color: var(--text-secondary); display: block; margin-bottom: 0.3rem; }
    
    .bar-container {
        height: 6px;
        background: #eee;
        border-radius: 3px;
        overflow: hidden;
    }
    
    .bar {
        height: 100%;
        background: linear-gradient(90deg, #86efac, #3b82f6);
    }

    .notes-section {
        background: white;
        padding: 0.8rem;
        border-radius: 8px;
        border: 1px solid #eee;
        margin-bottom: 1.5rem;
    }
    
    .notes-display { display: flex; gap: 0.5rem; }
    .note-icon { font-size: 1.1rem; }
    .notes-display p { margin: 0; font-size: 0.9rem; color: var(--text-secondary); line-height: 1.4; }

    .rounds-list { display: flex; flex-direction: column; gap: 1rem; }
    
    .round-card {
        background: white;
        border: 1px solid #eee;
        border-radius: 8px;
        padding: 0.8rem;
    }
    
    .round-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.8rem;
    }
    
    .round-header h4 { margin: 0; font-size: 0.95rem; color: var(--teal-secondary); }
    
    .position-badge {
        background: var(--gold-primary); /* Assuming gold var exists or fallback */
        background-color: #ffd700;
        color: #856404;
        font-weight: 700;
        padding: 0.2rem 0.6rem;
        border-radius: 12px;
        font-size: 0.8rem;
    }

    .climbs-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }
    
    .climb-chip {
        display: flex;
        align-items: center;
        gap: 0.3rem;
        padding: 0.3rem 0.6rem;
        border-radius: 6px;
        font-size: 0.85rem;
        border: 1px solid transparent;
    }
    
    .status-flash { background: #dcfce7; color: #166534; border-color: #bbf7d0; }
    .status-top { background: #dbeafe; color: #1e40af; border-color: #bfdbfe; }
    .status-zone { background: #fef9c3; color: #854d0e; border-color: #fde047; }
    .status-attempt { background: #f3f4f6; color: #4b5563; border-color: #e5e7eb; }
    
    .climb-name { font-weight: 600; }
    .climb-attempts { font-size: 0.75rem; opacity: 0.8; }
</style>
