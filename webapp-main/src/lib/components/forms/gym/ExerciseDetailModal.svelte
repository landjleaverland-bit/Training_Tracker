<script lang="ts">
    import type { ExerciseDefinition } from '$lib/data/exercises';
    import { createEventDispatcher } from 'svelte';
    import { fly } from 'svelte/transition';

    export let exercise: ExerciseDefinition;
    export let visible: boolean = false;

    const dispatch = createEventDispatcher();

    function close() {
        dispatch('close');
    }
</script>

{#if visible}
    <div 
        class="modal-overlay" 
        role="button"
        tabindex="0"
        on:click={close}
        on:keydown={(e) => e.key === 'Escape' && close()}
        aria-label="Close modal"
    >
        <div 
            class="modal-content" 
            role="dialog"
            aria-modal="true"
            transition:fly={{ y: 50, duration: 300 }} 
            on:click|stopPropagation
            on:keydown|stopPropagation
            tabindex="-1"
        >
            <div class="header">
                <h3>{exercise.name}</h3>
                <span class="category">{exercise.category}</span>
                <button class="close-btn" on:click={close} aria-label="Close">×</button>
            </div>
            
            <div class="visual-placeholder">
                <!-- Placeholder for 3D animation/video -->
                <span>Animation would play here</span>
                <div class="muscles">
                    Targets: {exercise.targetMuscles.join(', ')}
                </div>
            </div>

            <div class="instructions">
                <h4>Instructions</h4>
                <ol>
                    {#each exercise.instructions as step}
                        <li>{step}</li>
                    {/each}
                </ol>
            </div>
        </div>
    </div>
{/if}

<style>
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
    }

    .modal-content {
        background: var(--bg-primary);
        border-radius: 16px;
        width: 100%;
        max-width: 500px;
        max-height: 80vh;
        overflow-y: auto;
        border: 1px solid var(--border-primary);
    }

    .header {
        padding: 1.5rem;
        border-bottom: 1px solid var(--border-primary);
        display: flex;
        flex-direction: column;
        position: relative;
    }

    h3 {
        margin: 0;
        color: var(--text-primary);
    }

    .category {
        color: var(--teal-primary);
        font-size: 0.9rem;
    }

    .close-btn {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: none;
        border: none;
        color: var(--text-secondary);
        font-size: 2rem;
        cursor: pointer;
    }

    .visual-placeholder {
        background: var(--bg-tertiary);
        height: 200px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: var(--text-secondary);
        margin: 1rem;
        border-radius: 8px;
    }
    
    .muscles {
        margin-top: 1rem;
        font-weight: bold;
        color: var(--teal-primary);
    }

    .instructions {
        padding: 1.5rem;
    }

    ol {
        padding-left: 1.5rem;
        color: var(--text-secondary);
        line-height: 1.6;
    }
</style>
