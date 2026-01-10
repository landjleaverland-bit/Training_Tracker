<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { GymSet } from '$lib/types/session';

    export let setNumber: number;
    export let set: GymSet;

    const dispatch = createEventDispatcher();

    function toggleComplete() {
        set.completed = !set.completed;
        dispatch('change', set);
        if (set.completed) {
            dispatch('complete');
        }
    }


</script>

<div class="set-row" class:completed={set.completed}>
    <div class="col set-num">
        {setNumber}
    </div>
    <div class="col weight">
        <input 
            type="number" 
            bind:value={set.weight} 
            placeholder="-" 
        />
    </div>
    <div class="col reps">
        <input 
            type="number" 
            bind:value={set.reps} 
            placeholder="-" 
        />
    </div>
    <div class="col check">
        <button class="check-btn" on:click={toggleComplete} class:checked={set.completed}>
            {#if set.completed}
                ✓
            {/if}
        </button>
    </div>
</div>

<style>
    .set-row {
        display: grid;
        grid-template-columns: 30px 1fr 1fr 40px; /* Adjusted grid */
        gap: 0.5rem;
        align-items: center;
        padding: 0.5rem;
        background: var(--bg-secondary);
        border-bottom: 1px solid var(--border-primary);
        font-size: 0.9rem;
    }

    .set-row.completed {
        background: rgba(16, 185, 129, 0.1); /* Green tint */
    }

    .col {
        display: flex;
        justify-content: center;
        align-items: center;
        text-align: center;
    }

    /* prev class removed */

    input {
        width: 100%;
        background: var(--bg-tertiary);
        border: 1px solid var(--border-primary);
        color: var(--text-primary);
        border-radius: 6px;
        padding: 0.4rem;
        text-align: center;
        font-size: 1rem;
    }
    
    input:focus {
        border-color: var(--teal-primary);
        outline: none;
    }

    /* "Ghost" text styling is handled by placeholder color default or override */
    input::placeholder {
        color: var(--text-tertiary);
        opacity: 0.5;
    }

    .check-btn {
        width: 32px;
        height: 32px;
        border-radius: 6px;
        border: 2px solid var(--border-primary);
        background: transparent;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
    }

    .check-btn.checked {
        background: var(--teal-primary);
        border-color: var(--teal-primary);
    }
</style>
