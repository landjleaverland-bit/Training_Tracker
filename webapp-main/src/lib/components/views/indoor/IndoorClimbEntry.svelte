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
	}

	let { climb, onDelete }: Props = $props();

	let isExpanded = $state(false);

	function toggleExpand() {
		isExpanded = !isExpanded;
	}
    
    function handleDelete(e: MouseEvent) {
        e.stopPropagation();
        onDelete();
    }
</script>

<div class="climb-entry" class:expanded={isExpanded}>
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
			{#if !isExpanded && climb.notes}
				<span class="notes-preview"> - {climb.notes}</span>
			{/if}
		</div>
		<div class="climb-meta">
			<span class="attempt-type" class:flash={climb.attemptType === 'Flash'}>
				{climb.attemptType}
				{#if climb.attemptType !== 'Flash'}
					<span class="attempts-count">({climb.attemptsNum})</span>
				{/if}
			</span>
            <button class="delete-btn" onclick={handleDelete} aria-label="Delete climb" title="Delete climb">🗑️</button>
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
			</div>
		</div>
	{/if}
</div>

<style>
	.climb-entry {
		border-bottom: 1px solid rgba(74, 155, 155, 0.1);
	}

	.climb-entry:last-child {
		border-bottom: none;
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

	.climb-header:hover {
		background: rgba(74, 155, 155, 0.05);
	}

	.climb-main-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex: 1; /* Allow it to take up space */
		min-width: 0; /* Enable truncation for children */
		margin-right: 1rem;
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
		gap: 1rem;
		flex-shrink: 0;
	}

	.attempt-type {
		font-size: 0.85rem;
		color: var(--text-secondary);
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.attempt-type.flash {
		color: var(--gold-secondary);
		font-weight: 600;
	}

    .delete-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        opacity: 0.5;
        transition: opacity 0.2s;
        font-size: 1rem;
    }
    
    .delete-btn:hover {
        opacity: 1;
        background: rgba(255, 0, 0, 0.1);
        border-radius: 4px;
    }

	.chevron {
		color: var(--text-secondary);
		font-size: 0.7rem;
		opacity: 0.5;
	}

	.climb-details {
		padding: 0.5rem 1rem 1rem 3rem;
		background: rgba(74, 155, 155, 0.02);
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
</style>
