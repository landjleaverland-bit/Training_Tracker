<script lang="ts">
	// Indoor Climb Session Card
	import { slide } from 'svelte/transition';

	import type { IndoorClimbSession } from '$lib/types/session';
	import IndoorClimbEntry from './IndoorClimbEntry.svelte';
	import DeleteConfirmModal from '$lib/components/common/DeleteConfirmModal.svelte';
    import { updateIndoorSession, isOnline } from '$lib/services/api';
	import { deleteSession, updateSession, markAsSynced, markAsSyncError } from '$lib/services/cache';

	interface Props {
		session: IndoorClimbSession;
		onDelete: () => void;
	}

	let { session, onDelete }: Props = $props();

	let isExpanded = $state(false);
	let showDeleteModal = $state(false);

	function toggleExpand() {
		isExpanded = !isExpanded;
	}

	function handleDeleteSession() {
		showDeleteModal = true;
	}

	function confirmDeleteSession() {
		deleteSession(session.id);
		showDeleteModal = false;
		onDelete();
	}

	function handleClimbDelete(climbIndex: number) {
		const newClimbs = [...session.climbs];
		newClimbs.splice(climbIndex, 1);
		updateSession(session.id, { climbs: newClimbs });
		onDelete();
	}

    function handleClimbUpdate(climbIndex: number, updatedClimb: any) {
        const newClimbs = [...session.climbs];
        newClimbs[climbIndex] = updatedClimb;
        saveUpdates(newClimbs);
    }

    async function saveUpdates(newClimbs: any[]) {
        // Optimistic update locally
        updateSession(session.id, { climbs: newClimbs });
        
        // Propagate changes to parent (updates the list view immediately)
        session.climbs = newClimbs;

        // Sync to server
        if (isOnline()) {
             // We need to send the FULL session structure required by the API
             const sessionPayload = {
                date: session.date,
                location: session.location,
                customLocation: session.customLocation,
                climbingType: session.climbingType,
                trainingTypes: session.trainingTypes || [],
                difficulty: session.difficulty,
                categories: session.categories || [],
                energySystems: session.energySystems || [],
                wallAngles: session.wallAngles || [],

                fingerLoad: session.fingerLoad,
                shoulderLoad: session.shoulderLoad,
                forearmLoad: session.forearmLoad,
                openGrip: session.openGrip,
                crimpGrip: session.crimpGrip,
                pinchGrip: session.pinchGrip,
                sloperGrip: session.sloperGrip,
                jugGrip: session.jugGrip,
                climbs: newClimbs
             };

             try {
                const result = await updateIndoorSession(session.id, sessionPayload);
                if (result.ok) {
                    markAsSynced(session.id);
                    session.syncStatus = 'synced';
                } else {
                    console.error('Failed to sync update:', result.error);
                    markAsSyncError(session.id);
                    session.syncStatus = 'error';
                }
             } catch (e) {
                 console.error('Exception syncing update:', e);
                 markAsSyncError(session.id);
                 session.syncStatus = 'error';
             }
        }
    }

	// Calculate stats
	let climbCount = $derived(session.climbs?.length ?? 0);
	let maxGrade = $derived(
		(session.climbs || []).reduce((max, c) => {
			const num = parseInt(c.grade.replace(/\D/g, '')) || 0;
			const maxNum = parseInt(max.replace(/\D/g, '')) || 0;
			return num > maxNum ? c.grade : max;
		}, 'V0')
	);

    // Notes Editing
    let isEditingNotes = $state(false);
    let tempNotes = $state('');
    let isSavingNotes = $state(false);

    function startEditNotes() {
        tempNotes = session.notes || '';
        isEditingNotes = true;
    }

    function cancelEditNotes() {
        isEditingNotes = false;
        tempNotes = '';
    }

    async function saveNotes() {
        if (isSavingNotes) return;
        isSavingNotes = true;

        const previousNotes = session.notes;
        // Optimistic update
        session.notes = tempNotes;
        updateSession(session.id, { notes: tempNotes });
        
        if (isOnline()) {
             const sessionPayload = {
                date: session.date,
                location: session.location,
                customLocation: session.customLocation,
                climbingType: session.climbingType,
                trainingTypes: session.trainingTypes || [],
                difficulty: session.difficulty,
                categories: session.categories || [],
                energySystems: session.energySystems || [],
                wallAngles: session.wallAngles || [],
                fingerLoad: session.fingerLoad,
                shoulderLoad: session.shoulderLoad,
                forearmLoad: session.forearmLoad,
                openGrip: session.openGrip,
                crimpGrip: session.crimpGrip,
                pinchGrip: session.pinchGrip,
                sloperGrip: session.sloperGrip,
                jugGrip: session.jugGrip,
                climbs: session.climbs,
                notes: tempNotes // The updated notes
             };

             try {
                const result = await updateIndoorSession(session.id, sessionPayload);
                if (result.ok) {
                    markAsSynced(session.id);
                    session.syncStatus = 'synced';
                } else {
                    console.error('Failed to sync note update:', result.error);
                    markAsSyncError(session.id);
                    session.syncStatus = 'error';
                }
             } catch (e) {
                 console.error('Exception syncing note update:', e);
                 markAsSyncError(session.id);
                 session.syncStatus = 'error';
             }
        }
        
        isEditingNotes = false;
        isSavingNotes = false;
    }
</script>

<div class="session-card" class:expanded={isExpanded}>
	<div 
		class="card-header" 
		role="button" 
		tabindex="0" 
		onclick={toggleExpand} 
		onkeydown={(e) => e.key === 'Enter' && toggleExpand()}
		aria-expanded={isExpanded}
	>
		<div class="header-main">
			<div class="date-badge">
				<span class="day">{new Date(session.date).getDate()}</span>
				<span class="month">{new Date(session.date).toLocaleDateString('en-GB', { month: 'short' })}</span>
			</div>
			
			<div class="session-info">
				<div class="session-text">
					<h3 class="location">{session.location}</h3>
					<div class="session-meta">
						<span class="type-tag">{session.climbingType}</span>
						<span class="stat">{climbCount} climbs</span>
						{#if climbCount > 0}
							<span class="stat">Max: {maxGrade}</span>
						{/if}
					</div>
				</div>
				
				<!-- Load Summary (Right aligned, wraps on mobile if needed) -->
				<div class="load-summary">
					<div class="load-badge finger" title="Finger Load: {session.fingerLoad}">
						{session.fingerLoad}
					</div>
					<div class="load-badge shoulder" title="Shoulder Load: {session.shoulderLoad}">
						{session.shoulderLoad}
					</div>
					<div class="load-badge forearm" title="Forearm Load: {session.forearmLoad}">
						{session.forearmLoad}
					</div>
				</div>
			</div>
		</div>

		<div class="header-actions">
			<div class="header-status">
				{#if session.syncStatus === 'pending'}
					<span class="status-icon pending" title="Waiting to sync">🔄</span>
				{:else if session.syncStatus === 'error'}
					<span class="status-icon error" title="Sync error">⚠️</span>
				{/if}
			</div>
			
			<!-- Delete Button (Only visible when expanded or via hover, but better always accessible or in expanded view) -->
			<!-- Let's put it in the header but propagation stop -->
			<button 
				class="btn-icon delete-session" 
				title="Delete Session"
				onclick={(e) => { e.stopPropagation(); handleDeleteSession(); }}
			>
				🗑️
			</button>

			<span class="chevron">{isExpanded ? '▲' : '▼'}</span>
		</div>
	</div>

	{#if isExpanded}
		<div class="card-body" transition:slide={{ duration: 150 }}>
			<!-- Session Details -->
			<div class="details-grid">
				<div class="detail-item">
					<span class="label">Training Type</span>
					<div class="value-chips">
                        {#if session.trainingTypes && session.trainingTypes.length > 0 && !session.trainingTypes.includes('None')}
                            {#each session.trainingTypes as item}
                                <span class="chip">{item}</span>
                            {/each}
                        {:else}
                            <span class="text-none">None</span>
                        {/if}
                    </div>
				</div>
				{#if session.difficulty}
					<div class="detail-item">
						<span class="label">Difficulty</span>
						<span class="value">{session.difficulty}</span>
					</div>
				{/if}
				{#if session.categories?.length}
					<div class="detail-item">
						<span class="label">Category</span>
						<div class="value-chips">
                            {#if session.categories.length > 0 && !session.categories.includes('None')}
                                {#each session.categories as item}
                                    <span class="chip">{item}</span>
                                {/each}
                            {:else}
                                <span class="text-none">None</span>
                            {/if}
                        </div>
					</div>
				{/if}
                {#if session.energySystems?.length}
					<div class="detail-item">
						<span class="label">Energy System</span>
						<div class="value-chips">
                            {#if session.energySystems.length > 0 && !session.energySystems.includes('None')}
                                {#each session.energySystems as item}
                                    <span class="chip">{item}</span>
                                {/each}
                            {:else}
                                <span class="text-none">None</span>
                            {/if}
                        </div>
					</div>
				{/if}
				{#if session.wallAngles?.length}
					<div class="detail-item">
						<span class="label">Wall</span>
						<div class="value-chips">
                            {#if session.wallAngles.length > 0 && !session.wallAngles.includes('None')}
                                {#each session.wallAngles as item}
                                    <span class="chip">{item}</span>
                                {/each}
                            {:else}
                                <span class="text-none">None</span>
                            {/if}
                        </div>
					</div>
				{/if}

			</div>

            <!-- Session Notes Section with Edit Mode -->
            <div class="notes-container">
                <div class="notes-header">
                    <span class="label">Session Notes</span>
                    {#if !isEditingNotes}
                        <button class="icon-btn edit-notes-btn" onclick={startEditNotes} title="Edit Notes">
                            ✎
                        </button>
                    {/if}
                </div>

                {#if isEditingNotes}
                    <div class="edit-notes-area" transition:slide={{ duration: 150 }}>
                        <textarea 
                            bind:value={tempNotes} 
                            placeholder="Add session notes..." 
                            rows="3"
                            class="notes-editor"
                        ></textarea>
                        <div class="edit-actions">
                            <button class="cancel-btn" onclick={cancelEditNotes} disabled={isSavingNotes}>Cancel</button>
                            <button class="save-btn" onclick={saveNotes} disabled={isSavingNotes}>
                                {isSavingNotes ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                {:else}
                    {#if session.notes}
                        <p class="notes-text">{session.notes}</p>
                    {:else}
                         <p class="notes-placeholder">No notes.</p>
                    {/if}
                {/if}
            </div>

			<!-- Load Metrics -->
			<div class="metrics-container">
				<div class="metric">
					<span class="label">Finger Load</span>
					<div class="bar-container">
						<div class="bar-fill" style="width: {(session.fingerLoad / 5) * 100}%"></div>
					</div>
					<span class="score">{session.fingerLoad}/5</span>
				</div>
				<div class="metric">
					<span class="label">Shoulder Load</span>
					<div class="bar-container">
						<div class="bar-fill" style="width: {(session.shoulderLoad / 5) * 100}%"></div>
					</div>
					<span class="score">{session.shoulderLoad}/5</span>
				</div>
				<div class="metric">
					<span class="label">Forearm Load</span>
					<div class="bar-container">
						<div class="bar-fill" style="width: {(session.forearmLoad / 5) * 100}%"></div>
					</div>
					<span class="score">{session.forearmLoad}/5</span>
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

			<!-- Climbs List -->
			<div class="climbs-list">
				<h4>Climbs</h4>
				<div class="climbs-container">
					{#each session.climbs || [] as climb, i}
						<IndoorClimbEntry 
							{climb} 
							onDelete={() => handleClimbDelete(i)}
                            onUpdate={(updated) => handleClimbUpdate(i, updated)}
                            showClimbType={session.climbingType === 'Mixed'}
						/>
					{/each}
					{#if (session.climbs || []).length === 0}
						<p class="no-climbs">No climbs logged for this session.</p>
					{/if}
				</div>
			</div>
		</div>
	{/if}

    <DeleteConfirmModal 
        isOpen={showDeleteModal}
        title="Delete Session"
        message="Are you sure you want to delete this session? This action cannot be undone."
        onConfirm={confirmDeleteSession}
        onCancel={() => showDeleteModal = false}
    />
</div>
<style>
	.session-card {
		background: white;
		border-radius: 12px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
		border: 1px solid rgba(74, 155, 155, 0.15);
		margin-bottom: 1rem;
		overflow: hidden;
		transition: box-shadow 0.2s ease, border-color 0.2s ease;
		content-visibility: auto; 
		contain-intrinsic-size: 100px; /* Approximate height */
	}

	@media (max-width: 480px) {
		.session-card {
			border-radius: 8px;
			margin-bottom: 0.5rem;
			border-left: none;
			border-right: none;
			border-radius: 0;
		}
	}

	.session-card:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
		border-color: rgba(74, 155, 155, 0.3);
	}

	.session-card.expanded {
		border-color: var(--teal-primary);
		box-shadow: 0 4px 16px rgba(74, 155, 155, 0.15);
	}

	.card-header {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem;
		background: white;
		border: none;
		cursor: pointer;
		text-align: left;
	}

	@media (max-width: 480px) {
		.card-header {
			padding: 0.75rem 0.5rem;
		}
	}

	.header-main {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.date-badge {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: rgba(74, 155, 155, 0.1);
		padding: 0.5rem 0.75rem;
		border-radius: 8px;
		min-width: 50px;
	}

	.date-badge .day {
		font-weight: 700;
		font-size: 1.1rem;
		color: var(--teal-secondary);
		line-height: 1;
	}

	.date-badge .month {
		font-size: 0.75rem;
		text-transform: uppercase;
		color: var(--teal-secondary);
		font-weight: 600;
	}

	.session-info {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		flex: 1;
		flex-wrap: wrap; /* Wraps on very small screens */
	}

	.session-text {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		min-width: 120px;
	}

	.location {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.session-meta {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.85rem;
		color: var(--text-secondary);
	}

	.type-tag {
		background: rgba(244, 196, 48, 0.15);
		color: #bfa00d;
		padding: 0.1rem 0.4rem;
		border-radius: 4px;
		font-weight: 600;
		font-size: 0.75rem;
	}

	.stat {
		display: flex;
		align-items: center;
	}
	
	.stat::before {
		content: "•";
		margin-right: 0.5rem;
		opacity: 0.5;
	}

	.load-summary {
		display: flex;
		gap: 0.4rem;
		margin-top: 0;
	}

	.load-badge {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.7rem;
		font-weight: 700;
		color: white;
	}

	.load-badge.finger { background: #E57373; }
	.load-badge.shoulder { background: #64B5F6; }
	.load-badge.forearm { background: #81C784; }

	.header-status {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.status-icon {
		font-size: 1rem;
	}

	.chevron {
		color: var(--text-secondary);
		opacity: 0.5;
		font-size: 0.8rem;
	}

	.card-body {
		border-top: 1px solid rgba(0, 0, 0, 0.05);
		background: rgba(250, 250, 250, 0.5);
	}

	.details-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: 1rem;
		padding: 1.25rem 1.25rem 0 1.25rem;
	}

	@media (max-width: 480px) {
		.details-grid {
			padding: 1rem 0.75rem 0 0.75rem;
			gap: 0.8rem;
			grid-template-columns: 1fr 1fr;
		}
	}

	.detail-item {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.detail-item .label {
		font-size: 0.75rem;
		text-transform: uppercase;
		color: var(--text-secondary);
		letter-spacing: 0.05em;
	}

	.detail-item .value {
		font-weight: 500;
		color: var(--text-primary);
		font-size: 0.95rem;
	}

    .value-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
        margin-top: 0.1rem;
    }

    .chip {
        background: rgba(74, 155, 155, 0.1);
        color: var(--teal-secondary);
        padding: 0.2rem 0.5rem;
        border-radius: 6px;
        font-size: 0.8rem;
        font-weight: 500;
        line-height: 1.2;
    }

    .text-none {
        color: var(--text-secondary);
        font-style: italic;
        font-size: 0.9rem;
        opacity: 0.7;
    }

	.metrics-container {
		display: flex;
		flex-wrap: wrap;
		gap: 1.5rem;
		padding: 1.25rem;
		margin: 1rem 1.25rem;
		background: white;
		border-radius: 8px;
		border: 1px solid rgba(0, 0, 0, 0.05);
	}

    .notes-container {
        padding: 0 1.25rem;
        margin-top: 0.5rem;
    }

    .notes-container .label {
        display: block;
        font-size: 0.75rem;
        text-transform: uppercase;
        color: var(--text-secondary);
        letter-spacing: 0.05em;
    }

    .notes-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.3rem;
    }

    .icon-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        opacity: 0.5;
        transition: opacity 0.2s, background 0.2s;
        font-size: 1rem;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
    }
    
    .icon-btn:hover {
        opacity: 1;
        background: rgba(0, 0, 0, 0.05);
    }

    .notes-text {
        display: block;
        width: 100%;
        text-align: left;
        border: none;
        font-family: inherit;
        font-size: 0.95rem;
        color: var(--text-primary);
        line-height: 1.5;
        background: rgba(74, 155, 155, 0.05);
        padding: 0.75rem;
        border-radius: 8px;
        margin: 0;
        white-space: pre-wrap;
    }
    
    .notes-placeholder {
        display: block;
        width: 100%;
        text-align: left;
        background: none;
        font-size: 0.9rem;
        color: var(--text-secondary);
        font-style: italic;
        padding: 0.5rem;
        border: 1px dashed rgba(0,0,0,0.1);
        border-radius: 4px;
        margin: 0;
    }

    .notes-editor {
        width: 100%;
        padding: 0.6rem;
        border: 1px solid var(--teal-secondary);
        border-radius: 8px;
        font-family: inherit;
        font-size: 0.95rem;
        resize: vertical;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        margin-bottom: 0.5rem;
    }

    .edit-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
    }

    .cancel-btn {
        background: none;
        border: none;
        color: var(--text-secondary);
        font-size: 0.9rem;
        cursor: pointer;
        padding: 0.4rem 0.8rem;
    }

    .cancel-btn:hover {
        color: var(--text-primary);
    }

    .save-btn {
        background: var(--teal-secondary);
        color: white;
        border: none;
        border-radius: 6px;
        padding: 0.4rem 1rem;
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .save-btn:hover:not(:disabled) {
        background: var(--teal-primary);
    }
    
    .save-btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

	@media (max-width: 480px) {
		.metrics-container {
			padding: 0.8rem;
			margin: 0.8rem 0.75rem;
			gap: 1rem;
		}
	}

	.metric {
		flex: 1;
		min-width: 120px;
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

	.climbs-list {
		padding: 0 1.25rem 1.25rem 1.25rem;
	}

	@media (max-width: 480px) {
		.climbs-list {
			padding: 0 0.5rem 1rem 0.5rem;
		}
	}

	.climbs-list h4 {
		margin: 0 0 0.75rem 0;
		font-size: 0.95rem;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.climbs-container {
		background: white;
		border-radius: 8px;
		border: 1px solid rgba(74, 155, 155, 0.15);
		overflow: hidden;
	}

	.no-climbs {
		padding: 1.5rem;
		text-align: center;
		color: var(--text-secondary);
		font-style: italic;
		margin: 0;
		font-size: 0.9rem;
	}
</style>
