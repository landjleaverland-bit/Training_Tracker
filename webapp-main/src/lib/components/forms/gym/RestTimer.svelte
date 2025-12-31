<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { fly } from 'svelte/transition';

    export let duration: number = 90; // Default 90 seconds
    export let onComplete: () => void = () => {};

    let remaining = duration;
    let interval: any;
    export let visible = true;

    function start() {
        clearInterval(interval);
        remaining = duration;
        interval = setInterval(() => {
            remaining--;
            if (remaining <= 0) {
                clearInterval(interval);
                onComplete();
                // Optionally play sound directly here or dispatch event
            }
        }, 1000);
    }

    function addTime(seconds: number) {
        remaining += seconds;
    }

    function subtractTime(seconds: number) {
        if (remaining > seconds) remaining -= seconds;
    }

    function close() {
        visible = false;
        clearInterval(interval);
        onComplete(); // Triggers close/reset logic in parent
    }

    onMount(() => {
        start();
    });

    onDestroy(() => {
        clearInterval(interval);
    });

    $: minutes = Math.floor(remaining / 60);
    $: seconds = remaining % 60;
</script>

{#if visible}
    <div class="rest-timer" transition:fly={{ y: 50, duration: 300 }}>
        <div class="timer-display">
            <span class="label">Rest</span>
            <span class="time">{minutes}:{seconds.toString().padStart(2, '0')}</span>
        </div>
        <div class="controls">
            <button on:click={() => subtractTime(30)}>-30</button>
            <button on:click={() => addTime(30)}>+30</button>
            <button class="skip" on:click={close}>Skip</button>
        </div>
    </div>
{/if}

<style>
    .rest-timer {
        position: fixed;
        bottom: 80px; /* Above nav bar */
        left: 50%;
        transform: translateX(-50%);
        background: rgba(30, 30, 30, 0.95);
        backdrop-filter: blur(10px);
        padding: 1rem 1.5rem;
        border-radius: 30px;
        display: flex;
        align-items: center;
        gap: 1.5rem;
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        z-index: 100;
        border: 1px solid var(--border-primary);
        width: 90%;
        max-width: 400px;
        justify-content: space-between;
    }

    .timer-display {
        display: flex;
        flex-direction: column;
    }

    .label {
        font-size: 0.75rem;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .time {
        font-size: 1.5rem;
        font-weight: bold;
        color: var(--teal-primary);
        font-variant-numeric: tabular-nums;
    }

    .controls {
        display: flex;
        gap: 0.5rem;
    }

    button {
        background: var(--bg-tertiary);
        border: none;
        color: var(--text-primary);
        padding: 0.5rem 0.75rem;
        border-radius: 8px;
        font-size: 0.9rem;
        cursor: pointer;
    }

    button.skip {
        background: var(--teal-secondary);
        color: white;
    }
</style>
