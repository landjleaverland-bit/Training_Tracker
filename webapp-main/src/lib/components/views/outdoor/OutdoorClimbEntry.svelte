<script lang="ts">
	// Single climb entry row component
	import { slide } from 'svelte/transition';

	interface Props {
		climb: {
			isSport: boolean;
			name: string;
			grade: string;
			attemptType: string;
			attemptsNum: number;
			notes: string;
		};
		onDelete: () => void;
        onUpdate: (updatedClimb: any) => void;
        showClimbType?: boolean;
	}

	let { climb, onDelete, onUpdate, showClimbType = false }: Props = $props();

	let isExpanded = $state(false);
    let isEditing = $state(false);
    
    // Edit state
    let editName = $state('');
    let editGrade = $state('');
    let editAttemptType = $state('');
    let editAttemptsNum = $state(1);
    let editNotes = $state('');
    let editIsSport = $state(false);

	function toggleExpand() {
        if (!isEditing) {
		    isExpanded = !isExpanded;
        }
	}
    
    function handleDelete(e: MouseEvent) {
        e.stopPropagation();
        onDelete();
    }

    function startEditing(e: MouseEvent) {
        e.stopPropagation();
        editName = climb.name;
        editGrade = climb.grade;
        editAttemptType = climb.attemptType;
        editAttemptsNum = climb.attemptsNum;
        editNotes = climb.notes;
        editIsSport = climb.isSport;
        isEditing = true;
        isExpanded = true;
    }

    function cancelEditing(e: MouseEvent) {
        e.stopPropagation();
        isEditing = false;
    }

    function saveEdit(e: MouseEvent) {
        e.stopPropagation();
        
        const updatedClimb = {
            ...climb,
            name: editName,
            grade: editGrade,
            attemptType: editAttemptType,
            attemptsNum: editAttemptsNum,
            notes: editNotes,
            isSport: editIsSport
        };
        
        onUpdate(updatedClimb);
        isEditing = false;
    }
    
    function handleAttemptTypeChange() {
        if (editAttemptType === 'Flash' || editAttemptType === 'Onsight') {
            editAttemptsNum = 1;
        }
    }

	const attemptIcons: Record<string, string> = {
		'Flash': '⚡',
		'Onsight': '👁️',
		'Redpoint': '🔴',
		'Dogged': '🛠️',
		'DNF': '❌'
	};
    
    const attemptTypes = ['Flash', 'Onsight', 'Redpoint', 'Dogged', 'DNF'];
</script>

<div class="climb-entry" class:expanded={isExpanded} class:editing={isEditing}>
    {#if isEditing}
        <!-- Edit Mode -->
        <div class="edit-form">
            <div class="edit-row main">
                <input 
                    type="text" 
                    bind:value={editGrade} 
                    class="edit-input grade" 
                    placeholder="Grade"
                />
                <input 
                    type="text" 
                    bind:value={editName} 
                    class="edit-input name" 
                    placeholder="Route Name" 
                />
                 {#if showClimbType}
                    <label class="type-toggle">
                        <input type="checkbox" bind:checked={editIsSport} />
                        <span>Sport?</span>
                    </label>
                {/if}
            </div>
            
            <div class="edit-row meta">
                <select bind:value={editAttemptType} onchange={handleAttemptTypeChange} class="edit-select">
                    {#each attemptTypes as type}
                        <option value={type}>{type}</option>
                    {/each}
                </select>
                
                <div class="attempts-input-wrapper">
                    <span>#</span>
                    <input 
                        type="number" 
                        bind:value={editAttemptsNum} 
                        min="1" 
                        class="edit-input num" 
                        disabled={editAttemptType === 'Flash' || editAttemptType === 'Onsight'}
                    />
                </div>
            </div>
            
            <div class="edit-row notes">
                <textarea 
                    bind:value={editNotes} 
                    class="edit-input notes-area" 
                    placeholder="Notes..."
                ></textarea>
            </div>
            
            <div class="edit-actions">
                <button class="action-btn cancel" onclick={cancelEditing}>Cancel</button>
                <button class="action-btn save" onclick={saveEdit}>Save</button>
            </div>
        </div>
    {:else}
        <!-- Display Mode -->
        <div 
            class="climb-header" 
            role="button" 
            tabindex="0" 
            onclick={toggleExpand} 
            onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleExpand()}
            aria-expanded={isExpanded}
        >
            <div class="climb-main-info">
                <span class="grade-badge" class:sport={climb.isSport}>{climb.grade}</span>
                <span class="climb-name">{climb.name || 'Unnamed Route'}</span>
                {#if showClimbType}
                    <span class="climb-type-tag">{climb.isSport ? 'Sport' : 'Boulder'}</span>
                {/if}
                {#if !isExpanded && climb.notes}
                    <span class="notes-preview"> - {climb.notes}</span>
                {/if}
            </div>
            <div class="climb-meta">
                <span class="attempt-type" class:flash={climb.attemptType === 'Flash'}>
                    <span class="icon">{attemptIcons[climb.attemptType] || climb.attemptType}</span>
                    {#if climb.attemptType !== 'Flash' && climb.attemptType !== 'Onsight'}
                        <span class="attempts-count">{climb.attemptsNum}</span>
                    {/if}
                </span>
                
                <button class="icon-btn edit-btn" onclick={startEditing} aria-label="Edit climb" title="Edit climb">✎</button>
                <button class="icon-btn delete-btn" onclick={handleDelete} aria-label="Delete climb" title="Delete climb">🗑️</button>
                
                <span class="chevron">{isExpanded ? '▲' : '▼'}</span>
            </div>
        </div>

        {#if isExpanded}
            <div class="climb-details" transition:slide={{ duration: 150 }}>
                {#if climb.notes}
                    <div class="detail-row">
                        <span class="label">Notes:</span>
                        <p class="notes">{climb.notes}</p>
                    </div>
                {:else}
                    <p class="empty-notes">No notes for this climb.</p>
                {/if}
                
                <div class="tags">
                    <span class="tag type">{climb.isSport ? 'Sport' : 'Boulder'}</span>
                    <span class="tag attempt-text">{climb.attemptType}</span>
                </div>
            </div>
        {/if}
    {/if}
</div>

<style>
	.climb-entry {
		border-bottom: 1px solid rgba(74, 155, 155, 0.1);
	}

	.climb-entry:last-child {
		border-bottom: none;
	}
    
    .climb-entry.editing {
        background: rgba(74, 155, 155, 0.05);
    }

	.climb-header {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 0.5rem;
		background: none;
		border: none;
		cursor: pointer;
		text-align: left;
		transition: background 0.2s ease;
	}

	/* Reduce padding on mobile */
	@media (max-width: 480px) {
		.climb-header {
			padding: 0.6rem 0.25rem;
		}
	}

	.climb-header:hover {
		background: rgba(74, 155, 155, 0.05);
	}

	.climb-main-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex: 1; /* Allow it to take up space */
		min-width: 0; /* Enable truncation for children */
		margin-right: 0.5rem;
	}

	@media (max-width: 480px) {
		.climb-main-info {
			gap: 0.5rem;
		}
	}

	.grade-badge {
		background: var(--teal-secondary);
		color: white;
		padding: 0.2rem 0.5rem;
		border-radius: 6px;
		font-weight: 700;
		font-size: 0.85rem;
		min-width: 36px;
		text-align: center;
		flex-shrink: 0;
	}

	.grade-badge.sport {
		background: #E67E22; /* Different color for sport routes */
	}

	.climb-name {
		font-weight: 500;
		color: var(--text-primary);
		font-size: 0.95rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

    .climb-type-tag {
        font-size: 0.7rem;
        padding: 0.1rem 0.4rem;
        border-radius: 4px;
        background: rgba(0, 0, 0, 0.05);
        color: var(--text-secondary);
        font-weight: 600;
        text-transform: uppercase;
		flex-shrink: 0;
    }

	.notes-preview {
		color: var(--text-secondary);
		font-size: 0.85rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		opacity: 0.7;
	}

	.climb-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	@media (max-width: 480px) {
		.climb-meta {
			gap: 0.3rem;
		}
	}

	.attempt-type {
		font-size: 0.9rem;
		color: var(--text-secondary);
		display: flex;
		align-items: center;
		gap: 0.2rem;
		min-width: 30px;
		justify-content: flex-end;
        margin-right: 0.5rem;
	}

	.attempt-type .icon {
		font-size: 1rem;
	}

	.attempts-count {
		font-size: 0.8rem;
		font-weight: 600;
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
    
    .delete-btn:hover {
        background: rgba(255, 0, 0, 0.1);
        color: red;
    }

	.chevron {
		color: var(--text-secondary);
		font-size: 0.7rem;
		opacity: 0.5;
        margin-left: 0.2rem;
	}

	.climb-details {
		padding: 0.5rem 1rem 1rem 3rem;
		background: rgba(74, 155, 155, 0.02);
	}
	
	@media (max-width: 480px) {
		.climb-details {
			padding: 0.5rem 0.5rem 1rem 1rem;
		}
	}

	.detail-row {
		margin-bottom: 0.5rem;
	}

	.label {
		display: block;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-secondary);
		margin-bottom: 0.2rem;
	}

	.notes {
		font-size: 0.9rem;
		color: var(--text-primary);
		line-height: 1.4;
		margin: 0;
		white-space: pre-wrap;
	}

	.empty-notes {
		font-style: italic;
		color: var(--text-secondary);
		font-size: 0.85rem;
		margin: 0 0 0.5rem 0;
	}

	.tags {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	.tag {
		font-size: 0.75rem;
		padding: 0.15rem 0.5rem;
		border-radius: 4px;
		background: rgba(0, 0, 0, 0.05);
		color: var(--text-secondary);
	}
    
    /* Edit Mode Styles */
    .edit-form {
        padding: 0.75rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }
    
    .edit-row {
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }
    
    .edit-row.main {
        flex-wrap: wrap;
    }
    
    .edit-input, .edit-select {
        padding: 0.4rem 0.6rem;
        border: 1px solid rgba(0,0,0,0.15);
        border-radius: 6px;
        font-size: 0.9rem;
    }
    
    .edit-input.grade {
        width: 60px;
        font-weight: 700;
        text-align: center;
        color: var(--teal-secondary);
    }
    
    .edit-input.name {
        flex: 1;
        min-width: 120px;
    }
    
    .type-toggle {
        display: flex;
        align-items: center;
        gap: 0.3rem;
        font-size: 0.8rem;
        color: var(--text-secondary);
    }
    
    .attempts-input-wrapper {
        display: flex;
        align-items: center;
        gap: 0.3rem;
        color: var(--text-secondary);
        font-size: 0.9rem;
    }
    
    .edit-input.num {
        width: 50px;
    }
    
    .edit-input.notes-area {
        width: 100%;
        min-height: 60px;
        resize: vertical;
        font-family: inherit;
    }
    
    .edit-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        margin-top: 0.25rem;
    }
    
    .action-btn {
        padding: 0.4rem 0.8rem;
        border-radius: 6px;
        border: none;
        font-size: 0.85rem;
        font-weight: 600;
        cursor: pointer;
    }
    
    .action-btn.cancel {
        background: rgba(0,0,0,0.05);
        color: var(--text-secondary);
    }
    
    .action-btn.save {
        background: var(--teal-secondary);
        color: white;
    }
</style>
