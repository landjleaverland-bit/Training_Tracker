<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { fly, fade, scale } from 'svelte/transition';

    export let duration: number = 90; // Default 90 seconds
    export let autoStart: boolean = true; // If true, starts immediately (old behavior)
    export let visible = true;
    export let onComplete: () => void = () => {};

    // State
    let mode: 'SETUP' | 'RUNNING' = 'SETUP';
    let remaining = duration;
    let selectedDuration = duration;
    let interval: any;
    let isPaused = false;

    // Presets in seconds
    const PRESETS = [30, 60, 90, 120, 180];

    // Initialize based on autoStart
    $: if (visible) {
        if (autoStart) {
            startTimer(duration);
        } else {
            mode = 'SETUP';
            selectedDuration = duration;
            remaining = duration;
        }
    }

    function startTimer(seconds: number) {
        clearInterval(interval);
        selectedDuration = seconds; // Remember this preference?
        remaining = seconds;
        mode = 'RUNNING';
        isPaused = false;
        
        interval = setInterval(() => {
            if (!isPaused) {
                remaining--;
                if (remaining <= 0) {
                    clearInterval(interval);
                    playAlarm();
                    onComplete();
                }
            }
        }, 1000);
    }

    function togglePause() {
        isPaused = !isPaused;
    }

    function addTime(seconds: number) {
        remaining += seconds;
    }

    function subtractTime(seconds: number) {
        if (remaining > seconds) remaining -= seconds;
    }

    function reset() {
        clearInterval(interval);
        mode = 'SETUP';
        remaining = selectedDuration;
    }

    function close() {
        visible = false;
        clearInterval(interval);
        // We don't call onComplete here as that might trigger "next set" logic which we don't always want on close
    }

    function playAlarm() {
        // Haptic feedback if available
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
        }
        
        // Simple beep (if we wanted to add Audio later)
        // const audio = new Audio('/alarm.mp3'); 
        // audio.play().catch(e => console.log('Audio play failed', e));
    }

    onDestroy(() => {
        clearInterval(interval);
    });

    $: minutes = Math.floor(remaining / 60);
    $: seconds = remaining % 60;
</script>

{#if visible}
    <div 
        class="timer-overlay" 
        transition:fade={{ duration: 200 }} 
        on:click|self={close}
        role="button"
        tabindex="0"
        on:keydown={(e) => { if (e.key === 'Escape') close(); }}
        aria-label="Close timer"
    >
        <div class="rest-timer" transition:scale={{ start: 0.9, duration: 200 }}>
            
            <div class="header">
                <span class="title">Rest Timer</span>
                <button class="close-btn" on:click={close}>✕</button>
            </div>

            <!-- Timer Display -->
            <div class="display-container">
                <div class="time-display" class:paused={isPaused && mode === 'RUNNING'}>
                    {mode === 'SETUP' ? Math.floor(selectedDuration / 60) : minutes}:{mode === 'SETUP' ? (selectedDuration % 60).toString().padStart(2, '0') : seconds.toString().padStart(2, '0')}
                </div>
                <div class="status-label">
                    {#if mode === 'SETUP'}
                        Set Duration
                    {:else if isPaused}
                        Paused
                    {:else}
                        Resting...
                    {/if}
                </div>
            </div>

            {#if mode === 'SETUP'}
                <!-- Setup Controls -->
                <div class="presets-grid">
                    {#each PRESETS as preset}
                        <button 
                            class="preset-btn" 
                            class:active={selectedDuration === preset}
                            on:click={() => selectedDuration = preset}
                        >
                            {preset >= 60 ? `${preset/60}m` : `${preset}s`}
                        </button>
                    {/each}
                </div>

                <div class="manual-adjust">
                    <button class="adjust-btn" on:click={() => selectedDuration = Math.max(10, selectedDuration - 10)}>-</button>
                    <span class="adjust-label">10s</span>
                    <button class="adjust-btn" on:click={() => selectedDuration += 10}>+</button>
                </div>

                <button class="action-btn start" on:click={() => startTimer(selectedDuration)}>
                    Start Timer
                </button>
            {:else}
                <!-- Running Controls -->
                <div class="quick-adjust">
                    <button class="adjust-btn" on:click={() => subtractTime(10)}>-10</button>
                    <button class="adjust-btn" on:click={() => addTime(10)}>+10</button>
                </div>

                <div class="running-controls">
                    <button class="action-btn secondary" on:click={reset}>Stop</button>
                    <button class="action-btn primary" on:click={togglePause}>
                        {isPaused ? 'Resume' : 'Pause'}
                    </button>
                </div>
            {/if}
        </div>
    </div>
{/if}

<style>
    .timer-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
        z-index: 1000;
        display: flex;
        align-items: flex-end; /* Bottom sheet on mobile */
        justify-content: center;
        padding-bottom: 2rem;
    }

    @media (min-width: 640px) {
        .timer-overlay {
            align-items: center; /* Center on desktop */
            padding-bottom: 0;
        }
    }

    .rest-timer {
        width: 100%;
        max-width: 360px;
        background: #1e1e1e; /* Dark theme default */
        background: var(--bg-secondary, #1e1e1e);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border: 1px solid var(--border-primary, rgba(255, 255, 255, 0.1));
        border-radius: 24px;
        padding: 1.5rem;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        margin: 0 1rem;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .title {
        font-weight: 600;
        color: var(--text-secondary, #ccc);
        text-transform: uppercase;
        font-size: 0.8rem;
        letter-spacing: 1px;
    }

    .close-btn {
        background: none;
        border: none;
        color: var(--text-secondary, #ccc);
        font-size: 1.25rem;
        cursor: pointer;
        padding: 0.25rem;
        line-height: 1;
    }

    .display-container {
        text-align: center;
        padding: 0.5rem 0;
    }

    .time-display {
        font-size: 4.5rem;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
        line-height: 1;
        color: var(--teal-primary, #2dd4bf);
        text-shadow: 0 0 20px rgba(45, 212, 191, 0.2);
    }

    .time-display.paused {
        opacity: 0.5;
    }

    .status-label {
        margin-top: 0.5rem;
        color: var(--text-secondary, #888);
        font-size: 0.9rem;
    }

    /* Setup Mode Styles */
    .presets-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 0.5rem;
    }

    .preset-btn {
        background: var(--bg-tertiary, #2a2a2a);
        border: 1px solid var(--border-primary, #444);
        color: var(--text-primary, white);
        padding: 0.75rem 0;
        border-radius: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 0.9rem;
    }

    .preset-btn:hover {
        background: var(--bg-primary, #333);
        border-color: var(--teal-primary, #2dd4bf);
    }

    .preset-btn.active {
        background: var(--teal-primary, #2dd4bf);
        color: black;
        border-color: var(--teal-primary, #2dd4bf);
        box-shadow: 0 0 15px rgba(45, 212, 191, 0.3);
    }

    .manual-adjust {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 1.5rem;
        background: var(--bg-tertiary, #2a2a2a);
        padding: 0.5rem;
        border-radius: 16px;
    }

    .adjust-label {
        color: var(--text-secondary, #ccc);
        font-family: monospace;
    }

    /* Running Mode Styles */
    .quick-adjust {
        display: flex;
        gap: 1rem;
    }

    .quick-adjust .adjust-btn {
        flex: 1;
        background: var(--bg-tertiary, #2a2a2a);
        border: 1px solid var(--border-primary, #444);
        color: var(--text-primary, white);
    }

    .running-controls {
        display: flex;
        gap: 1rem;
    }

    /* Common Button Styles */
    .adjust-btn {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: none;
        background: var(--bg-primary, #333);
        color: var(--text-primary, white);
        font-size: 1.25rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .quick-adjust .adjust-btn {
        border-radius: 12px;
        height: auto;
        padding: 0.75rem;
        font-size: 1rem;
    }

    .action-btn {
        width: 100%;
        padding: 1rem;
        border-radius: 16px;
        border: none;
        font-weight: 700;
        font-size: 1.1rem;
        cursor: pointer;
        transition: transform 0.1s;
    }

    .action-btn:active {
        transform: scale(0.98);
    }

    .action-btn.start {
        background: var(--teal-primary, #2dd4bf);
        color: black;
        box-shadow: 0 4px 20px rgba(45, 212, 191, 0.3);
    }

    .action-btn.primary {
        background: var(--teal-primary, #2dd4bf);
        color: black;
        flex: 2;
    }

    .action-btn.secondary {
        background: var(--bg-tertiary, #2a2a2a);
        color: var(--text-secondary, #ccc);
        flex: 1;
    }
</style>
