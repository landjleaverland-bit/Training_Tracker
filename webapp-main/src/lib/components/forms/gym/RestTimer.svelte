<script lang="ts">
    import { onMount } from 'svelte';
    import { fade, fly, scale } from 'svelte/transition';
    import { cubicOut } from 'svelte/easing';
    import { audioManager } from '$lib/utils/audio';

    // -- Props --
    let { 
        visible = $bindable(false), 
        defaultSets = 3,
        associatedExerciseId = null,
        onComplete = () => {},
        onClose = () => {}
    } = $props<{
        visible?: boolean;
        defaultSets?: number;
        associatedExerciseId?: string | null;
        onComplete?: () => void;
        onClose?: () => void;
    }>();

    // -- State --
    type TimerPhase = 'SETUP' | 'WORK' | 'REST' | 'FINISHED';
    type RunningState = 'RUNNING' | 'PAUSED';

    let phase = $state<TimerPhase>('SETUP');
    let runningState = $state<RunningState>('PAUSED');
    
    // Config
    let workDuration = $state(0); // 0 means manual/open-ended, but user requested "set time"
    // Actually user said "allow user to set the time for each set... and rest time".
    // So distinct Work and Rest durations.
    // Defaulting Work to 30s and Rest to 60s for now, adjustable.
    let configWork = $state(30); 
    let configRest = $state(60); 
    let configSets = $state(3);

    // Active State
    let currentSet = $state(1);
    let remaining = $state(30); 
    let endTimestamp = $state<number | null>(null);
    let pausedTimeRemaining = $state<number | null>(null);
    
    // Derived for UI
    let progress = $state(0);
    
    // Preferences Storage
    const STORAGE_KEY = 'interval_timer_prefs';

    // -- Lifecycle --
    let timerInterval: any = null;

    $effect(() => {
        if (visible) {
            audioManager.init();
            if (phase === 'SETUP') {
                // Load prefs only if we are in setup
                loadPreference();
                // Override sets with prop if provided (as it changes per exercise/session)
                // Use a local variable to break reactivity connection if that's the issue, or just trust it.
                // The lint says "This reference only captures the initial value of defaultSets".
                // Since defaultSets is a prop, we should access it directly. 
                if (defaultSets > 0) configSets = defaultSets;
            }
        }
    });

    onMount(() => {
        restoreState();
        timerInterval = setInterval(tick, 100);
        return () => clearInterval(timerInterval);
    });

    // -- Core Logic --

    function loadPreference() {
        if (!associatedExerciseId) return;
        try {
            const prefs = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            const p = prefs[associatedExerciseId] || prefs['default'];
            if (p) {
                configWork = p.work || 30;
                configRest = p.rest || 60;
                // Sets usually come from the current session plan (defaultSets prop), so we might not want to overwrite them from history unless we want "last used sets for this exercise"
                // The user said "automatically retrieve the number of sets from the exercise leaf", so we favor defaultSets.
            }
        } catch (e) {
            console.warn(e);
        }
    }

    function savePreference() {
        try {
            const prefs = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            const p = { work: configWork, rest: configRest };
            if (associatedExerciseId) prefs[associatedExerciseId] = p;
            prefs['default'] = p;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
        } catch (e) { console.error(e); }
    }

    // Resilience
    function saveState() {
        if (phase === 'SETUP') return;
        const snapshot = {
            phase, runningState, remaining, endTimestamp, 
            configWork, configRest, configSets, currentSet,
            associatedExerciseId, pausedTimeRemaining, timestamp: Date.now()
        };
        localStorage.setItem('active_interval_timer', JSON.stringify(snapshot));
    }

    function restoreState() {
        try {
            const saved = localStorage.getItem('active_interval_timer');
            if (saved) {
                const s = JSON.parse(saved);
                if (Date.now() - s.timestamp < 3600000) { // 1 hr expiry
                    phase = s.phase;
                    runningState = s.runningState;
                    remaining = s.remaining;
                    endTimestamp = s.endTimestamp;
                    configWork = s.configWork;
                    configRest = s.configRest;
                    configSets = s.configSets;
                    currentSet = s.currentSet;
                    associatedExerciseId = s.associatedExerciseId;
                    pausedTimeRemaining = s.pausedTimeRemaining;
                    
                    if (phase !== 'SETUP' && phase !== 'FINISHED') {
                        visible = true;
                    }
                }
            }
        } catch (e) {}
    }

    function clearState() {
        localStorage.removeItem('active_interval_timer');
    }

    // Control
    function startSession() {
        savePreference();
        phase = 'WORK';
        currentSet = 1;
        startPhase(configWork);
    }

    function startPhase(duration: number) {
        runningState = 'RUNNING';
        remaining = duration;
        endTimestamp = Date.now() + (duration * 1000);
        saveState();
        audioManager.playChime(); // Beep on start
    }

    function pause() {
        runningState = 'PAUSED';
        pausedTimeRemaining = remaining;
        endTimestamp = null;
        saveState();
    }

    function resume() {
        if (pausedTimeRemaining) {
            runningState = 'RUNNING';
            endTimestamp = Date.now() + (pausedTimeRemaining * 1000);
            saveState();
        }
    }

    function skip() {
        handlePhaseComplete();
    }

    function stop() {
        phase = 'SETUP';
        runningState = 'PAUSED';
        clearState();
    }

    function handlePhaseComplete() {
        // Work -> Rest (unless last set)
        // Rest -> Work (next set)
        
        audioManager.playCompletionAlert();
        
        if (phase === 'WORK') {
            if (currentSet >= configSets) {
                // All done
                phase = 'FINISHED';
                runningState = 'PAUSED';
                endTimestamp = null;
                onComplete();
                clearState();
            } else {
                phase = 'REST';
                startPhase(configRest);
            }
        } else if (phase === 'REST') {
            currentSet++;
            phase = 'WORK';
            startPhase(configWork);
        }
    }

    function tick() {
        if (!visible || phase === 'SETUP' || phase === 'FINISHED' || runningState === 'PAUSED') return;
        
        if (endTimestamp) {
            const now = Date.now();
            const diff = endTimestamp - now;
            remaining = Math.ceil(diff / 1000);

            if (remaining <= 0) {
                remaining = 0;
                handlePhaseComplete();
            }
        }
    }

    // UI Formatting
    function formatTime(s: number) {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    }

    function closeTimer() {
        if (phase === 'SETUP' || phase === 'FINISHED') {
            stop();
            visible = false;
        } else {
            // Minimize behavior? For now just hide but keep state (resilience handles reload)
            // But if we want to stop:
            visible = false;
        }
        if (onClose) onClose();
    }

</script>

{#if visible}
    <div 
        class="overlay" 
        transition:fade={{ duration: 250 }}
        role="button"
        tabindex="0"
        onclick={(e) => { if(e.target === e.currentTarget) closeTimer(); }}
        onkeydown={(e) => { if(e.key === 'Escape') closeTimer(); }}
    >
        <div 
            class="timer-card" 
            class:work={phase === 'WORK'}
            class:rest={phase === 'REST'}
            transition:scale={{ start: 0.96, duration: 300, easing: cubicOut }}
        >
            <!-- Header -->
            <div class="header">
                <span class="title">
                    {#if phase === 'SETUP'}
                        Timer Setup
                    {:else if phase === 'FINISHED'}
                        Complete
                    {:else}
                        Set {currentSet} / {configSets}
                    {/if}
                </span>
                <button class="close-btn" onclick={closeTimer}>✕</button>
            </div>

            <!-- Content -->
            <div class="content">
                {#if phase === 'SETUP'}
                    <div class="setup-form">
                        <div class="input-group">
                            <label for="work-duration">Work</label>
                            <div class="time-adjuster">
                                <button onclick={() => configWork = Math.max(5, configWork - 5)}>−</button>
                                <span class="val">{formatTime(configWork)}</span>
                                <button onclick={() => configWork += 5}>+</button>
                            </div>
                        </div>
                        <div class="input-group">
                            <label for="rest-duration">Rest</label>
                            <div class="time-adjuster">
                                <button onclick={() => configRest = Math.max(5, configRest - 5)}>−</button>
                                <span class="val">{formatTime(configRest)}</span>
                                <button onclick={() => configRest += 5}>+</button>
                            </div>
                        </div>
                        <div class="input-group">
                            <label for="num-sets">Sets</label>
                            <div class="time-adjuster">
                                <button onclick={() => configSets = Math.max(1, configSets - 1)}>−</button>
                                <span class="val">{configSets}</span>
                                <button onclick={() => configSets += 1}>+</button>
                            </div>
                        </div>
                        
                        <button class="start-btn" onclick={startSession}>
                            ▶ Start Interval
                        </button>
                    </div>

                {:else if phase === 'FINISHED'}
                     <div class="finished-state">
                        <div class="check-icon">✓</div>
                        <h3>Nicely Done!</h3>
                        <button class="reset-btn" onclick={() => phase = 'SETUP'}>Back to Setup</button>
                     </div>
                {:else}
                    <!-- Running Timer -->
                    <div class="timer-circle">
                         <svg viewBox="0 0 100 100" class="ring">
                            <circle class="track" cx="50" cy="50" r="45" />
                            <circle 
                                class="progress" 
                                cx="50" cy="50" r="45"
                                stroke-dasharray="283"
                                stroke-dashoffset={283 * (1 - (remaining / (phase === 'WORK' ? configWork : configRest)))}
                            />
                         </svg>
                         <div class="timer-val">
                             <div class="phase-label">{phase}</div>
                             <div class="digits">{formatTime(remaining)}</div>
                         </div>
                    </div>

                    <div class="controls">
                         {#if runningState === 'RUNNING'}
                            <button class="ctl-btn pause" onclick={pause}>⏸</button>
                         {:else}
                            <button class="ctl-btn play" onclick={resume}>▶</button>
                         {/if}
                         <button class="ctl-btn skip" onclick={skip}>⏭</button>
                         <button class="ctl-btn stop" onclick={stop} style="font-size: 1rem; padding: 1rem;">Stop</button>
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}

<style>
    .overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(5px);
        z-index: 2000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
    }

    .timer-card {
        background: white;
        width: 100%;
        max-width: 360px;
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        display: flex;
        flex-direction: column;
        transition: border 0.3s;
        border: 4px solid transparent;
    }

    .timer-card.work { border-color: #4ade80; }
    .timer-card.rest { border-color: #2dd4bf; }

    .header {
        padding: 1rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #f0f0f0;
        background: #fcfcfc;
    }

    .title {
        font-weight: 700;
        font-size: 1.1rem;
        color: #333;
    }

    .close-btn {
        background: none;
        border: none;
        font-size: 1.2rem;
        color: #999;
        cursor: pointer;
    }

    .content {
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    /* Setup Styles */
    .setup-form {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
    }

    .input-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .input-group label {
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: #666;
        font-weight: 600;
    }

    .time-adjuster {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: #f4f5f7;
        padding: 0.25rem;
        border-radius: 12px;
    }

    .time-adjuster button {
        width: 44px;
        height: 44px;
        border: none;
        background: white;
        border-radius: 10px;
        font-size: 1.25rem;
        font-weight: bold;
        color: #333;
        box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        cursor: pointer;
    }

    .time-adjuster button:active {
        transform: scale(0.95);
    }

    .time-adjuster .val {
        font-family: 'Inter', monospace;
        font-size: 1.25rem;
        font-weight: 700;
        color: #333;
    }

    .start-btn {
        margin-top: 1rem;
        width: 100%;
        padding: 1rem;
        background: #333;
        color: white;
        border: none;
        border-radius: 16px;
        font-weight: 700;
        font-size: 1.1rem;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }

    /* Running Styles */
    .timer-circle {
        position: relative;
        width: 240px;
        height: 240px;
        margin-bottom: 2rem;
    }

    .ring {
        width: 100%;
        height: 100%;
        transform: rotate(-90deg);
    }

    .track {
        fill: none;
        stroke: #f0f0f0;
        stroke-width: 6;
    }

    .progress {
        fill: none;
        stroke: #333;
        stroke-width: 6;
        stroke-linecap: round;
        transition: stroke-dashoffset 0.1s linear;
    }

    .work .progress { stroke: #4ade80; }
    .rest .progress { stroke: #2dd4bf; }

    .timer-val {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }

    .phase-label {
        font-size: 1.25rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        margin-bottom: 0.25rem;
        opacity: 0.5;
    }

    .digits {
        font-size: 3.5rem;
        font-weight: 800;
        line-height: 1;
        font-variant-numeric: tabular-nums;
    }

    .controls {
        display: flex;
        align-items: center;
        gap: 1rem;
        width: 100%;
        justify-content: center;
    }

    .ctl-btn {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        border: none;
        background: #f4f5f7;
        font-size: 1.5rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #333;
        transition: all 0.2s;
    }
    
    .ctl-btn.play {
         background: #333;
         color: white;
         box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }

    .ctl-btn:active {
        transform: scale(0.95);
    }

    .finished-state {
        text-align: center;
        padding: 2rem 0;
    }

    .check-icon {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: #4ade80;
        color: white;
        font-size: 3rem;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1.5rem;
    }

    .reset-btn {
        margin-top: 2rem;
        padding: 0.75rem 1.5rem;
        background: #f4f5f7;
        border: none;
        border-radius: 12px;
        font-weight: 600;
        cursor: pointer;
    }
</style>
