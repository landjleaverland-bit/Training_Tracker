<script lang="ts">
    import type { GymExercise, GymSet } from '$lib/types/session';
    import { createEventDispatcher } from 'svelte';
    import ExerciseSetRow from './ExerciseSetRow.svelte';

    export let exercise: GymExercise;
    // Potentially pass in history for ghost text logic later

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
</script>

<div class="exercise-card">
    <div class="header">
        <div class="title-group">
            <button class="icon-btn info-btn" on:click={() => dispatch('info', exercise)} aria-label="Exercise Info">
                <div class="info-icon">?</div>
            </button> 
            <h4>{exercise.name}</h4>
        </div>
        <button class="icon-btn delete-btn" on:click={() => dispatch('delete', exercise)} aria-label="Delete Exercise">🗑️</button>
    </div>
    
    <div class="table-header">
        <div class="col">Set</div>
        <div class="col">Previous</div>
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
</div>

<style>
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
        align-items: center;
        background: var(--bg-tertiary);
    }

    h4 {
        margin: 0;
        color: var(--teal-primary);
        font-size: 1.1rem;
    }

    .table-header {
        display: grid;
        grid-template-columns: 30px 1fr 80px 80px 40px;
        gap: 0.5rem;
        padding: 0.5rem;
        font-size: 0.75rem;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        text-align: center;
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
    }

    .add-set-btn:hover {
        background: rgba(45, 212, 191, 0.1);
    }
    
    .title-group {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .info-btn {
        padding: 0;
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
</style>
