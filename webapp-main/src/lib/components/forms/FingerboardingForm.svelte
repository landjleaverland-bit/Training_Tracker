<script lang="ts">
    import { onMount, createEventDispatcher } from 'svelte';
	import { createFingerboardSession, updateFingerboardSession, isOnline } from '$lib/services/api';
    import type { FingerboardSession, FingerboardExercise, ExerciseSet } from '$lib/types/session';
    import RestTimer from './gym/RestTimer.svelte';
    
    const dispatch = createEventDispatcher();

    // Props
    interface Props {
        initialData?: FingerboardSession | null;
        onCancel?: () => void;
        onSaved?: () => void;
    }
    
    let { initialData = null, onCancel, onSaved }: Props = $props();
    let isEditing = $derived(!!initialData);

    const exerciseOptions = ['Max hangs', 'Recruitment pulls', 'Max pick-ups'];
    const gripOptions = ['Full-crimp', 'Half-crimp', 'Three finger drag', 'Pinch', 'Open hand', 'Sloper'];

    let date = $state(new Date().toISOString().split('T')[0]);
    let time = $state(new Date().toTimeString().split(' ')[0].slice(0, 5));
    let exercises = $state<FingerboardExercise[]>([]);
	
    let fingerLoad = $state(3);
    let shoulderLoad = $state(3);
    let forearmLoad = $state(3);
    let openGrip = $state(3);
    let crimpGrip = $state(3);
    let pinchGrip = $state(3);
    let sloperGrip = $state(3);
    let jugGrip = $state(3);
    
    let notes = $state('');
	
	// Add initial exercise card
    let showRestTimer = $state(false);
    let activeTimerExerciseId = $state<string | null>(null);
    let timerDefaultSets = $state(3);

    function startRest(exercise: FingerboardExercise) {
        activeTimerExerciseId = exercise.id;
        timerDefaultSets = exercise.sets;
        showRestTimer = true;
    }

	function addExercise() {
		exercises = [
			...exercises, 
			{
				id: crypto.randomUUID(),
				name: exerciseOptions[0],
				gripType: gripOptions[1], // Default to Half-crimp
				sets: 1,
				details: [{ weight: 0, reps: 5 }],
				notes: ''
			}
		];
	}

    const STORAGE_KEY = 'fingerboard_session_draft';

    let loaded = $state(false);

    // Initialize with one exercise if empty, or load from storage
    onMount(() => {
        if (initialData) {
            date = initialData.date;
            time = initialData.time || '12:00';
            exercises = initialData.exercises;
            
            fingerLoad = initialData.fingerLoad || 3;
            shoulderLoad = initialData.shoulderLoad || 3;
            forearmLoad = initialData.forearmLoad || 3;
            
            openGrip = initialData.openGrip || 3;
            crimpGrip = initialData.crimpGrip || 3;
            pinchGrip = initialData.pinchGrip || 3;
            sloperGrip = initialData.sloperGrip || 3;
            jugGrip = initialData.jugGrip || 3;
            
            notes = initialData.notes || '';
            
            loaded = true;
        } else {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                try {
                    const data = JSON.parse(saved);
                    if (data.time) time = data.time;
                    if (data.exercises && Array.isArray(data.exercises)) {
                         exercises = data.exercises;
                    }
                    
                    if (data.fingerLoad) fingerLoad = data.fingerLoad;
                    if (data.shoulderLoad) shoulderLoad = data.shoulderLoad;
                    if (data.forearmLoad) forearmLoad = data.forearmLoad;
                    
                    if (data.openGrip) openGrip = data.openGrip;
                    if (data.crimpGrip) crimpGrip = data.crimpGrip;
                    if (data.pinchGrip) pinchGrip = data.pinchGrip;
                    if (data.sloperGrip) sloperGrip = data.sloperGrip;
                    if (data.jugGrip) jugGrip = data.jugGrip;
                    
                    if (data.notes) notes = data.notes;
                } catch (e) {
                    console.error('Failed to restore draft', e);
                }
            }
            
            // Ensure at least one exercise exists if storage was empty or invalid
            if (exercises.length === 0) {
                addExercise();
            }
            loaded = true;
        }
    });

    // Save to storage whenever state changes
    $effect(() => {
        if (!loaded || isEditing) return;
        const draft = {
            date,
            time,
            exercises,
            fingerLoad, shoulderLoad, forearmLoad,
            openGrip, crimpGrip, pinchGrip, sloperGrip, jugGrip,
            notes
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    });

	function removeExercise(index: number) {
		exercises = exercises.filter((_, i) => i !== index);
	}

	function addSet(exerciseIndex: number) {
		const exercise = exercises[exerciseIndex];
		// Copy previous set's weight/reps for convenience
		const lastSet = exercise.details[exercise.details.length - 1];
		exercise.details = [...exercise.details, { ...lastSet }];
		exercise.sets = exercise.details.length;
	}

	function removeSet(exerciseIndex: number, setIndex: number) {
		const exercise = exercises[exerciseIndex];
		if (exercise.details.length > 1) {
			exercise.details = exercise.details.filter((_, i) => i !== setIndex);
			exercise.sets = exercise.details.length;
		}
	}

    let saveStatus = $state<'idle' | 'saving' | 'success' | 'error'>('idle');
    let saveMessage = $state('');

    async function saveSession() {
        saveStatus = 'saving';
		
        try {
            const sessionData = {
                date,
                time,
                location: 'N/A', // Fingerboarding usually doesn't need location or defaults to generic
                exercises: JSON.parse(JSON.stringify(exercises)), // Deep copy
                fingerLoad,
                shoulderLoad,
                forearmLoad,
                openGrip,
                crimpGrip,
                pinchGrip,
                sloperGrip,
                jugGrip,
                notes
            };
            
            let result;
            if (isEditing && initialData) {
                result = await updateFingerboardSession(initialData.id, sessionData);
            } else {
                result = await createFingerboardSession(sessionData);
            }

            if (result.ok) {
                saveStatus = 'success';
                saveMessage = 'Session saved!';
                if (!isEditing) localStorage.removeItem(STORAGE_KEY);
                
                if (onSaved) {
                    onSaved();
                } else {
                    window.dispatchEvent(new CustomEvent('session-saved'));
                    setTimeout(() => {
                        resetForm();
                    }, 2000);
                }
            } else {
                saveStatus = 'error';
                saveMessage = 'Failed to save: ' + (result.error || 'Unknown error');
            }
        } catch (e) {
            saveStatus = 'error';
            saveMessage = 'Failed to save session';
            console.error('Save error:', e);
        }
    }

    function resetForm() {
        date = new Date().toISOString().split('T')[0];
        time = new Date().toTimeString().split(' ')[0].slice(0, 5);
        exercises = [];
        addExercise();
        fingerLoad = 3;
        shoulderLoad = 3;
        forearmLoad = 3;
        openGrip = 3;
        crimpGrip = 3;
        pinchGrip = 3;
        sloperGrip = 3;
        jugGrip = 3;
        notes = '';
        saveStatus = 'idle';
        saveMessage = '';
    }
</script>

<div class="form-content">
	<div class="header-row">
        <div style="flex: 1; display: flex; justify-content: space-between; align-items: center;">
            {#if !isEditing}
                 <h3>🤏 Fingerboarding</h3>
            {/if}
        </div>
		<button class="add-row-btn" onclick={addExercise}>+ Add Exercise</button>
	</div>

	<div class="form-group date-group">
		<label for="date">Date</label>
		<div class="date-time-row">
			<input type="date" id="date" bind:value={date} />
			<input type="time" id="time" bind:value={time} />
		</div>
	</div>

	<div class="cards-container">
		{#each exercises as exercise, i}
			<div class="exercise-card">
				<div class="card-header">
					<div class="header-inputs">
						<select bind:value={exercise.name}>
							{#each exerciseOptions as opt}
								<option value={opt}>{opt}</option>
							{/each}
						</select>
						<select bind:value={exercise.gripType}>
							{#each gripOptions as opt}
								<option value={opt}>{opt}</option>
							{/each}
						</select>
					</div>
					<button class="remove-card-btn" onclick={() => removeExercise(i)} title="Remove Exercise">✕</button>
				</div>

				<div class="sets-list">
					{#each exercise.details as set, j}
						<div class="set-row">
							<div class="input-wrap">
								<label for="weight-{i}-{j}">Weight</label>
								<input type="number" id="weight-{i}-{j}" bind:value={set.weight} placeholder="0" />
							</div>
							<div class="input-wrap">
								<label for="reps-{i}-{j}">Reps/Secs</label>
								<input type="number" id="reps-{i}-{j}" bind:value={set.reps} placeholder="1" />
							</div>
							{#if exercise.details.length > 1}
								<button class="remove-set-btn" onclick={() => removeSet(i, j)}>✕</button>
							{/if}
						</div>
					{/each}
					<button class="add-set-btn" onclick={() => addSet(i)}>+ Add Set</button>
                    <button class="rest-btn" onclick={() => startRest(exercise)} title="Interval Timer">⏱ Timer</button>
				</div>

				<div class="card-footer">
					<div class="meta-input">
						<label for="total-sets-{i}">Total Sets</label>
						<input type="number" id="total-sets-{i}" value={exercise.sets} readonly disabled />
					</div>
					<div class="notes-input">
						<label for="notes-{i}">Notes</label>
						<input type="text" id="notes-{i}" bind:value={exercise.notes} placeholder="Notes..." />
					</div>
				</div>
			</div>
		{/each}
	</div>

	<!-- Load Metrics Section -->
	<div class="load-section">
		<h4>Load Metrics</h4>
		<div class="load-metrics">
			<div class="load-item">
				<label for="finger-load">Finger</label>
				<input type="number" id="finger-load" bind:value={fingerLoad} min="1" max="5" />
				<span class="load-scale">/ 5</span>
			</div>
			<div class="load-item">
				<label for="shoulder-load">Shoulder</label>
				<input type="number" id="shoulder-load" bind:value={shoulderLoad} min="1" max="5" />
				<span class="load-scale">/ 5</span>
			</div>
			<div class="load-item">
				<label for="forearm-load">Forearm</label>
				<input type="number" id="forearm-load" bind:value={forearmLoad} min="1" max="5" />
				<span class="load-scale">/ 5</span>
			</div>
		</div>
		
		<h4 class="mt-4">Grip Metrics</h4>
		<div class="load-metrics">
			<div class="load-item">
				<label for="open-grip">Open</label>
				<input type="number" id="open-grip" bind:value={openGrip} min="1" max="5" />
				<span class="load-scale">/ 5</span>
			</div>
			<div class="load-item">
				<label for="crimp-grip">Crimp</label>
				<input type="number" id="crimp-grip" bind:value={crimpGrip} min="1" max="5" />
				<span class="load-scale">/ 5</span>
			</div>
			<div class="load-item">
				<label for="pinch-grip">Pinch</label>
				<input type="number" id="pinch-grip" bind:value={pinchGrip} min="1" max="5" />
				<span class="load-scale">/ 5</span>
			</div>
			<div class="load-item">
				<label for="sloper-grip">Sloper</label>
				<input type="number" id="sloper-grip" bind:value={sloperGrip} min="1" max="5" />
				<span class="load-scale">/ 5</span>
			</div>
			<div class="load-item">
				<label for="jug-grip">Jug</label>
				<input type="number" id="jug-grip" bind:value={jugGrip} min="1" max="5" />
				<span class="load-scale">/ 5</span>
			</div>
		</div>
	</div>

    <div class="form-group notes-section">
        <label for="session-notes">Session Notes</label>
        <textarea 
            id="session-notes" 
            bind:value={notes} 
            placeholder="How did the session feel? Energy levels, mood, etc."
            rows="3"
            class="session-notes-area"
        ></textarea>
    </div>

	<div class="submit-section">
		{#if saveMessage}
			<div class="save-message" class:success={saveStatus === 'success'} class:error={saveStatus === 'error'}>
				{saveMessage}
			</div>
		{/if}
		<button 
			type="button" 
			class="submit-btn" 
			onclick={saveSession}
			disabled={saveStatus === 'saving'}
		>
			{#if saveStatus === 'saving'}
				Saving...
			{:else if saveStatus === 'success'}
				✓ Saved!
			{:else}
				Save Session
			{/if}
		</button>
	</div>

    <RestTimer 
        bind:visible={showRestTimer} 
        defaultSets={timerDefaultSets} 
        associatedExerciseId={activeTimerExerciseId}
    />
</div>

<style>
	.form-content {
		animation: slideIn 0.2s ease;
	}

	@keyframes slideIn {
		from { opacity: 0; transform: translateY(4px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.header-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	h3 {
		margin: 0;
		color: var(--teal-secondary);
		font-size: 1.25rem;
	}

	.date-group {
		margin-bottom: 1.5rem;
	}

	.add-row-btn {
		background: rgba(74, 155, 155, 0.1);
		color: var(--teal-secondary);
		border: 1px solid rgba(74, 155, 155, 0.3);
		padding: 0.5rem 1rem;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		font-size: 0.9rem;
	}

	.cards-container {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.exercise-card {
		background: white;
		border: 1px solid rgba(74, 155, 155, 0.2);
		border-radius: 12px;
		padding: 1rem;
		box-shadow: 0 2px 8px rgba(0,0,0,0.03);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1rem;
		gap: 1rem;
	}

	.header-inputs {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
		flex: 1;
	}

	.remove-card-btn {
		background: none;
		border: none;
		color: #d9534f;
		font-size: 1.2rem;
		cursor: pointer;
		padding: 0 0.5rem;
	}

	.sets-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1rem;
		padding: 0.5rem;
		background: #f8f9fa;
		border-radius: 8px;
	}

	.set-row {
		display: flex;
		gap: 0.5rem;
		align-items: flex-end;
	}

	.input-wrap {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		flex: 1;
	}

	.input-wrap label {
		font-size: 0.75rem;
		color: var(--text-secondary);
	}

	.input-wrap input {
		width: 100%;
		padding: 0.4rem;
		border: 1px solid #ddd;
		border-radius: 6px;
	}

	.remove-set-btn {
		background: none;
		border: none;
		color: #d9534f;
		font-size: 1.1rem;
		padding: 0 0.5rem;
		cursor: pointer;
		height: 32px;
	}

	.add-set-btn {
		align-self: flex-start;
		background: none;
		border: 1px dashed #aaa;
		color: var(--text-secondary);
		padding: 0.3rem 0.8rem;
		border-radius: 4px;
		font-size: 0.8rem;
		cursor: pointer;
		margin-top: 0.2rem;
	}

    .rest-btn {
        align-self: flex-start;
        background: rgba(45, 212, 191, 0.1);
        color: var(--teal-primary);
        border: 1px solid var(--teal-primary);
        padding: 0.3rem 0.8rem;
        border-radius: 4px;
        font-size: 0.8rem;
        cursor: pointer;
        margin-top: 0.2rem;
        font-weight: 600;
        margin-left: 0.5rem;
    }

    .rest-btn:hover {
        background: var(--teal-primary);
        color: white;
    }

	.card-footer {
		display: grid;
		grid-template-columns: 80px minmax(0, 1fr);
		gap: 0.5rem;
		border-top: 1px solid #eee;
		padding-top: 1rem;
	}

	.meta-input, .notes-input {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.meta-input label, .notes-input label {
		font-size: 0.75rem;
		color: var(--text-secondary);
	}

	.meta-input input, .notes-input input {
		width: 100%;
		padding: 0.4rem;
		border: 1px solid #ddd;
		border-radius: 6px;
		background: #fcfcfc;
	}

	.submit-btn {
		width: 100%;
		padding: 1rem;
		background: linear-gradient(135deg, var(--teal-primary) 0%, var(--teal-secondary) 100%);
		color: white;
		border: none;
		border-radius: 12px;
		font-weight: 600;
		font-size: 1.1rem;
		cursor: pointer;
		box-shadow: 0 4px 12px rgba(74, 155, 155, 0.3);
		transition: transform 0.2s, box-shadow 0.2s;
	}

	.submit-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.save-message {
		text-align: center;
		padding: 0.5rem;
		margin-bottom: 0.5rem;
		border-radius: 6px;
		font-size: 0.9rem;
	}

	.save-message.success {
		background: #d4edda;
		color: #155724;
	}

	.save-message.error {
		background: #f8d7da;
		color: #721c24;
	}
	
	select {
		padding: 0.5rem;
		border-radius: 6px;
		border: 1px solid #ccc;
		background: white;
	}
	
	.date-time-row {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 0.5rem;
	}
	
	input[type="date"], input[type="time"] {
		padding: 0.5rem;
		border-radius: 6px;
		border: 1px solid #ccc;
		width: 100%;
		background: white;
	}

	.mt-4 {
		margin-top: 1.5rem !important;
	}

	/* Load Metrics Section */
	.load-section {
		background: linear-gradient(135deg, rgba(244, 196, 48, 0.08) 0%, rgba(74, 155, 155, 0.08) 100%);
		border-radius: 12px;
		padding: 1.25rem;
		margin: 1.5rem 0;
		border: 1px solid rgba(74, 155, 155, 0.15);
	}

	@media (max-width: 640px) {
		.load-section {
			padding: 0.8rem;
			margin: 1rem 0;
		}
	}
	
	.load-section h4 {
		margin: 0 0 0.75rem 0;
		color: var(--text-primary);
		font-size: 1rem;
		font-weight: 600;
	}

	.load-metrics {
		display: flex;
		gap: 1.5rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.load-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
	}

	.load-item label {
		font-weight: 500;
		color: var(--text-primary);
		font-size: 0.85rem;
	}
    
    .load-item input {
		width: 60px;
		padding: 0.4rem;
		border: 1px solid rgba(74, 155, 155, 0.3);
		border-radius: 6px;
		text-align: center;
	}

	.load-scale {
		font-size: 0.75rem;
		color: var(--text-secondary);
	}
    
    .session-notes-area {
        width: 100%;
        padding: 0.8rem;
        border-radius: 8px;
        border: 2px solid rgba(74, 155, 155, 0.25);
        background: white;
        font-size: 0.95rem;
        font-family: inherit;
        resize: vertical;
        box-sizing: border-box;
    }
    
    .form-group.notes-section {
        margin: 1.5rem 0;
    }
</style>
