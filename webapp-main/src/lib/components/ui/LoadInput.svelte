<script lang="ts">
    interface Props {
        id: string;
        label: string;
        value: number;
        min?: number;
        max?: number;
    }

    let { id, label, value = $bindable(), min = 1, max = 5 }: Props = $props();

    function setValue(val: number) {
        value = val;
    }
</script>

<div class="load-row">
    <label for={id} class="load-label">{label}</label>
    <div class="button-group" role="group" aria-label="{label} scale selector">
        {#each Array.from({ length: max }, (_, i) => i + 1) as num}
            <button 
                type="button" 
                class="scale-btn" 
                class:active={value === num}
                onclick={() => setValue(num)}
                aria-pressed={value === num}
            >
                {num}
            </button>
        {/each}
    </div>
</div>

<style>
    .load-row {
        display: flex;
        flex-direction: row; /* Horizontal by default */
        align-items: center;
        justify-content: space-between;
        justify-content: space-between;
        gap: 0.5rem;
        width: 100%;
    }

    .load-label {
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--text-primary, #2d3748);
        text-transform: uppercase;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        flex-shrink: 0;
        width: 5.5rem; /* Fixed width for alignment */
    }

    .button-group {
        display: flex;
        flex: 1; /* Take remaining space */
        max-width: 300px; /* But don't get too wide on large screens */
        gap: 2px;
        background: rgba(74, 155, 155, 0.1);
        padding: 4px;
        border-radius: 10px;
    }

    .scale-btn {
        flex: 1;
        border: none;
        background: transparent;
        color: var(--text-secondary, #718096);
        font-weight: 600;
        font-size: 0.9rem;
        padding: 0.4rem 0;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .scale-btn:hover {
        background: rgba(255, 255, 255, 0.5);
        color: var(--teal-primary, #4a9b9b);
    }

    .scale-btn.active {
        background: white;
        color: var(--teal-secondary, #2c7a7b);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        font-weight: 700;
        transform: scale(1.02);
    }

    @media (min-width: 640px) {
        .load-label {
            width: 7rem; /* Slightly larger on desktop */
            margin-bottom: 0;
        }

        .button-group {
            max-width: 300px;
        }
    }
</style>
