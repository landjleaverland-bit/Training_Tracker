<script lang="ts">
	import { slide } from 'svelte/transition';
	import type { GymSession } from '$lib/types/session';
	import DeleteConfirmModal from '$lib/components/common/DeleteConfirmModal.svelte';
	import { deleteSession } from '$lib/services/cache';

	interface Props {
		session: GymSession;
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
	
	// Stats
	let exerciseCount = $derived(session.exercises?.length ?? 0);
	let totalSets = $derived((session.exercises || []).reduce((sum, ex) => sum + (ex.sets?.length || 0), 0));
	let totalVolume = $derived((session.exercises || []).reduce((sum, ex) => {
		return sum + (ex.sets || []).reduce((sSum, set) => sSum + (set.weight || 0) * (set.reps || 0), 0);
	}, 0));

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
					<h3 class="name">{session.name}</h3>
					<div class="session-meta">
						<span class="stat">{exerciseCount} exercises</span>
						<span class="stat">{totalSets} sets</span>
						<span class="stat">~{Math.round(totalVolume)}kg vol</span>
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
			{#if session.bodyweight}
				<div class="bw-info">
					<span class="label">Bodyweight:</span> {session.bodyweight}kg
				</div>
			{/if}
			
			<div class="exercises-list">
				{#each session.exercises as exercise}
					<div class="exercise-item">
						<h4>{exercise.name}</h4>
						<div class="sets-grid">
							{#each exercise.sets as set, i}
								<div class="set-pill" class:completed={set.completed}>
									{#if set.isWarmup}<span class="tag">W</span>{/if}
									{#if set.isFailure}<span class="tag">F</span>{/if}
									{#if set.isDropSet}<span class="tag">D</span>{/if}
									<span class="val">{set.weight}kg x {set.reps}</span>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<DeleteConfirmModal 
	isOpen={showDeleteModal}
	title="Delete Session"
	message="Are you sure you want to delete this session? This cannot be undone."
	onConfirm={confirmDeleteSession}
	onCancel={() => showDeleteModal = false}
/>

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
		contain-intrinsic-size: 80px;
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
		flex-direction: column;
		gap: 0.2rem;
	}

	.name {
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

	.stat::before {
		content: "•";
		margin-right: 0.5rem;
		opacity: 0.5;
	}
	
	.stat:first-child::before {
		content: "";
		margin-right: 0;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.status-icon {
		font-size: 1rem;
	}

	.btn-icon {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 1.1rem;
		padding: 0.3rem;
		border-radius: 4px;
		transition: background 0.2s;
	}
	
	.btn-icon:hover {
		background: rgba(0,0,0,0.05);
	}

	.chevron {
		color: var(--text-secondary);
		opacity: 0.5;
		font-size: 0.8rem;
	}

	.card-body {
		border-top: 1px solid rgba(0, 0, 0, 0.05);
		background: rgba(250, 250, 250, 0.5);
		padding: 1.25rem;
	}
	
	.bw-info {
		font-size: 0.9rem;
		color: var(--text-secondary);
		margin-bottom: 1rem;
		font-style: italic;
	}
	
	.bw-info .label {
		font-weight: 600;
		font-style: normal;
	}

	.exercises-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.exercise-item h4 {
		margin: 0 0 0.5rem 0;
		font-size: 1rem;
		color: var(--teal-primary);
	}

	.sets-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.set-pill {
		background: white;
		border: 1px solid rgba(0,0,0,0.1);
		padding: 0.25rem 0.5rem;
		border-radius: 6px;
		font-size: 0.85rem;
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}
	
	.set-pill.completed {
		background: rgba(16, 185, 129, 0.1);
		border-color: rgba(16, 185, 129, 0.3);
	}

	.tag {
		font-size: 0.7rem;
		font-weight: bold;
		padding: 0 0.2rem;
		background: rgba(0,0,0,0.1);
		border-radius: 3px;
		color: var(--text-secondary);
	}
</style>
