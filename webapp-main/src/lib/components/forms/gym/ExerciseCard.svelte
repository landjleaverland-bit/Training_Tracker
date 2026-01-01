<script lang="ts">
    import type { GymExercise, GymSet } from '$lib/types/session';
    import { createEventDispatcher } from 'svelte';
    import ExerciseSetRow from './ExerciseSetRow.svelte';

    export let exercise: GymExercise;
    // prevExercise removed as requested
    export let benchmarks: Record<string, { weight: number, reps: number } | null> = {};
    
    const dispatch = createEventDispatcher();
    
    function addSet() {
        // Logic to replicate previous set values
        const lastSet = exercise.sets[exercise.sets.length - 1];
        const newSet: GymSet = {
            weight: lastSet ? lastSet.weight : 0,
            reps: lastSet ? lastSet.reps : 0,
            isWarmup: false,
            isFailure: false,
            isDropSet: false,
            completed: false
        };
        exercise.sets = [...exercise.sets, newSet];
    }
    
    function removeSet(index: number) {
        // Not implemented in UI yet
    }

    const DIFFICULTIES = ['Green', 'Yellow', 'Orange', 'Red'] as const;
</script>

<div class="exercise-card">
    <div class="header">
        <div class="title-group">
            <button class="icon-btn info-btn" on:click={() => dispatch('info', exercise)} aria-label="Exercise Info">
                <div class="info-icon">?</div>
            </button> 
            <div>
                <h4>{exercise.name}</h4>
                <!-- Benchmarks Display -->
                <div class="benchmarks">
                    {#each DIFFICULTIES as color}
                        {#if benchmarks[color]}
                            <div class="benchmark-pill" class:has-data={true} style="--pill-color: var(--color-{color.toLowerCase()})">
                                <span class="dot"></span>
                                <span class="text">{benchmarks[color]?.weight}kg x {benchmarks[color]?.reps}</span>
                            </div>
                        {/if}
                    {/each}
                </div>
            </div>
        </div>
        <button class="icon-btn delete-btn" on:click={() => dispatch('delete', exercise)} aria-label="Delete Exercise">🗑️</button>
    </div>
    
    <div class="table-header">
        <div class="col">Set</div>
        <div class="col">kg</div>
        <div class="col">Reps</div>
        <div class="col">✓</div>
    </div>

    <div class="sets">
        {#each exercise.sets as set, i}
             <ExerciseSetRow 
                setNumber={i + 1} 
                bind:set={set} 
                on:complete 
                on:focus 
                on:change 
             />
        {/each}
    </div>
    
    <button class="add-set-btn" on:click={addSet}>
        + Add Set
    </button>

    <!-- Difficulty Selector -->
    <div class="difficulty-footer">
        <span class="diff-label">How did it feel?</span>
        <div class="diff-circles">
            {#each DIFFICULTIES as color}
                <button 
                    class="diff-circle" 
                    class:selected={exercise.difficulty === color}
                    style="--circle-color: var(--color-{color.toLowerCase()})"
                    on:click={() => exercise.difficulty = color}
                    aria-label="Mark as {color}"
                ></button>
            {/each}
        </div>
    </div>
</div>

<style>
    :global(:root) {
        --color-green: #4ade80;
        --color-yellow: #facc15;
        --color-orange: #fb923c;
        --color-red: #f87171;
    }

    .exercise-card {
        background: var(--bg-secondary);
        border-radius: 12px;
        overflow: hidden;
        margin-bottom: 1rem;
        border: 1px solid var(--border-primary);
    }

    .header {
        padding: 0.75rem 1rem;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        background: var(--bg-tertiary);
    }

    h4 {
        margin: 0;
        color: var(--teal-primary);
        font-size: 1.1rem;
        margin-bottom: 0.25rem;
    }
    
    .benchmarks {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .benchmark-pill {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.75rem;
        color: var(--text-secondary);
        background: rgba(0,0,0,0.2);
        padding: 2px 6px;
        border-radius: 4px;
    }

    .benchmark-pill .dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background-color: var(--pill-color);
    }

    .table-header {
        display: grid;
        grid-template-columns: 30px 1fr 1fr 40px; /* Adjusted grid */
        gap: 0.5rem;
        padding: 0.5rem;
        font-size: 0.75rem;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        text-align: center;
        border-top: 1px solid var(--border-primary);
    }

    .add-set-btn {
        width: 100%;
        padding: 0.75rem;
        background: transparent;
        border: none;
        color: var(--teal-primary);
        font-weight: bold;
        cursor: pointer;
        text-transform: uppercase;
        font-size: 0.9rem;
        transition: background 0.2s;
        border-top: 1px solid var(--border-primary);
    }

    .add-set-btn:hover {
        background: rgba(45, 212, 191, 0.1);
    }
    
    .title-group {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
    }

    .info-btn {
        padding-top: 2px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .info-icon {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 1.5px solid var(--teal-primary);
        color: var(--teal-primary);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.9rem;
        font-weight: bold;
    }

    .icon-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.25rem;
        transition: opacity 0.2s;
    }
    
    .icon-btn:hover {
        opacity: 0.8;
    }

    .delete-btn {
        font-size: 1.2rem;
    }

    /* Difficulty Footer */
    .difficulty-footer {
        padding: 0.75rem 1rem;
        background: var(--bg-tertiary);
        border-top: 1px solid var(--border-primary);
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .diff-label {
        font-size: 0.9rem;
        color: var(--text-secondary);
    }

    .diff-circles {
        display: flex;
        gap: 0.75rem;
    }

    .diff-circle {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 2px solid var(--circle-color);
        background: transparent;
        cursor: pointer;
        padding: 0;
        transition: all 0.2s;
    }

    .diff-circle.selected {
        background: var(--circle-color);
        box-shadow: 0 0 10px var(--circle-color);
        transform: scale(1.1);
    }

    .diff-circle:hover {
        transform: scale(1.1);
    }
</style>
