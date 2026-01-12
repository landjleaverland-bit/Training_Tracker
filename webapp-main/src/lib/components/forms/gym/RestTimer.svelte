<script lang="ts">
    /**
     * @file RestTimer.svelte
     * @component
     * @description A versatile interval timer for rest and work periods.
     * Features:
     * - Configurable Work/Rest durations
     * - Set counting
     * - Audio feedback (chimes)
     * - LocalStorage state persistence for resilience
     * - Floating overlay UI
     */
    import { onMount, onDestroy } from 'svelte';
    import { fade, fly, scale } from 'svelte/transition';
    import { cubicOut } from 'svelte/easing';
    import { audioManager } from '$lib/utils/audio';
    import { getTimerPreferences, saveTimerPreferences } from '$lib/services/api';

    interface NotificationAction {
        action: string;
        title: string;
        icon?: string;
    }

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
    let allowOvertime = $state(false);

    // Active State
    let currentSet = $state(1);
    let remaining = $state(30); 
    let endTimestamp = $state<number | null>(null);
    let pausedTimeRemaining = $state<number | null>(null);
    let overtimeTriggered = $state(false);
    let lastNotifiedRemaining = $state<number | null>(null);
    
    // Derived for UI
    let progress = $state(0);
    
    // Preferences Storage
    // const STORAGE_KEY = 'interval_timer_prefs'; // Deprecated in favor of API

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
        
        // Listen for SW messages
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'TIMER_ACTION') {
                    handleTimerAction(event.data.action);
                }
            });
        }

        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
            clearInterval(timerInterval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    });

    function handleVisibilityChange() {
        if (document.hidden && runningState === 'RUNNING') {
            updateNotification();
        }
    }

    function updateNotification() {
        const status = phase === 'WORK' ? 'Work' : 'Rest';
        const label = remaining < 0 ? 'Overtime' : 'Remaining';
        const text = `${label}: ${formatTime(Math.abs(remaining))}`;
        
        // Don't show "Next Set" actions while running, only when finished/overtime
        // Unless we are in overtime? logic below handles overtime separately
        if (remaining >= 0) {
            sendNotification(`${status} Timer`, text, [], false);
        } else {
             // In overtime, we want to keep the actions if possible, or re-send them?
             // Overtime logic in tick handles the detailed notification.
             // Here we simple update time if needed.
             // But re-sending without actions clears them. 
             // Let's defer overtime updates to the specific overtime block in tick.
             if (allowOvertime && overtimeTriggered) {
                 sendNotification("Interval Finished", `Overtime: ${formatTime(Math.abs(remaining))}`, [
                     { action: 'next-set', title: 'Next Set' },
                     { action: 'extend-10', title: '+10s' }
                 ], false);
             }
        }
    }

    // -- Notifications --
    async function requestNotificationPermission() {
        if ('Notification' in window && Notification.permission !== 'granted') {
            await Notification.requestPermission();
        }
    }

    function sendNotification(title: string, body: string, actions: NotificationAction[] = [], renotify = true) {
        if ('serviceWorker' in navigator && Notification.permission === 'granted') {
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(title, {
                    body,
                    icon: '/favicon.png', // Fallback or app icon
                    vibrate: renotify ? [200, 100, 200] : [],
                    actions,
                    tag: 'rest-timer',
                    renotify
                } as any);
            });
        }
    }

    function handleTimerAction(action: string) {
        if (action === 'extend-10') {
            remaining += 10;
            if (endTimestamp) endTimestamp += 10000;
            // If in overtime (negative), adding 10s might make it positive again?
            // If remaining was -5, adding 10 makes it +5.
            // If we want to "Extend Rest" while in overtime, we probably want to reset to +10s?
            // Or just add 10s to current.
            // User requirement: "+10s Rest". 
            // If I am 5s overtime (-5), and I add 10s, I have 5s left. That makes sense.
            // Overtime trigger should be reset if it goes positive?
            if (remaining > 0) overtimeTriggered = false;
            
            saveState();
        } else if (action === 'next-set') {
            skip();
        }
    }

    // -- Core Logic --

    async function loadPreference() {
        if (!associatedExerciseId) return;
        try {
            const res = await getTimerPreferences(associatedExerciseId);
            if (res.ok && res.data) {
                configWork = res.data.workDuration;
                configRest = res.data.restDuration;
                allowOvertime = res.data.allowOvertime;
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
                allowOvertime
            });
        } catch (e) { console.error(e); }
    }

    // Resilience
    function saveState() {
        if (phase === 'SETUP') return;
        const snapshot = {
            phase, runningState, remaining, endTimestamp, 
            configWork, configRest, configSets, configSetsOverridden: configSets, // Note: configSets might be good to save
            allowOvertime,
            currentSet,
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
                    // configSets = s.configSets; // Don't restore sets? Or should we?
                    // Actually, if we are restoring an active session, we SHOULD restore sets to respect the in-progress state.
                    if (s.configSets) configSets = s.configSets;
                    if (s.allowOvertime !== undefined) allowOvertime = s.allowOvertime;
                    
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
        requestNotificationPermission(); // Request on start
        savePreference();
        phase = 'WORK';
        currentSet = 1;
        startPhase(configWork);
    }

    function startPhase(duration: number) {
        runningState = 'RUNNING';
        remaining = duration;
        endTimestamp = Date.now() + (duration * 1000);
        overtimeTriggered = false;
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
        
        // audoManager.playCompletionAlert(); // Handled in tick when crossing 0
        
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
                sendNotification("Work Complete", `Resting for ${configRest}s`);
            }
        } else if (phase === 'REST') {
            currentSet++;
            phase = 'WORK';
            startPhase(configWork);
            sendNotification("Rest Complete", `Starting Set ${currentSet}/${configSets}`);
        }
    }

    function tick() {
        if (!visible || phase === 'SETUP' || phase === 'FINISHED' || runningState === 'PAUSED') return;
        
        if (endTimestamp) {
            const now = Date.now();
            const diff = endTimestamp - now;
            remaining = Math.ceil(diff / 1000);

            // Background Notification Update
            if (document.hidden) {
                if (lastNotifiedRemaining !== remaining) {
                    updateNotification();
                    lastNotifiedRemaining = remaining;
                }
            }

            if (remaining <= 0) {
                if (!overtimeTriggered) {
                     overtimeTriggered = true;
                     audioManager.playCompletionAlert();
                     
                     if (!allowOvertime) {
                         remaining = 0;
                         handlePhaseComplete();
                     } else {
                         // Overtime Alert (First time) - Needs sound/vibrate
                         sendNotification("Interval Finished", "Overtime started", [
                             { action: 'next-set', title: 'Next Set' },
                             { action: 'extend-10', title: '+10s' }
                         ], true); // renotify: true for alert
                     }
                }
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
                        
                        <div class="input-group" style="flex-direction: row; align-items: center; justify-content: space-between;">
                            <label for="allow-overtime" style="margin: 0;">Overtime</label>
                            <label class="toggle-switch">
                                <input type="checkbox" id="allow-overtime" bind:checked={allowOvertime}>
                                <span class="slider"></span>
                            </label>
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
                             <div class="phase-label">
                                 {remaining < 0 ? 'OVERTIME' : phase}
                             </div>
                             <div class="digits" style:color={remaining < 0 ? '#ef4444' : 'inherit'}>
                                 {formatTime(Math.abs(remaining))}
                             </div>
                         </div>
                    </div>

                    <div class="controls">
                         {#if runningState === 'RUNNING'}
                            <button class="ctl-btn pause" onclick={pause}>⏸</button>
                         {:else}
                            <button class="ctl-btn play" onclick={resume}>▶</button>
                         {/if}
                         <button class="ctl-btn skip" onclick={skip}>
                            {remaining < 0 ? 'Next' : '⏭'}
                         </button>
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

    /* Toggle Switch */
    .toggle-switch {
        position: relative;
        display: inline-block;
        width: 50px;
        height: 28px;
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
        background-color: #eee;
        transition: .4s;
        border-radius: 34px;
    }

    .slider:before {
        position: absolute;
        content: "";
        height: 20px;
        width: 20px;
        left: 4px;
        bottom: 4px;
        background-color: white;
        transition: .4s;
        border-radius: 50%;
        box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    }

    input:checked + .slider {
        background-color: #333;
    }

    input:focus + .slider {
        box-shadow: 0 0 1px #333;
    }

    input:checked + .slider:before {
        transform: translateX(22px);
    }
</style>
