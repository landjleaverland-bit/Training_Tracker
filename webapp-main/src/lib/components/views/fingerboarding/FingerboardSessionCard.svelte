<script lang="ts">
    import type { FingerboardSession } from '$lib/types/session';
    import { deleteFingerboardSession } from '$lib/services/api';
    import { invalidateAll } from '$app/navigation';
    import { slide } from 'svelte/transition';
    import DeleteConfirmModal from '$lib/components/common/DeleteConfirmModal.svelte';
    import EditSessionModal from '$lib/components/common/EditSessionModal.svelte';

    interface Props {
        session: FingerboardSession;
        onDelete: () => void;
    }

    let { session, onDelete }: Props = $props();

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
            const result = await deleteFingerboardSession(session.id);
            if (result.ok) {
                showDeleteModal = false;
                onDelete();
            } else {
                console.error('Failed to delete session:', result.error);
                alert('Failed to delete session');
            }
        } catch (e) {
            console.error('Exception deleting session:', e);
            alert('Error deleting session');
        }
    }

    function getTotalSets(s: FingerboardSession) {
        return s.exercises.reduce((acc, ex) => acc + ex.details.length, 0);
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
                <span class="time-tag">{session.time || '12:00'}</span>
            </span>
            <span class="meta">
                {#if session.location && session.location !== 'N/A' && session.location !== 'Home'}
                    {session.location} ·
                {/if}
                {session.exercises.length} Exercises · {getTotalSets(session)} Sets
            </span>
            <!-- Load Summary -->
            {#if session.fingerLoad}
                <div class="load-summary">
                    <div class="load-badge finger" title="Finger Load: {session.fingerLoad}">
                        {session.fingerLoad}
                    </div>
                    <div class="load-badge shoulder" title="Shoulder Load: {session.shoulderLoad}">
                        {session.shoulderLoad || '-'}
                    </div>
                    <div class="load-badge forearm" title="Forearm Load: {session.forearmLoad}">
                        {session.forearmLoad || '-'}
                    </div>
                </div>
            {/if}
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
            <!-- Load Metrics -->
            {#if session.fingerLoad}
                <div class="metrics-container">
                    <div class="metric">
                        <span class="label">Finger Load</span>
                        <div class="bar-container">
                            <div class="bar-fill" style="width: {((session.fingerLoad || 0) / 5) * 100}%"></div>
                        </div>
                        <span class="score">{session.fingerLoad}/5</span>
                    </div>
                    <div class="metric">
                        <span class="label">Shoulder Load</span>
                        <div class="bar-container">
                            <div class="bar-fill" style="width: {((session.shoulderLoad || 0) / 5) * 100}%"></div>
                        </div>
                        <span class="score">{session.shoulderLoad || 0}/5</span>
                    </div>
                    <div class="metric">
                        <span class="label">Forearm Load</span>
                        <div class="bar-container">
                            <div class="bar-fill" style="width: {((session.forearmLoad || 0) / 5) * 100}%"></div>
                        </div>
                        <span class="score">{session.forearmLoad || 0}/5</span>
                    </div>
                    {#if session.openGrip}
                        <div class="metric">
                            <span class="label">Open Grip</span>
                            <div class="bar-container">
                                <div class="bar-fill" style="width: {(session.openGrip / 5) * 100}%"></div>
                            </div>
                            <span class="score">{session.openGrip}/5</span>
                        </div>
                    {/if}
                    {#if session.crimpGrip}
                        <div class="metric">
                            <span class="label">Crimp Grip</span>
                            <div class="bar-container">
                                <div class="bar-fill" style="width: {(session.crimpGrip / 5) * 100}%"></div>
                            </div>
                            <span class="score">{session.crimpGrip}/5</span>
                        </div>
                    {/if}
                    {#if session.pinchGrip}
                        <div class="metric">
                            <span class="label">Pinch Grip</span>
                            <div class="bar-container">
                                <div class="bar-fill" style="width: {(session.pinchGrip / 5) * 100}%"></div>
                            </div>
                            <span class="score">{session.pinchGrip}/5</span>
                        </div>
                    {/if}
                    {#if session.sloperGrip}
                        <div class="metric">
                            <span class="label">Sloper Grip</span>
                            <div class="bar-container">
                                <div class="bar-fill" style="width: {(session.sloperGrip / 5) * 100}%"></div>
                            </div>
                            <span class="score">{session.sloperGrip}/5</span>
                        </div>
                    {/if}
                    {#if session.jugGrip}
                        <div class="metric">
                            <span class="label">Jug Grip</span>
                            <div class="bar-container">
                                <div class="bar-fill" style="width: {(session.jugGrip / 5) * 100}%"></div>
                            </div>
                            <span class="score">{session.jugGrip}/5</span>
                        </div>
                    {/if}
                </div>
            {/if}

            <div class="exercises-list">
                {#each session.exercises || [] as exercise}
                    <div class="exercise-item">
                        <div class="ex-header">
                            <div class="ex-title-group">
                                <span class="ex-name">{exercise.name}</span>
                                <span class="ex-grip">{exercise.gripType}</span>
                            </div>
                        </div>
                        <div class="ex-sets">
                            {#each exercise.details as set}
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

<DeleteConfirmModal
    isOpen={showDeleteModal}
    title="Delete Fingerboard Session"
    message="Are you sure you want to delete this session? This cannot be undone."
    onConfirm={confirmDeleteSession}
    onCancel={() => (showDeleteModal = false)}
/>

<EditSessionModal 
    isOpen={showEditModal} 
    activityType="fingerboarding" 
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

    .header-main {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
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
        background: rgba(0, 0, 0, 0.05);
        border-radius: 4px;
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
        border-bottom: none;
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

	.load-summary {
		display: flex;
		gap: 0.4rem;
        margin-top: 0.25rem;
	}

	.load-badge {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.65rem;
		font-weight: 700;
		color: white;
	}

	.load-badge.finger { background: #E57373; }
	.load-badge.shoulder { background: #64B5F6; }
	.load-badge.forearm { background: #81C784; }

	.metrics-container {
		display: flex;
		flex-wrap: wrap;
		gap: 1.5rem;
		padding: 1rem;
		margin-bottom: 1rem;
		background: white;
		border-radius: 8px;
		border: 1px solid rgba(0, 0, 0, 0.05);
	}

	@media (max-width: 480px) {
		.metrics-container {
			padding: 0.8rem;
			gap: 1rem;
		}
	}

	.metric {
		flex: 1;
		min-width: 100px;
	}

	.metric .label {
		display: block;
		font-size: 0.75rem;
		margin-bottom: 0.3rem;
		color: var(--text-secondary);
	}

	.bar-container {
		height: 6px;
		background: rgba(0, 0, 0, 0.05);
		border-radius: 3px;
		overflow: hidden;
		margin-bottom: 0.2rem;
	}

	.bar-fill {
		height: 100%;
		background: linear-gradient(90deg, var(--teal-secondary), var(--teal-primary));
		border-radius: 3px;
	}

	.metric .score {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--teal-secondary);
		display: block;
		text-align: right;
	}
</style>
