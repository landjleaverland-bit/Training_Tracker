<script lang="ts">
    import { onMount } from 'svelte';
    import { createEventDispatcher } from 'svelte';
    import type { GymSession, GymExercise, GymSet } from '$lib/types/session';
    import { EXERCISE_LIBRARY, type ExerciseDefinition } from '$lib/data/exercises';
    import { createGymSession, updateGymSession, getGymSessions } from '$lib/services/api';
    
    // Components
    import ExerciseCard from './gym/ExerciseCard.svelte';

    import RestTimer from './gym/RestTimer.svelte';
    import PlateCalculator from './gym/PlateCalculator.svelte';
    import ExerciseDetailModal from './gym/ExerciseDetailModal.svelte';
    import DeleteConfirmModal from '$lib/components/common/DeleteConfirmModal.svelte';
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
    let sessionName = $state('');
    let bodyweight = $state<number | undefined>(undefined);
    let exercises = $state<GymExercise[]>([]);
    let startTime = $state(new Date().toISOString().split('T')[0]);
    let time = $state(new Date().toTimeString().split(' ')[0].slice(0, 5));
    let trainingBlock = $state<'Strength' | 'Power' | 'Power Endurance' | 'Muscular Endurance'>('Strength');
    let previousSession = $state<GymSession | null>(null);
    let allSessions = $state<GymSession[]>([]);
    
    let notes = $state('');

    // Load history for benchmarks
    onMount(async () => {
        if (initialData) {
            // Populate form from initialData
            sessionName = initialData.name;
            bodyweight = initialData.bodyweight;
            exercises = initialData.exercises;
            startTime = initialData.date;
            time = initialData.time || '12:00';
            trainingBlock = initialData.trainingBlock || 'Strength';
            notes = initialData.notes || '';
            loaded = true;
        } else {
             const saved = localStorage.getItem(STORAGE_KEY);
             if (saved) {
                 try {
                     const data = JSON.parse(saved);
                     if (data.sessionName) sessionName = data.sessionName;
                     if (data.bodyweight) bodyweight = data.bodyweight;
                     if (data.startTime) startTime = data.startTime;
                     if (data.time) time = data.time;
                     if (data.trainingBlock) trainingBlock = data.trainingBlock;
                     if (data.exercises) exercises = data.exercises;
                     if (data.notes) notes = data.notes;
                 } catch (e) {
                     console.error('Failed to restore draft', e);
                 }
             }
             loaded = true;
        }

        const result = await getGymSessions();
        if (result.ok && result.data) {
            // @ts-ignore - map to local type
            allSessions = result.data.map(s => ({
                ...s,
                activityType: 'gym_session' as const,
                syncStatus: 'synced' as const
            }));
        }
    });

    $effect(() => {
        const blockSessions = allSessions.filter(s => 
            (s.trainingBlock || 'Strength') === trainingBlock &&
            s.date < startTime
        );
        blockSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        previousSession = blockSessions.length > 0 ? blockSessions[0] : null;
    });

    function getBenchmarks(exerciseName: string) {
        const result: Record<string, { weight: number, reps: number } | null> = {
            Green: null, Yellow: null, Orange: null, Red: null
        };
        
        // Sort sessions descending by date (newest first)
        const sortedSessions = [...allSessions].sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        for (const session of sortedSessions) {
            // Optimization: if all filled, break
            if (result.Green && result.Yellow && result.Orange && result.Red) break;

            const ex = session.exercises.find(e => e.name === exerciseName);
            if (ex && ex.difficulty && !result[ex.difficulty]) {
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
                     result[ex.difficulty] = { weight: bestSet.weight, reps: bestSet.reps };
                 }
            }
        }
        return result;
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
                sessionName,
                bodyweight,
                startTime,
                time,
                trainingBlock,
                exercises,
                notes
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
        }
    });

    // Filtered exercises for picker
    let filteredExercises = $derived(EXERCISE_LIBRARY.filter(e => {
        // Search overrides filters
        if (searchQuery) {
            return e.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                   e.targetMuscles.some(m => m.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        
        // Otherwise filter by dropdowns
        const matchesCategory = selectedCategory ? e.category === selectedCategory : true;
        const matchesSubcategory = selectedSubcategory ? e.subcategory === selectedSubcategory : true;
        return matchesCategory && matchesSubcategory;
    }));

    const categories = Array.from(new Set(EXERCISE_LIBRARY.map(e => e.category))).sort();
    
    // Reactive subcategories based on selected category
    let availableSubcategories = $derived(selectedCategory 
        ? Array.from(new Set(EXERCISE_LIBRARY.filter(e => e.category === selectedCategory).map(e => e.subcategory))).sort()
        : []);

    // Reset subcategory when category changes
    function handleCategoryChange() {
        selectedSubcategory = '';
    }

    function addExercise(def: ExerciseDefinition) {
        const newExercise: GymExercise = {
            id: crypto.randomUUID(),
            name: def.name,
            sets: [
                { weight: 0, reps: 0, isWarmup: false, isFailure: false, isDropSet: false, completed: false }
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

    async function saveSession() {
        if (exercises.length === 0) return;
        
        const sessionPayload = {
            date: startTime,
            time,
            name: sessionName || 'Gym Workout',
            bodyweight,
            trainingBlock,
            exercises,
            notes
        };

        const result = isEditing && initialData
            ? await updateGymSession(initialData.id, sessionPayload)
            : await createGymSession(sessionPayload);

        if (result.ok) {
            showSuccess = true;
            if (!isEditing) localStorage.removeItem(STORAGE_KEY);
            
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
            <div class="form-header-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                 <h2 style="margin: 0; font-size: 1.25rem; color: var(--teal-primary);">
                    New Gym Session
                 </h2>
            </div>
        {/if}
        
        <input 
            type="text" 
            class="session-name" 
            placeholder="Workout Name (e.g. Pull Day)" 
            bind:value={sessionName}
        />
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
                benchmarks={getBenchmarks(exercise.name)}
                on:complete={handleSetComplete}
                on:timer={handleExerciseTimer}
                on:delete={() => {
                    exerciseToDeleteIndex = i;
                }}
                on:info={() => {
                    // Find definition from library
                    const def = EXERCISE_LIBRARY.find(e => e.name === exercise.name);
                    if (def) {
                        activeExerciseDetail = def;
                    }
                }}
            />
        {/each}
    </div>

    <!-- Add Exercise Button -->
    <button class="add-exercise-btn" onclick={() => showExercisePicker = true}>
        + Add Exercise
    </button>

    <!-- Session Notes Section -->
    <div class="session-notes-container">
        <label for="session-notes">Session Notes</label>
        <textarea 
            id="session-notes" 
            bind:value={notes} 
            class="session-notes-area"
            placeholder="How did the workout feel? Energy, sleep, stress..."
            rows="3"
        ></textarea>
    </div>

    <!-- Save Button -->
    {#if exercises.length > 0}
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
            onclick={() => showExercisePicker = false} 
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
                        <input 
                            type="text" 
                            placeholder="Search exercises..." 
                            bind:value={searchQuery} 
                        />
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
                                {searchQuery ? 'No exercises found' : 'Select a category and subcategory to view exercises.'}
                            </div>
                        {/if}
                    </div>
                </div>
            </div>
        </div>
    {/if}

    <!-- Exercise Detail Modal -->
    {#if activeExerciseDetail}
        <ExerciseDetailModal 
            exercise={activeExerciseDetail} 
            visible={true} 
            on:close={() => activeExerciseDetail = null} 
        />
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
            onCancel={() => exerciseToDeleteIndex = null}
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

    .session-name {
        width: 100%;
        background: transparent;
        border: none;
        border-bottom: 1px solid var(--border-primary);
        font-size: 1.5rem;
        color: var(--teal-primary);
        font-weight: bold;
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
    }
    
    .session-name:focus {
        outline: none;
        border-color: var(--teal-primary);
    }

    .meta-row {
        display: flex;
        gap: 1rem;
    }

    .date-time-row {
        display: flex;
        gap: 0.5rem;
    }
    
    .date-time-row input[type="date"] {
        flex: 2;
    }
    
    .date-time-row input[type="time"] {
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

    input[type="number"], input[type="date"], .meta-row select {
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
    
    .session-notes-container label {
        color: var(--text-secondary);
        font-size: 0.9rem;
        font-weight: 500;
        margin-left: 0.2rem;
    }
    
    .session-notes-area {
        width: 100%;
        padding: 1rem;
        border-radius: 12px;
        border: 1px solid var(--border-primary);
        background: var(--bg-secondary);
        color: var(--text-primary);
        font-family: inherit;
        font-size: 1rem;
        resize: vertical;
        box-sizing: border-box;
    }
    
    .session-notes-area:focus {
        outline: none;
        border-color: var(--teal-primary);
        box-shadow: 0 0 0 3px rgba(45, 212, 191, 0.1);
    }
</style>
