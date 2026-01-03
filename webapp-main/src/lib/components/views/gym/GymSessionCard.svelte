<script lang="ts">
	import { EXERCISE_LIBRARY } from '$lib/data/exercises';
	import type { GymSession, GymExercise, GymSet } from '$lib/types/session';
	import { deleteSession } from '$lib/services/cache';
	import { slide } from 'svelte/transition';
	import DeleteConfirmModal from '$lib/components/common/DeleteConfirmModal.svelte';

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

	function getExerciseDef(name: string) {
		return EXERCISE_LIBRARY.find((e) => e.name === name);
	}

	// Stats
	let exerciseCount = $derived(session.exercises?.length ?? 0);
	let totalSets = $derived(
		(session.exercises || []).reduce(
			(sum: number, ex: GymExercise) => sum + (ex.sets?.length || 0),
			0
		)
	);
	let totalVolume = $derived(
		(session.exercises || []).reduce((sum: number, ex: GymExercise) => {
			return (
				sum +
				(ex.sets || []).reduce(
					(sSum: number, set: GymSet) => sSum + (set.weight || 0) * (set.reps || 0),
					0
				)
			);
		}, 0)
	);

	let groupedExercises = $derived(
		(session.exercises || []).reduce(
			(acc, ex) => {
				const def = getExerciseDef(ex.name);
				const cat = def?.category || 'Other';
				const subcat = def?.subcategory || 'Misc';

				if (!acc[cat]) acc[cat] = {};
				if (!acc[cat][subcat]) acc[cat][subcat] = [];
				acc[cat][subcat].push(ex);
				return acc;
			},
			{} as Record<string, Record<string, GymExercise[]>>
		)
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
				<span class="month"
					>{new Date(session.date).toLocaleDateString('en-GB', { month: 'short' })}</span
				>
                                <span class="year">{new Date(session.date).getFullYear()}</span>
			</div>

			<div class="session-info">
				<div class="session-text">
					<h3 class="name">{session.name}</h3>
					<div class="session-meta">
						<span class="stat">{exerciseCount} Exercises</span>
						<span class="stat">{totalSets} Sets</span>
						<span class="stat">~{Math.round(totalVolume).toLocaleString()}kg Vol</span>
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
			{#if session.bodyweight}
				<div class="bw-info">
					<span class="label">Bodyweight:</span>
					{session.bodyweight}kg
				</div>
			{/if}

			<div class="exercises-list">
				{#each Object.entries(groupedExercises) as [category, subcategories]}
					<div class="category-group">
						<h4 class="category-header">{category}</h4>
						{#each Object.entries(subcategories) as [subcategory, exercises]}
							<div class="subcategory-group">
								<h5 class="subcategory-header">{subcategory}</h5>
								{#each exercises as exercise}
									{@const def = getExerciseDef(exercise.name)}
									<div class="exercise-item">
										<div class="exercise-header">
											<h4>{exercise.name}</h4>
											{#if def}
												<div class="muscle-tags">
													{#each def.targetMuscles.slice(0, 3) as muscle}
														<span class="muscle-tag">{muscle}</span>
													{/each}
													{#if def.targetMuscles.length > 3}
														<span class="muscle-tag">+{def.targetMuscles.length - 3}</span>
													{/if}
												</div>
											{/if}
										</div>

										<div class="sets-grid">
											{#each exercise.sets as set, i}
												<div
													class="set-pill"
													class:completed={set.completed}
													class:warmup={set.isWarmup}
												>
													<span class="set-num">{i + 1}</span>
													{#if set.isWarmup}<span class="tag w">W</span>{/if}
													{#if set.isFailure}<span class="tag f">F</span>{/if}
													{#if set.isDropSet}<span class="tag d">D</span>{/if}
													<span class="val">
														<span class="weight">{set.weight}kg</span>
														<span class="x">x</span>
														<span class="reps">{set.reps}</span>
													</span>
												</div>
											{/each}
										</div>
									</div>
								{/each}
							</div>
						{/each}
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
	onCancel={() => (showDeleteModal = false)}
/>

<style>
	.session-card {
		background: white;
		border-radius: 16px;
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.05),
			0 2px 4px -1px rgba(0, 0, 0, 0.03);
		border: 1px solid rgba(0, 0, 0, 0.05);
		margin-bottom: 1rem;
		overflow: hidden;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		content-visibility: auto;
		contain-intrinsic-size: 80px;
	}

	.session-card:hover {
		box-shadow:
			0 10px 15px -3px rgba(0, 0, 0, 0.05),
			0 4px 6px -2px rgba(0, 0, 0, 0.025);
		transform: translateY(-1px);
	}

	.session-card.expanded {
		border-color: var(--teal-primary);
		box-shadow: 0 0 0 1px var(--teal-primary);
	}

	.card-header {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.25rem;
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
		background: linear-gradient(135deg, rgba(74, 155, 155, 0.1), rgba(74, 155, 155, 0.2));
		padding: 0.5rem 0.75rem;
		border-radius: 12px;
		min-width: 56px;
	}

	.date-badge .day {
		font-weight: 800;
		font-size: 1.25rem;
		color: var(--teal-secondary);
		line-height: 1;
		margin-bottom: 2px;
	}

	.date-badge .month {
		font-size: 0.7rem;
		text-transform: uppercase;
		color: var(--teal-secondary);
		font-weight: 700;
		letter-spacing: 0.5px;
	}

	.date-badge .year {
		font-size: 0.7rem;
		color: var(--teal-secondary);
		font-weight: 600;
		line-height: 1;
		margin-top: 2px;
		opacity: 0.8;
	}

	.session-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.name {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--text-primary);
		letter-spacing: -0.01em;
	}

	.session-meta {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.85rem;
		color: var(--text-secondary);
		font-weight: 500;
	}

	.stat::before {
		content: '•';
		margin-right: 0.5rem;
		opacity: 0.5;
	}

	.stat:first-child::before {
		content: '';
		margin-right: 0;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.status-icon {
		font-size: 1rem;
	}

	.btn-icon {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 1.1rem;
		padding: 0.5rem;
		border-radius: 8px;
		transition: background 0.2s;
		opacity: 0.6;
	}

	.btn-icon:hover {
		background: rgba(0, 0, 0, 0.05);
		opacity: 1;
	}

	.btn-icon.delete-session:hover {
		background: rgba(239, 68, 68, 0.1);
		color: #ef4444;
	}

	.chevron {
		color: var(--text-secondary);
		opacity: 0.5;
		font-size: 0.8rem;
		transition: transform 0.2s;
	}

	.card-body {
		border-top: 1px solid rgba(0, 0, 0, 0.05);
		background: rgba(249, 250, 251, 0.5);
		padding: 1.25rem;
	}

	.bw-info {
		font-size: 0.9rem;
		color: var(--text-secondary);
		margin-bottom: 1.25rem;
		font-style: italic;
		background: rgba(0, 0, 0, 0.02);
		display: inline-block;
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
	}

	.bw-info .label {
		font-weight: 600;
		font-style: normal;
	}

	.exercises-list {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.exercise-header {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.exercise-item h4 {
		margin: 0;
		font-size: 1rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.muscle-tags {
		display: flex;
		gap: 0.35rem;
	}

	.muscle-tag {
		font-size: 0.7rem;
		background: rgba(74, 155, 155, 0.1);
		color: var(--teal-secondary);
		padding: 0.1rem 0.4rem;
		border-radius: 4px;
		font-weight: 600;
	}

	.sets-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
	}

	.set-pill {
		background: white;
		border: 1px solid rgba(0, 0, 0, 0.08);
		padding: 0.4rem 0.75rem;
		border-radius: 8px;
		font-size: 0.9rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
		font-family: 'Geist Mono', monospace; /* If available, or sans */
	}

	.set-num {
		font-size: 0.75rem;
		color: var(--text-secondary);
		opacity: 0.7;
		margin-right: 0.2rem;
	}

	.set-pill.completed {
		background: rgba(16, 185, 129, 0.05);
		border-color: rgba(16, 185, 129, 0.3);
	}

	.set-pill.warmup {
		background: rgba(251, 191, 36, 0.05);
		border-color: rgba(251, 191, 36, 0.3);
	}

	.val {
		display: flex;
		align-items: baseline;
		gap: 0.1rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.val .x {
		font-size: 0.75rem;
		color: var(--text-secondary);
		margin: 0 0.2rem;
	}

	.tag {
		font-size: 0.65rem;
		font-weight: 800;
		width: 16px;
		height: 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
	}

	.tag.w {
		background: rgba(251, 191, 36, 0.2);
		color: #b45309;
	}
	.tag.f {
		background: rgba(239, 68, 68, 0.2);
		color: #b91c1c;
	}
	.tag.d {
		background: rgba(99, 102, 241, 0.2);
		color: #4338ca;
	}

	.category-group {
		margin-bottom: 1.5rem;
		background: white;
		border-radius: 8px;
	}

	.category-header {
		margin: 0 0 0.5rem 0;
		color: var(--teal-secondary);
		font-size: 1.1rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border-bottom: 2px solid rgba(74, 155, 155, 0.1);
		padding-bottom: 0.25rem;
	}

	.subcategory-group {
		margin-bottom: 1rem;
		padding-left: 0.5rem;
		border-left: 2px solid rgba(0, 0, 0, 0.05);
	}

	.subcategory-header {
		margin: 0 0 0.5rem 0;
		color: var(--text-secondary);
		font-size: 0.9rem;
		font-weight: 600;
		text-transform: uppercase;
	}
</style>
