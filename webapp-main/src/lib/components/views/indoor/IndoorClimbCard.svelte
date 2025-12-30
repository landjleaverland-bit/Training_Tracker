<script lang="ts">
	// Indoor Climb Session Card
	import { slide } from 'svelte/transition';
	import type { IndoorClimbSession } from '$lib/types/session';
	import IndoorClimbEntry from './IndoorClimbEntry.svelte';
	import DeleteConfirmModal from '$lib/components/common/DeleteConfirmModal.svelte';
	import { deleteSession, updateSession } from '$lib/services/cache';

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

	// Calculate stats
	let climbCount = $derived(session.climbs.length);
	let maxGrade = $derived(
		session.climbs.reduce((max, c) => {
			const num = parseInt(c.grade.replace(/\D/g, '')) || 0;
			const maxNum = parseInt(max.replace(/\D/g, '')) || 0;
			return num > maxNum ? c.grade : max;
		}, 'V0')
	);
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
		<div class="card-body" transition:slide={{ duration: 200 }}>
			<!-- Session Details -->
			<div class="details-grid">
				<div class="detail-item">
					<span class="label">Training Type</span>
					<span class="value">{session.trainingType}</span>
				</div>
				{#if session.difficulty}
					<div class="detail-item">
						<span class="label">Difficulty</span>
						<span class="value">{session.difficulty}</span>
					</div>
				{/if}
				{#if session.category}
					<div class="detail-item">
						<span class="label">Category</span>
						<span class="value">{session.category}</span>
					</div>
				{/if}
				{#if session.techniqueFocus}
					<div class="detail-item">
						<span class="label">Focus</span>
						<span class="value">{session.techniqueFocus}</span>
					</div>
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
			</div>

			<!-- Climbs List -->
			<div class="climbs-list">
				<h4>Climbs</h4>
				<div class="climbs-container">
					{#each session.climbs as climb, i}
						<IndoorClimbEntry 
							{climb} 
							onDelete={() => handleClimbDelete(i)}
                            showClimbType={session.climbingType === 'Mixed'}
						/>
					{/each}
					{#if session.climbs.length === 0}
						<p class="no-climbs">No climbs logged for this session.</p>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>

<DeleteConfirmModal 
	isOpen={showDeleteModal}
	title="Delete Session"
	message="Are you sure you want to delete this session and all its climbs? This cannot be undone."
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
