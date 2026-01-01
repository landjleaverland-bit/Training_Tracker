<script lang="ts">
    import { onMount } from 'svelte';
    import { createFingerboardSession, markAsSynced, markAsSyncError, updateSessionId } from '$lib/services/cache';
    import { createFingerboardSession as syncToServer, isOnline } from '$lib/services/api';
    import type { FingerboardExercise, ExerciseSet } from '$lib/types/session';

    const exerciseOptions = ['Max hangs', 'Recruitment pulls', 'Max pick-ups'];
    const gripOptions = ['Full-crimp', 'Half-crimp', 'Three finger drag', 'Pinch', 'Open hand', 'Sloper'];

    let date = $state(new Date().toISOString().split('T')[0]);
    let exercises = $state<FingerboardExercise[]>([]);
	
	// Add initial exercise card
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
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                if (data.date) date = data.date;
                if (data.exercises && Array.isArray(data.exercises)) {
                    exercises = data.exercises;
                }
            } catch (e) {
                console.error('Failed to restore draft', e);
            }
        }
        
        // Ensure at least one exercise exists if storage was empty or invalid
        if (exercises.length === 0) {
            addExercise();
        }
        loaded = true;
    });

    // Save to storage whenever state changes
    $effect(() => {
        if (!loaded) return;
        const draft = {
            date,
            exercises
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
                location: 'N/A', // Fingerboarding usually doesn't need location or defaults to generic
                exercises: JSON.parse(JSON.stringify(exercises)) // Deep copy
            };

            const localSession = createFingerboardSession(sessionData);

            if (isOnline()) {
                const result = await syncToServer(sessionData);
                if (result.ok) {
                    // Update local ID to match server ID to prevent duplicates
                    updateSessionId(localSession.id, result.id!);
                    // Mark formatted/updated session as synced
                    markAsSynced(result.id!);
                    saveStatus = 'success';
                    saveMessage = 'Session saved and synced!';
                    localStorage.removeItem(STORAGE_KEY);
                } else {
                    markAsSyncError(localSession.id);
                    saveStatus = 'success';
                    saveMessage = 'Saved locally. Sync failed: ' + (result.error || 'Unknown error');
                    localStorage.removeItem(STORAGE_KEY);
                }
            } else {
                saveStatus = 'success';
                saveMessage = 'Saved locally. Will sync when online.';
                localStorage.removeItem(STORAGE_KEY);
            }

            window.dispatchEvent(new CustomEvent('session-saved'));
            setTimeout(() => {
                resetForm();
            }, 2000);
        } catch (e) {
            saveStatus = 'error';
            saveMessage = 'Failed to save session';
            console.error('Save error:', e);
        }
    }

    function resetForm() {
        date = new Date().toISOString().split('T')[0];
        exercises = [];
        addExercise();
        saveStatus = 'idle';
        saveMessage = '';
    }
</script>

<div class="form-content">
	<div class="header-row">
		<h3>🤏 Fingerboarding</h3>
		<button class="add-row-btn" onclick={addExercise}>+ Add Exercise</button>
	</div>

	<div class="form-group date-group">
		<label for="date">Date</label>
		<input type="date" id="date" bind:value={date} />
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
	
	input[type="date"] {
		padding: 0.5rem;
		border-radius: 6px;
		border: 1px solid #ccc;
		width: 100%;
	}
</style>
