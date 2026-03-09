<script lang="ts">
	/**
	 * @file GymSessionForm.svelte
	 * @component
	 * @description Form for logging gym workouts (GymSession).
	 * Features include:
	 * - Training block selection (Strength, Power, etc.)
	 * - Rest timer integration
	 * - Plate calculator
	 * - Exercise history benchmarking
	 */
	import { onMount } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	import type { GymSession, GymExercise, GymSet } from '$lib/types/session';
	import { EXERCISE_LIBRARY, type ExerciseDefinition } from '$lib/data/exercises';
	import { createGymSession, updateGymSession, getGymSessions } from '$lib/services/api';

	// Components
	import ExerciseCard from './gym/ExerciseCard.svelte';

	import RestTimer from './gym/RestTimer.svelte';
	import PlateCalculator from './gym/PlateCalculator.svelte';
	import DeleteConfirmModal from '$lib/components/common/DeleteConfirmModal.svelte';
	import SessionNotes from '$lib/components/ui/SessionNotes.svelte';
	import { fly, fade } from 'svelte/transition';

	const dispatch = createEventDispatcher();
	const STORAGE_KEY = 'gym_session_draft';

	// Props
	interface Props {
		initialData?: GymSession | null;
		onCancel?: () => void;
		onSaved?: () => void;
	}

	let { initialData = null, onCancel, onSaved }: Props = $props();
	let isEditing = $derived(!!initialData);

	// State
	let bodyweight = $state<number | undefined>(undefined);
	let exercises = $state<GymExercise[]>([]);
	let startTime = $state(new Date().toISOString().split('T')[0]);
	let time = $state(new Date().toTimeString().split(' ')[0].slice(0, 5));
	let trainingBlock = $state<'Strength' | 'Power' | 'Power Endurance' | 'Muscular Endurance'>(
		'Strength'
	);
	let previousSession = $state<GymSession | null>(null);
	let allSessions = $state<GymSession[]>([]);

	let notes = $state('');
	let isTBC = $state(false); // Default to false

	// Load history for benchmarks
	onMount(async () => {
		if (initialData) {
			// Populate form from initialData
			bodyweight = initialData.bodyweight;
			exercises = initialData.exercises;
			startTime = initialData.date;
			time = initialData.time || '12:00';
			trainingBlock = initialData.trainingBlock || 'Strength';
			notes = initialData.notes || '';
			isTBC = initialData.isTBC !== undefined ? initialData.isTBC : false;
			loaded = true;
		} else {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved) {
				try {
					const data = JSON.parse(saved);
					if (data.bodyweight) bodyweight = data.bodyweight;
					if (data.startTime) startTime = data.startTime;
					if (data.time) time = data.time;
					if (data.trainingBlock) trainingBlock = data.trainingBlock;
					if (data.exercises) exercises = data.exercises;
					if (data.notes) notes = data.notes;
					if (data.isTBC !== undefined) isTBC = data.isTBC;
				} catch (e) {
					console.error('Failed to restore draft', e);
				}
			}
			loaded = true;
		}

		const result = await getGymSessions();
		if (result.ok && result.data) {
			// @ts-ignore - map to local type
			allSessions = result.data.map((s) => ({
				...s,
				activityType: 'gym_session' as const,
				syncStatus: 'synced' as const
			}));
		}
	});

	$effect(() => {
		const blockSessions = allSessions.filter(
			(s) => (s.trainingBlock || 'Strength') === trainingBlock && s.date < startTime
		);
		blockSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
		previousSession = blockSessions.length > 0 ? blockSessions[0] : null;
	});

	function getRecentBenchmarks(exerciseName: string) {
		const currentSessionId = isEditing && initialData ? initialData.id : null;

		const pastSessions = allSessions.filter((s) => {
			if (currentSessionId && s.id === currentSessionId) return false;
			if ((s.trainingBlock || 'Strength') !== trainingBlock) return false;
			if (s.date > startTime) return false;
			if (s.date === startTime) {
				const sTime = s.time || '00:00';
				const cTime = time || '00:00';
				if (sTime >= cTime) return false;
			}
			return true;
		});

		const sortedSessions = pastSessions.sort((a, b) => {
			const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
			const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
			return dateB.getTime() - dateA.getTime();
		});

		const benchmarks = [];

		for (const session of sortedSessions) {
			const ex = session.exercises.find((e) => e.name === exerciseName);
			if (ex && ex.difficulty) {
				// Find best set (Max weight)
				let bestSet: GymSet | null = null;
				for (const set of ex.sets) {
					if (!bestSet || set.weight > bestSet.weight) {
						bestSet = set;
					} else if (set.weight === bestSet.weight && set.reps > bestSet.reps) {
						bestSet = set;
					}
				}

				if (bestSet) {
					benchmarks.push({
						date: session.date,
						difficulty: ex.difficulty,
						weight: bestSet.weight,
						reps: bestSet.reps
					});
					if (benchmarks.length >= 3) break;
				}
			}
		}
		return benchmarks;
	}

	// UI State
	let showExercisePicker = $state(false);
	let searchQuery = $state('');
	let selectedCategory = $state('');
	let selectedSubcategory = $state(''); // New state
	let showPlateCalc = $state(false);
	let plateCalcWeight = $state(0);
	let showRestTimer = $state(false);
	let activeExerciseDetail = $state<ExerciseDefinition | null>(null);
	let exerciseToDeleteIndex = $state<number | null>(null);
	let showSuccess = $state(false);
	let activeTimerExerciseId = $state<string | null>(null);
	let timerDefaultSets = $state(3);
	let lastCompletedExerciseId = $state<string | null>(null);

	// Persistence
	let loaded = $state(false);

	$effect(() => {
		if (loaded && !isEditing && typeof localStorage !== 'undefined') {
			const draft = {
				bodyweight,
				startTime,
				time,
				trainingBlock,
				exercises,
				notes,
				isTBC
			};
			localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
		}
	});

	// Filtered exercises for picker
	let filteredExercises = $derived(
		EXERCISE_LIBRARY.filter((e) => {
			// Search overrides filters
			if (searchQuery) {
				return (
					e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
					e.targetMuscles.some((m) => m.toLowerCase().includes(searchQuery.toLowerCase()))
				);
			}

			// Otherwise filter by dropdowns
			const matchesCategory = selectedCategory ? e.category === selectedCategory : true;
			const matchesSubcategory = selectedSubcategory ? e.subcategory === selectedSubcategory : true;
			return matchesCategory && matchesSubcategory;
		})
	);

	const categories = Array.from(new Set(EXERCISE_LIBRARY.map((e) => e.category))).sort();

	// Reactive subcategories based on selected category
	let availableSubcategories = $derived(
		selectedCategory
			? Array.from(
					new Set(
						EXERCISE_LIBRARY.filter((e) => e.category === selectedCategory).map(
							(e) => e.subcategory
						)
					)
				).sort()
			: []
	);

	// Reset subcategory when category changes
	function handleCategoryChange() {
		selectedSubcategory = '';
	}

	function addExercise(def: ExerciseDefinition) {
		const newExercise: GymExercise = {
			id: crypto.randomUUID(),
			name: def.name,
			sets: [
				{
					weight: 0,
					reps: 0,
					isWarmup: false,
					isFailure: false,
					isDropSet: false,
					completed: false
				}
			]
		};
		exercises = [...exercises, newExercise];
		showExercisePicker = false;
		searchQuery = '';
		selectedCategory = '';
		selectedSubcategory = '';
	}

	function handleExerciseTimer(event: CustomEvent) {
		const exercise = event.detail;
		activeTimerExerciseId = exercise.id;
		// Count total sets for this exercise as default
		timerDefaultSets = exercise.sets.length;
		showRestTimer = true;
	}

	function handleSetComplete() {
		// No longer auto-starting timer globally
	}

	/**
	 * Validates and saves the gym session to Firestore.
	 */
	async function saveSession() {
		if (exercises.length === 0) return;

		const sessionPayload = {
			date: startTime,
			time,
			name: 'Gym Workout',
			bodyweight,
			trainingBlock,
			exercises,
			notes,
			isTBC
		};

		const result =
			isEditing && initialData
				? await updateGymSession(initialData.id, sessionPayload)
				: await createGymSession(sessionPayload);

		if (result.ok) {
			showSuccess = true;
			if (!isEditing) {
				localStorage.removeItem(STORAGE_KEY);
				isTBC = false; // reset
			}

			if (onSaved) {
				// If managed by parent (modal)
				onSaved();
			} else {
				setTimeout(() => {
					showSuccess = false;
					dispatch('save');
				}, 1500);
			}
		} else {
			console.error('Failed to save gym session', result.error);
			// Optionally show error state
		}
	}
</script>

<div class="gym-session-form">
	<!-- Header Input -->
	<div class="session-meta">
		{#if !isEditing}
			<div
				class="form-header-row"
				style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;"
			>
				<h2 style="margin: 0; font-size: 1.25rem; color: var(--teal-primary);">New Gym Session</h2>
			</div>
		{/if}

		<div class="meta-row">
			<label>
				Date
				<div class="date-time-row">
					<input type="date" bind:value={startTime} />
					<input type="time" bind:value={time} />
				</div>
			</label>
			<label>
				Bodyweight (kg)
				<input type="number" bind:value={bodyweight} placeholder="Optional" />
			</label>
			<label>
				Block
				<select bind:value={trainingBlock}>
					<option value="Strength">Strength</option>
					<option value="Power">Power</option>
					<option value="Power Endurance">Power Endurance</option>
					<option value="Muscular Endurance">Muscular Endurance</option>
				</select>
			</label>
		</div>
	</div>

	<!-- Active Exercises -->
	<div class="exercises-list">
		{#each exercises as exercise, i}
			<ExerciseCard
				{exercise}
				benchmarks={getRecentBenchmarks(exercise.name)}
				on:complete={handleSetComplete}
				on:timer={handleExerciseTimer}
				on:delete={() => {
					exerciseToDeleteIndex = i;
				}}
			/>
		{/each}
	</div>

	<!-- Add Exercise Button -->
	<button class="add-exercise-btn" onclick={() => (showExercisePicker = true)}>
		+ Add Exercise
	</button>

	<!-- Session Notes Section -->
	<div class="session-notes-container">
		<SessionNotes
			bind:value={notes}
			placeholder="How did the workout feel? Energy, sleep, stress..."
		/>
	</div>

	<!-- Save Button -->
	{#if exercises.length > 0}
		<div class="tbc-checkbox-wrapper">
			<input type="checkbox" id="tbc-checkbox" bind:checked={isTBC} />
			<label
				for="tbc-checkbox"
				class="tbc-label"
				title="Mark this session as To Be Completed (e.g., if you plan to add more exercises or notes later)"
			>
				<span class="custom-checkbox"></span>
				TBC (To Be Completed)
			</label>
		</div>

		<button
			class="save-btn"
			class:success={showSuccess}
			onclick={saveSession}
			disabled={showSuccess}
		>
			{#if showSuccess}
				<span>Saved! ✓</span>
			{:else}
				Finish Workout
			{/if}
		</button>
	{/if}

	<!-- Exercise Picker Modal -->
	{#if showExercisePicker}
		<div
			class="modal-overlay"
			role="button"
			tabindex="0"
			onclick={() => (showExercisePicker = false)}
			onkeydown={(e) => e.key === 'Escape' && (showExercisePicker = false)}
			transition:fade
			aria-label="Close modal"
		>
			<div
				class="picker-modal"
				role="dialog"
				aria-modal="true"
				onclick={(e) => e.stopPropagation()}
				onkeydown={(e) => e.stopPropagation()}
				tabindex="-1"
				transition:fly={{ y: 100, duration: 300 }}
			>
				<div class="picker-header">
					<h3>Add Exercise</h3>

					<!-- Search Bar -->
					<div class="search-row">
						<input type="text" placeholder="Search exercises..." bind:value={searchQuery} />
					</div>

					<!-- Category Dropdowns (only show if no search query) -->
					{#if !searchQuery}
						<div class="filter-row">
							<select
								bind:value={selectedCategory}
								onchange={handleCategoryChange}
								class="category-select"
							>
								<option value="">Select Category...</option>
								{#each categories as cat}
									<option value={cat}>{cat}</option>
								{/each}
							</select>

							<select
								bind:value={selectedSubcategory}
								disabled={!selectedCategory}
								class="subcategory-select"
							>
								<option value="">Select Subcategory...</option>
								{#each availableSubcategories as sub}
									<option value={sub}>{sub}</option>
								{/each}
							</select>
						</div>
					{/if}
				</div>

				<div class="picker-content">
					<div class="exercise-list-simple">
						{#each filteredExercises as def}
							<button class="exercise-item-simple" onclick={() => addExercise(def)}>
								<span class="name">{def.name}</span>
								{#if searchQuery}
									<span class="details">{def.category} - {def.subcategory}</span>
								{/if}
							</button>
						{/each}
						{#if filteredExercises.length === 0}
							<div class="no-results">
								{searchQuery
									? 'No exercises found'
									: 'Select a category and subcategory to view exercises.'}
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Rest Timer -->
	<RestTimer
		bind:visible={showRestTimer}
		defaultSets={timerDefaultSets}
		associatedExerciseId={activeTimerExerciseId}
	/>

	<!-- Delete Confirmation -->
	{#if exerciseToDeleteIndex !== null}
		<DeleteConfirmModal
			isOpen={true}
			title="Delete Exercise"
			message="Are you sure you want to delete {exercises[exerciseToDeleteIndex].name}?"
			requireInput={false}
			onConfirm={() => {
				if (exerciseToDeleteIndex !== null) {
					exercises = exercises.filter((_, idx) => idx !== exerciseToDeleteIndex);
					exerciseToDeleteIndex = null;
				}
			}}
			onCancel={() => (exerciseToDeleteIndex = null)}
		/>
	{/if}
</div>

<style>
	.gym-session-form {
		padding-bottom: 100px; /* Space for fixed elements */
	}

	.session-meta {
		background: var(--bg-secondary);
		padding: 1rem;
		border-radius: 12px;
		margin-bottom: 1rem;
	}

	.meta-row {
		display: flex;
		gap: 1rem;
	}

	.date-time-row {
		display: flex;
		gap: 0.5rem;
	}

	.date-time-row input[type='date'] {
		flex: 2;
	}

	.date-time-row input[type='time'] {
		flex: 1;
		min-width: 0;
	}

	@media (max-width: 640px) {
		.meta-row {
			flex-direction: column;
			gap: 0.5rem;
		}

		.search-row {
			flex-direction: column;
		}

		.filter-row {
			flex-direction: column;
		}
	}

	.search-row {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	.filter-row {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	.filter-row select {
		flex: 1;
		padding: 0.75rem;
		background: var(--bg-tertiary);
		border: 1px solid var(--border-primary);
		border-radius: 8px;
		color: var(--text-primary);
		font-size: 1rem;
	}

	.filter-row select:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.search-row input {
		flex: 1;
		margin-top: 0;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		color: var(--text-secondary);
		font-size: 0.8rem;
		flex: 1;
	}

	input[type='number'],
	input[type='date'],
	.meta-row select {
		background: var(--bg-tertiary);
		border: 1px solid var(--border-primary);
		padding: 0.5rem;
		border-radius: 6px;
		color: var(--text-primary);
		font-size: 1rem; /* Prevent iOS zoom */
	}

	.add-exercise-btn {
		width: 100%;
		padding: 1rem;
		background: var(--bg-secondary);
		border: 2px dashed var(--border-primary);
		color: var(--teal-primary);
		font-weight: bold;
		border-radius: 12px;
		cursor: pointer;
		margin-bottom: 2rem;
		transition: all 0.2s;
	}

	.add-exercise-btn:hover {
		background: rgba(45, 212, 191, 0.1);
		border-color: var(--teal-primary);
	}

	.save-btn {
		width: 100%;
		padding: 1rem;
		background: var(--teal-primary);
		color: black;
		font-weight: bold;
		border: none;
		border-radius: 12px;
		font-size: 1.1rem;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.save-btn.success {
		background: #4ade80; /* Green color */
		color: #064e3b;
		transform: scale(0.98);
	}

	/* Modal Styles */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.8);
		backdrop-filter: blur(4px);
		z-index: 1000;
		display: flex;
		align-items: flex-end; /* Bottom sheet style */
	}

	.picker-modal {
		background: var(--bg-secondary);
		width: 100%;
		max-height: 80vh;
		border-top-left-radius: 20px;
		border-top-right-radius: 20px;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.picker-header {
		padding: 1rem;
		border-bottom: 1px solid var(--border-primary);
	}

	.picker-header input {
		width: 100%;
		padding: 0.75rem;
		margin-top: 0.5rem;
		background: var(--bg-tertiary);
		border: 1px solid var(--border-primary);
		border-radius: 8px;
		color: var(--text-primary);
		font-size: 1rem;
	}

	.picker-content {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
	}

	.exercise-list-simple {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.exercise-item-simple {
		background: var(--bg-tertiary);
		padding: 1rem;
		border: none;
		border-radius: 8px;
		text-align: left;
		cursor: pointer;
		color: var(--text-primary);
		font-size: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.exercise-item-simple .name {
		font-weight: bold;
	}

	.exercise-item-simple .details {
		font-size: 0.8rem;
		color: var(--text-secondary);
	}

	.exercise-item-simple:hover {
		background: var(--bg-primary);
		box-shadow: 0 0 0 1px var(--teal-primary);
	}

	.no-results {
		color: var(--text-secondary);
		text-align: center;
		margin-top: 1rem;
	}

	.session-notes-container {
		margin-bottom: 2rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	/* Sleek TBC Checkbox Styles */
	.tbc-checkbox-wrapper {
		display: flex;
		justify-content: center;
		margin: 0.5rem 0 1.5rem 0;
		width: 100%;
	}

	.tbc-checkbox-wrapper input[type='checkbox'] {
		display: none;
	}

	.tbc-label {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		cursor: pointer;
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--text-secondary);
		padding: 0.6rem 1.2rem;
		border-radius: 30px;
		background: rgba(0, 0, 0, 0.03);
		border: 1px solid rgba(0, 0, 0, 0.08);
		transition: all 0.2s ease;
		user-select: none;
	}

	.tbc-label:hover {
		background: rgba(239, 108, 0, 0.05);
		border-color: rgba(239, 108, 0, 0.2);
		color: #ef6c00;
	}

	.custom-checkbox {
		width: 20px;
		height: 20px;
		border-radius: 6px;
		border: 2px solid rgba(0, 0, 0, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
		background: white;
	}

	/* Checkmark trick */
	.custom-checkbox::after {
		content: '';
		width: 5px;
		height: 10px;
		border: solid white;
		border-width: 0 2px 2px 0;
		transform: rotate(45deg);
		opacity: 0;
		transition: opacity 0.2s ease;
		margin-top: -2px; /* optical alignment */
	}

	.tbc-checkbox-wrapper input[type='checkbox']:checked + .tbc-label {
		background: rgba(239, 108, 0, 0.1);
		border-color: rgba(239, 108, 0, 0.4);
		color: #ef6c00;
	}

	.tbc-checkbox-wrapper input[type='checkbox']:checked + .tbc-label .custom-checkbox {
		background: #ef6c00;
		border-color: #ef6c00;
	}

	.tbc-checkbox-wrapper input[type='checkbox']:checked + .tbc-label .custom-checkbox::after {
		opacity: 1;
	}
</style>
