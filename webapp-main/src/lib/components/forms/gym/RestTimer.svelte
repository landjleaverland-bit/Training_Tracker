<script lang="ts">
    /**
     * @file RestTimer.svelte
     * @component
     * @description A versatile interval and rest-only timer.
     * Features:
     * - Configurable Work/Rest durations or Rest-only countdowns
     * - Set counting
     * - Countdown warning ticks (3s, 2s, 1s)
     * - Audio feedback (chimes & ticks)
     * - Cache API and LocalStorage state persistence for background reliability
     * - Full mobile support (clock delta timing, wake-up event synchronization, audio unlock gestures)
     * - Floating overlay UI & minimized interactive pill UI for non-obtrusive status tracking
     */
    import { onMount } from 'svelte';
    import { fade, fly, scale } from 'svelte/transition';
    import { cubicOut } from 'svelte/easing';
    import { audioManager } from '$lib/utils/audio';
    import { getTimerPreferences, saveTimerPreferences } from '$lib/services/api';

    const STATE_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
    const RING_CIRCUMFERENCE = 283;

    // -- Props --
    let { 
        visible = $bindable(false), 
        defaultSets = 3,
        associatedExerciseId = null,
        autoStartRestOnly = false,
        onComplete = () => {},
        onClose = () => {}
    } = $props<{
        visible?: boolean;
        defaultSets?: number;
        associatedExerciseId?: string | null;
        autoStartRestOnly?: boolean;
        onComplete?: () => void;
        onClose?: () => void;
    }>();

    // -- State --
    type TimerPhase = 'SETUP' | 'WORK' | 'REST' | 'FINISHED';
    type RunningState = 'RUNNING' | 'PAUSED';
    type TimerMode = 'INTERVAL' | 'REST_ONLY';

    let phase = $state<TimerPhase>('SETUP');
    let runningState = $state<RunningState>('PAUSED');
    let timerMode = $state<TimerMode>('INTERVAL');
    
    // Config
    let configWork = $state(30); 
    let configRest = $state(60); 
    let configSets = $state(3);
    let allowOvertime = $state(false);

    // Active State
    let currentSet = $state(1);
    let remaining = $state(30); 
    let endTimestamp = $state<number | null>(null);
    let pausedTimeRemaining = $state<number | null>(null);
    let overtimeTriggered = $state(false);
    
    // Tick & Audio Tracking
    let lastTickedSecond = $state<number | null>(null);
    let playAlertTriggered = $state(false);

    // SW Integration
    let swRegistration: ServiceWorkerRegistration | null = null;
    let swMessageHandler: ((event: MessageEvent) => void) | null = null;

    // Derived States
    let isTimerActive = $derived(phase !== 'SETUP' && phase !== 'FINISHED');
    let showMinimizedPill = $derived(!visible && isTimerActive);

    $effect(() => {
        if (visible) {
            audioManager.init();
            if (phase === 'SETUP') {
                loadPreference();
                if (defaultSets > 0) configSets = defaultSets;
            }
        }
    });

    // Handle auto-starting rest timer from external components (e.g., set completion)
    $effect(() => {
        if (autoStartRestOnly && phase === 'SETUP') {
            audioManager.init();
            timerMode = 'REST_ONLY';
            loadPreference().then(() => {
                if (defaultSets > 0) configSets = defaultSets;
                startSession();
            });
        }
    });

    onMount(() => {
        restoreState();

        // Request current state from SW
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'GET_TIMER_STATE' });
        }
        
        // Listen for SW messages
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(reg => {
                swRegistration = reg;
            });

            swMessageHandler = (event: MessageEvent) => {
                if (event.data && event.data.type === 'TIMER_ACTION') {
                    handleTimerAction(event.data.action);
                } else if (event.data && event.data.type === 'TIMER_STATE_UPDATE') {
                    syncState(event.data.state);
                }
            };
            navigator.serviceWorker.addEventListener('message', swMessageHandler);
        }

        // Focus & Visibility sync to handle aggressive mobile tab suspension recovery
        const syncOnResume = () => {
            if (isTimerActive && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({ type: 'GET_TIMER_STATE' });
            }
        };

        window.addEventListener('focus', syncOnResume);
        document.addEventListener('visibilitychange', syncOnResume);

        return () => {
            if ('serviceWorker' in navigator && swMessageHandler) {
                navigator.serviceWorker.removeEventListener('message', swMessageHandler);
            }
            window.removeEventListener('focus', syncOnResume);
            document.removeEventListener('visibilitychange', syncOnResume);
            if (animationFrame) cancelAnimationFrame(animationFrame);
        };
    });

    // -- Core Logic --

    async function loadPreference() {
        if (!associatedExerciseId) return;
        try {
            const res = await getTimerPreferences(associatedExerciseId);
            if (res.ok && res.data) {
                configWork = res.data.workDuration;
                configRest = res.data.restDuration;
                allowOvertime = res.data.allowOvertime;
                if (res.data.mode) {
                    timerMode = res.data.mode;
                }
            }
        } catch (e) {
            console.warn(e);
        }
    }

    async function savePreference() {
        if (!associatedExerciseId) return;
        try {
            await saveTimerPreferences(associatedExerciseId, {
                workDuration: configWork,
                restDuration: configRest,
                allowOvertime,
                mode: timerMode
            });
        } catch (e) { console.error(e); }
    }

    function saveState() {
        if (phase === 'SETUP') return;
        const snapshot = {
            phase, runningState, remaining, endTimestamp, 
            configWork, configRest, configSets, configSetsOverridden: configSets, 
            allowOvertime,
            currentSet,
            associatedExerciseId, pausedTimeRemaining, timestamp: Date.now(),
            overtimeTriggered,
            mode: timerMode
        };
        localStorage.setItem('active_interval_timer', JSON.stringify(snapshot));
        return snapshot;
    }

    function restoreState() {
        try {
            const saved = localStorage.getItem('active_interval_timer');
            if (saved) {
                const s = JSON.parse(saved);
                if (Date.now() - s.timestamp < STATE_EXPIRY_MS) {
                    phase = s.phase;
                    runningState = s.runningState;
                    remaining = s.remaining;
                    endTimestamp = s.endTimestamp;
                    configWork = s.configWork;
                    configRest = s.configRest;
                    
                    if (s.configSets) configSets = s.configSets;
                    if (s.allowOvertime !== undefined) allowOvertime = s.allowOvertime;
                    
                    currentSet = s.currentSet;
                    associatedExerciseId = s.associatedExerciseId;
                    pausedTimeRemaining = s.pausedTimeRemaining;
                    overtimeTriggered = s.overtimeTriggered;
                    if (s.mode) timerMode = s.mode;
                    
                    // Show minimized pill on restoration rather than forcing overlay open
                    visible = false;
                }
            }
        } catch (e) {}
    }

    function clearState() {
        localStorage.removeItem('active_interval_timer');
    }

    function syncState(s: any) {
        if (!s) {
            if (phase !== 'SETUP' && phase !== 'FINISHED') {
                phase = 'SETUP';
                runningState = 'PAUSED';
                clearState();
            }
            return;
        }
        phase = s.phase;
        runningState = s.runningState;
        endTimestamp = s.endTimestamp;
        currentSet = s.currentSet;
        overtimeTriggered = s.overtimeTriggered;
        if (s.mode) timerMode = s.mode;
        
        // Recalculate remaining based on system clock delta to bypass background throttling
        if (endTimestamp && runningState === 'RUNNING') {
            const now = Date.now();
            const diff = endTimestamp - now;
            remaining = Math.ceil(diff / 1000);
        } else {
            remaining = s.remaining;
        }
    }

    function handleTimerAction(action: string) {
        if (action === 'extend-10') {
            remaining += 10;
            if (endTimestamp) endTimestamp += 10000;
            if (remaining > 0) {
                overtimeTriggered = false;
                playAlertTriggered = false;
            }
            
            const state = saveState();
            if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({ type: 'EXTEND_TIMER', state });
            }
        } else if (action === 'next-set') {
            skip();
        } else if (action === 'finish-session') {
            finishSession();
        } else if (action === 'pause') {
            pause();
        } else if (action === 'resume') {
            resume();
        }
    }

    function startSession() {
        requestNotificationPermission(); 
        savePreference();
        currentSet = 1;
        if (timerMode === 'REST_ONLY') {
            phase = 'REST';
            startPhase(configRest);
        } else {
            phase = 'WORK';
            startPhase(configWork);
        }
    }

    function startPhase(duration: number) {
        runningState = 'RUNNING';
        remaining = duration;
        endTimestamp = Date.now() + (duration * 1000);
        overtimeTriggered = false;
        playAlertTriggered = false;
        lastTickedSecond = null;
        
        const state = saveState();
        audioManager.playChime(); 

        if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ 
                type: 'START_TIMER', 
                state 
            });
        }
    }

    function pause() {
        runningState = 'PAUSED';
        pausedTimeRemaining = remaining;
        endTimestamp = null;
        const state = saveState();

        if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ 
                type: 'PAUSE_TIMER',
                state
            });
        }
    }

    function resume() {
        if (pausedTimeRemaining !== null) {
            runningState = 'RUNNING';
            endTimestamp = Date.now() + (pausedTimeRemaining * 1000);
            playAlertTriggered = false;
            lastTickedSecond = null;
            const state = saveState();

            if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({ 
                    type: 'RESUME_TIMER', 
                    state 
                });
            }
        }
    }

    function skip() {
        if (navigator.serviceWorker.controller) {
             navigator.serviceWorker.controller.postMessage({ type: 'SKIP_PHASE' });
        }
    }

    function stop() {
        phase = 'SETUP';
        runningState = 'PAUSED';
        if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'STOP_TIMER' });
        }
        clearState();
    }

    function finishSession() {
        phase = 'FINISHED';
        runningState = 'PAUSED';
        endTimestamp = null;
        if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'STOP_TIMER' });
        }
        onComplete();
        clearState();
    }

    function tick() {
        if (phase === 'SETUP' || phase === 'FINISHED' || runningState === 'PAUSED') return;
        
        if (endTimestamp) {
            const now = Date.now();
            const diff = endTimestamp - now;
            const newRemaining = Math.ceil(diff / 1000);
            
            if (newRemaining !== remaining) {
                remaining = newRemaining;
            }

            // Local audio warning beeps at 3, 2, 1 seconds remaining
            if (remaining > 0 && remaining <= 3 && remaining !== lastTickedSecond) {
                lastTickedSecond = remaining;
                audioManager.playTick();
            }

            // Local completion audio alert
            if (remaining <= 0 && !overtimeTriggered && !playAlertTriggered) {
                playAlertTriggered = true;
                audioManager.playCompletionAlert();
            }
        }
    }

    let animationFrame: number;
    function uiLoop() {
        tick();
        animationFrame = requestAnimationFrame(uiLoop);
    }

    onMount(() => {
        animationFrame = requestAnimationFrame(uiLoop);
    });

    async function requestNotificationPermission() {
        if ('Notification' in window && Notification.permission !== 'granted') {
            await Notification.requestPermission();
        }
    }

    function formatTime(s: number) {
        const sign = s < 0 ? '-' : '';
        const absSec = Math.abs(s);
        const m = Math.floor(absSec / 60);
        const sec = absSec % 60;
        return `${sign}${m}:${sec.toString().padStart(2, '0')}`;
    }

    function closeTimer() {
        if (phase === 'SETUP' || phase === 'FINISHED') {
            stop();
            visible = false;
        } else {
            visible = false;
        }
        if (onClose) onClose();
    }

    function getPhaseColor() {
        if (timerMode === 'REST_ONLY') return '#2dd4bf'; // Teal for rest
        return phase === 'WORK' ? '#4ade80' : '#2dd4bf';
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
            class:work={timerMode === 'INTERVAL' && phase === 'WORK'}
            class:rest={timerMode === 'REST_ONLY' || phase === 'REST'}
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
                        <!-- Mode Selector -->
                        <div class="mode-selector">
                            <button 
                                class="mode-btn" 
                                class:active={timerMode === 'INTERVAL'}
                                onclick={() => timerMode = 'INTERVAL'}
                            >⏱ Interval</button>
                            <button 
                                class="mode-btn" 
                                class:active={timerMode === 'REST_ONLY'}
                                onclick={() => timerMode = 'REST_ONLY'}
                            >😴 Rest Only</button>
                        </div>

                        {#if timerMode === 'INTERVAL'}
                            <div class="input-group" transition:fade={{ duration: 150 }}>
                                <label for="work-duration">Work</label>
                                <div class="time-adjuster">
                                    <button onclick={() => configWork = Math.max(5, configWork - 5)}>−</button>
                                    <span class="val">{formatTime(configWork)}</span>
                                    <button onclick={() => configWork += 5}>+</button>
                                </div>
                            </div>
                        {/if}

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
                        
                        <div class="input-group" style="flex-direction: row; align-items: center; justify-content: space-between;">
                            <label for="allow-overtime" style="margin: 0;">Overtime</label>
                            <label class="toggle-switch">
                                <input type="checkbox" id="allow-overtime" bind:checked={allowOvertime}>
                                <span class="slider"></span>
                            </label>
                        </div>
                        
                        <button class="start-btn" onclick={startSession}>
                            ▶ Start {timerMode === 'INTERVAL' ? 'Interval' : 'Rest'}
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
                                stroke-dasharray={RING_CIRCUMFERENCE}
                                stroke-dashoffset={RING_CIRCUMFERENCE * (1 - Math.max(0, Math.min(1, remaining / (phase === 'WORK' ? configWork : configRest))))}
                            />
                         </svg>
                         <div class="timer-val">
                              <div class="phase-label">
                                  {#if remaining < 0}
                                      OVERTIME
                                  {:else}
                                      {timerMode === 'REST_ONLY' ? 'REST' : phase}
                                  {/if}
                              </div>
                              <div class="digits" style:color={remaining < 0 ? '#ef4444' : 'inherit'}>
                                  {formatTime(remaining)}
                              </div>
                         </div>
                    </div>

                    <div class="controls-row">
                         <!-- +10s -->
                         <button class="ctl-btn secondary" onclick={() => handleTimerAction('extend-10')}>
                            +10
                         </button>

                         <!-- Play/Pause -->
                         {#if runningState === 'RUNNING'}
                            <button class="ctl-btn primary" onclick={pause}>⏸</button>
                         {:else}
                            <button class="ctl-btn primary" onclick={resume}>▶</button>
                         {/if}

                         <!-- Finish (Session) -->
                         <button class="ctl-btn secondary finish" onclick={finishSession}>
                            🏁
                         </button>
                    </div>

                    <div class="controls-sub">
                        <button class="text-btn" onclick={skip}>
                            {remaining < 0 ? 'Next Set' : '⏭ Skip'}
                        </button>
                        <button class="text-btn stop" onclick={stop}>✕ Abort</button>
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}

<!-- Minimized Floating Pill UI -->
{#if showMinimizedPill}
    <div 
        class="minimized-pill"
        transition:fly={{ y: 50, duration: 300 }}
        onclick={() => visible = true}
        onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') visible = true; }}
        role="button"
        tabindex="0"
        aria-label="Expand rest timer"
    >
        <div class="pill-left">
            <span class="pulsating-dot" style="--dot-color: {getPhaseColor()}"></span>
            <span class="pill-label">
                {timerMode === 'REST_ONLY' ? 'Rest' : (phase === 'WORK' ? 'Work' : 'Rest')} {currentSet}/{configSets}
            </span>
        </div>
        <div class="pill-right">
            <span class="pill-time" class:overtime={remaining < 0}>
                {formatTime(remaining)}
            </span>
            <div class="pill-controls">
                {#if runningState === 'RUNNING'}
                    <button class="pill-btn" onclick={(e) => { e.stopPropagation(); pause(); }} aria-label="Pause">⏸</button>
                {:else}
                    <button class="pill-btn" onclick={(e) => { e.stopPropagation(); resume(); }} aria-label="Resume">▶</button>
                {/if}
                <button class="pill-btn" onclick={(e) => { e.stopPropagation(); skip(); }} aria-label="Skip">⏭</button>
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

    /* Mode Selector */
    .mode-selector {
        display: flex;
        background: #f4f5f7;
        padding: 4px;
        border-radius: 12px;
        gap: 4px;
    }

    .mode-btn {
        flex: 1;
        border: none;
        background: transparent;
        padding: 8px;
        font-size: 0.9rem;
        font-weight: 600;
        color: #666;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
    }

    .mode-btn.active {
        background: white;
        color: #333;
        box-shadow: 0 2px 6px rgba(0,0,0,0.06);
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

    .controls-row {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        width: 100%;
        justify-content: center;
        margin-bottom: 1.5rem;
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
        box-shadow: 0 4px 10px rgba(0,0,0,0.05);
    }
    
    .ctl-btn.primary {
         background: #333;
         color: white;
         font-size: 2rem;
         width: 80px;
         height: 80px;
         box-shadow: 0 5px 20px rgba(0,0,0,0.2);
    }

    .ctl-btn.secondary {
        font-size: 1rem;
        font-weight: 700;
    }
    
    .ctl-btn.finish {
        font-size: 1.5rem;
    }

    .ctl-btn:active {
        transform: scale(0.95);
    }

    .controls-sub {
        display: flex;
        gap: 2rem;
    }

    .text-btn {
        background: none;
        border: none;
        color: #999;
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        padding: 0.5rem;
    }

    .text-btn.stop {
        color: #ef4444;
    }

    .finished-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
        text-align: center;
    }

    .check-icon {
        width: 80px;
        height: 80px;
        background: #4ade80;
        color: white;
        font-size: 3rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .reset-btn {
        padding: 0.75rem 1.5rem;
        background: #f4f5f7;
        border: none;
        border-radius: 12px;
        font-weight: 600;
        color: #333;
        cursor: pointer;
    }
    
    /* Toggle Switch */
    .toggle-switch {
        position: relative;
        display: inline-block;
        width: 48px;
        height: 26px;
    }

    .toggle-switch input { 
        opacity: 0;
        width: 0;
        height: 0;
    }

    .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        transition: .4s;
        border-radius: 34px;
    }

    .slider:before {
        position: absolute;
        content: "";
        height: 20px;
        width: 20px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: .4s;
        border-radius: 50%;
    }

    input:checked + .slider {
        background-color: #333;
    }

    input:checked + .slider:before {
        transform: translateX(22px);
    }

    /* Floating Pill styles */
    .minimized-pill {
        position: fixed;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1999;
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: calc(100% - 32px);
        max-width: 320px;
        height: 52px;
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.4);
        border-radius: 26px;
        padding: 0 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
        cursor: pointer;
        transition: transform 0.2s, background-color 0.2s;
        bottom: 24px; /* Desktop position */
    }

    .minimized-pill:hover {
        background: rgba(255, 255, 255, 0.95);
    }

    .minimized-pill:active {
        transform: translateX(-50%) scale(0.98);
    }

    .pill-left {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .pulsating-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: var(--dot-color, #2dd4bf);
        box-shadow: 0 0 0 0 rgba(45, 212, 191, 0.7);
        animation: pulse 1.6s infinite;
    }

    @keyframes pulse {
        0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(45, 212, 191, 0.7);
        }
        70% {
            transform: scale(1);
            box-shadow: 0 0 0 8px rgba(45, 212, 191, 0);
        }
        100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(45, 212, 191, 0);
        }
    }

    .pill-label {
        font-size: 0.9rem;
        font-weight: 700;
        color: #374151;
    }

    .pill-right {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .pill-time {
        font-family: 'Inter', monospace;
        font-size: 1.05rem;
        font-weight: 700;
        color: #111827;
    }

    .pill-time.overtime {
        color: #ef4444;
    }

    .pill-controls {
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .pill-btn {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: none;
        background: rgba(0, 0, 0, 0.05);
        color: #374151;
        font-size: 0.8rem;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .pill-btn:hover {
        background: rgba(0, 0, 0, 0.1);
    }

    /* Responsive position for Mobile bottom navigation bar clearance */
    @media (max-width: 640px) {
        .minimized-pill {
            bottom: 80px; /* Clear mobile sticky bottom TabBar */
        }
    }
</style>
