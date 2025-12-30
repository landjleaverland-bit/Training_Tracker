<script lang="ts">
	// Outdoor Climb form for logging outdoor climbing sessions
	import { createOutdoorClimbSession, markAsSynced, markAsSyncError } from '$lib/services/cache';
	import { createOutdoorSession as syncToServer, isOnline } from '$lib/services/api';
	import { getAreas, getCrags } from '$lib/data/outdoor_locations';

	const areas = getAreas();
	const climbingTypes = ['Boulder', 'Sport', 'Trad'];
	const attemptTypes = ['Flash', 'Redpoint', 'Dogged'];

	// Training classification options
	// Training classification options
	const trainingTypes = ['None', 'Projecting', 'Onsighting', 'Campusing', 'Repeaters'];
	const difficulties = ['None', 'Easy', 'Medium', 'Hard', 'Max', 'Limit+'];
	const categories = ['None', 'Technique', 'Strength', 'Strength-endurance', 'Warm-up', 'Power'];
	const energySystems = ['None', 'Aerobic capacity', 'Aerobic lactic power', 'Anaerobic alactic capacity', 'Anaerobic alactic power', 'Anaerobic power', 'Anaerobic lactic capacity'];
	const techniqueFocuses = ['None', 'Double-clutch', 'Standing on volumes', 'Trusting feet'];

	// Valid grades (case-insensitive matching)
	const validGrades = [
		'V0-', '4-', 'V0', '4', 'V0+', '4+', 'V1', '5', 'V2', '5+', 'V3', '6A', 'V4', '6B', 'V5', '6C',
		'V6', '7A', 'V7', '7A+', 'V8', '7B', '7B+', 'V9', '7C', 'V10', '7C+', 'V11', '8A', 'V12', '8A+',
		'V13', '8B', 'V14', '8B+', 'V15', '8C', 'V16', '8C+', 'V17', '9A'
	];
	const validGradesLower = validGrades.map(g => g.toLowerCase());

	let expandedNoteIndex = $state<number | null>(null);

	interface ClimbEntry {
		isSport: boolean;
		name: string;
		grade: string;
		attemptType: string;
		attemptsNum: number;
		notes: string;
	}

	// Form state
	let date = $state(new Date().toISOString().split('T')[0]);
	let area = $state('');
	let crag = $state('');
	let sector = $state('');
	let climbingType = $state('');
	let trainingType = $state('None');
	let difficulty = $state('None');
	let category = $state('None');
	let energySystem = $state('None');
	let techniqueFocus = $state('None');
	let fingerLoad = $state(3);
	let shoulderLoad = $state(3);
	let forearmLoad = $state(3);
	
	let climbs = $state<ClimbEntry[]>([
		{ isSport: false, name: '', grade: '', attemptType: 'Flash', attemptsNum: 1, notes: '' }
	]);

	// Reactive crag list based on selected area
	let availableCrags = $derived(area ? getCrags(area) : []);
    
    let isOtherCrag = $state(false);

	// Reset crag when area changes
	$effect(() => {
		if (area) {
			crag = '';
            isOtherCrag = false;
		}
	});

    function onCragChange() {
        if (crag === 'Other') {
            isOtherCrag = true;
            crag = '';
        }
    }

    function cancelOtherCrag() {
        isOtherCrag = false;
        crag = '';
    }

	function addClimb() {
		climbs = [...climbs, { isSport: false, name: '', grade: '', attemptType: 'Flash', attemptsNum: 1, notes: '' }];
	}

	function removeClimb(index: number) {
		climbs = climbs.filter((_, i) => i !== index);
	}

	function handleAttemptTypeChange(index: number, value: string) {
		climbs[index].attemptType = value;
		if (value === 'Flash') {
			climbs[index].attemptsNum = 1;
		}
	}

	function handleNoteFocus(index: number) {
		expandedNoteIndex = index;
	}

	function handleNoteBlur() {
		expandedNoteIndex = null;
	}

	// Show Sport? column for Trad climbing to distinguish sport routes from trad
	let showSportColumn = $derived(climbingType === 'Trad');

	// Get isSport value based on climbing type
	function getIsSport(climb: ClimbEntry): boolean {
		if (climbingType === 'Sport') return true;
		if (climbingType === 'Boulder') return false;
		return climb.isSport; // Trad - use per-climb value to mark sport routes
	}

	// Validate grade input
	function isValidGrade(grade: string): boolean {
		if (!grade.trim()) return true;
		return validGradesLower.includes(grade.trim().toLowerCase());
	}

	// Save status
	let saveStatus = $state<'idle' | 'saving' | 'success' | 'error'>('idle');
	let saveMessage = $state('');

	// Validate form before saving
	function validateForm(): string | null {
		if (!area) return 'Please select an area';
		if (!crag) return 'Please select a crag';
		if (!climbingType) return 'Please select a climbing type';
		// Training type now defaults to None, so no check needed
		
		const invalidGrades = climbs.filter(c => c.grade.trim() && !isValidGrade(c.grade));
		if (invalidGrades.length > 0) return 'Please fix invalid grades';
		
		return null;
	}

	// Save session to local cache and sync to server
	async function saveSession() {
		const error = validateForm();
		if (error) {
			saveStatus = 'error';
			saveMessage = error;
			return;
		}

		saveStatus = 'saving';
		
		try {
			const preparedClimbs = climbs.map(climb => ({
				...climb,
				isSport: getIsSport(climb)
			}));

			const sessionData = {
				date,
				area,
				crag,
				sector: sector || undefined,
				climbingType,
				trainingType,
				difficulty,
				category,
				energySystem,
				techniqueFocus,
				fingerLoad,
				shoulderLoad,
				forearmLoad,
				climbs: preparedClimbs
			};

			// Save to local cache first (offline-first)
			const localSession = createOutdoorClimbSession(sessionData);

			// Try to sync to server if online
			if (isOnline()) {
				const result = await syncToServer(sessionData);
				if (result.ok) {
					markAsSynced(localSession.id);
					saveStatus = 'success';
					saveMessage = 'Session saved and synced!';
				} else {
					markAsSyncError(localSession.id);
					saveStatus = 'success';
					saveMessage = 'Saved locally. Sync failed: ' + (result.error || 'Unknown error');
				}
			} else {
				saveStatus = 'success';
				saveMessage = 'Saved locally. Will sync when online.';
			}

			// Dispatch custom event to notify parent of session save
			window.dispatchEvent(new CustomEvent('session-saved'));
			
			// Reset form after short delay
			setTimeout(() => {
				resetForm();
			}, 2000);
		} catch (e) {
			saveStatus = 'error';
			saveMessage = 'Failed to save session';
			console.error('Save error:', e);
		}
	}

	// Reset form to initial state
	function resetForm() {
		date = new Date().toISOString().split('T')[0];
		area = '';
		crag = '';
		sector = '';
		climbingType = '';
		trainingType = 'None';
		difficulty = 'None';
		category = 'None';
		energySystem = 'None';
		techniqueFocus = 'None';
		fingerLoad = 3;
		shoulderLoad = 3;
		forearmLoad = 3;
		climbs = [{ isSport: false, name: '', grade: '', attemptType: 'Flash', attemptsNum: 1, notes: '' }];
		saveStatus = 'idle';
		saveMessage = '';
	}
</script>

<div class="form-content">
	<h3>⛰️ Outdoor Climb</h3>
	
	<!-- Basic Info Section -->
	<div class="form-row">
		<div class="form-group">
			<label for="date">Date</label>
			<input type="date" id="date" bind:value={date} />
		</div>
		
		<div class="form-group">
			<label for="area">Area</label>
			<select id="area" bind:value={area}>
				<option value="" disabled>Select area...</option>
				{#each areas as a}
					<option value={a}>{a}</option>
				{/each}
			</select>
		</div>
	</div>

	<div class="form-row">
		<div class="form-group">
			<label for="crag">Crag</label>
            {#if isOtherCrag}
                <div class="input-with-action">
                    <input 
                        type="text" 
                        id="crag-manual" 
                        bind:value={crag} 
                        placeholder="Enter custom crag name..." 
                        class="flat-left"
                    />
                    <button 
                        type="button"
                        class="action-btn flat-right" 
                        onclick={cancelOtherCrag}
                        title="Back to list"
                    >✕</button>
                </div>
            {:else}
                <select id="crag" bind:value={crag} disabled={!area} onchange={onCragChange}>
                    <option value="" disabled>{area ? 'Select crag...' : 'Select area first...'}</option>
                    {#each availableCrags as c}
                        <option value={c}>{c}</option>
                    {/each}
                    {#if area}
                        <option value="Other">Other (Manual Entry)</option>
                    {/if}
                </select>
            {/if}
		</div>
		
		<div class="form-group">
			<label for="sector">Wall / Sector</label>
			<input type="text" id="sector" bind:value={sector} placeholder="Enter sector or wall name..." />
		</div>
	</div>

	<div class="form-group">
		<label for="climbing-type">Climbing Type</label>
		<select id="climbing-type" bind:value={climbingType}>
			<option value="" disabled>Select type...</option>
			{#each climbingTypes as type}
				<option value={type}>{type}</option>
			{/each}
		</select>
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
	</div>

	<!-- Training Details Section -->
	<div class="training-section">
		<h4>Training Details</h4>
		<div class="training-grid">
			<div class="training-item">
				<label for="training-type">Training Type</label>
				<select id="training-type" bind:value={trainingType}>
					{#each trainingTypes as type}
						<option value={type}>{type}</option>
					{/each}
				</select>
			</div>
			<div class="training-item">
				<label for="difficulty">Difficulty</label>
				<select id="difficulty" bind:value={difficulty}>
					{#each difficulties as diff}
						<option value={diff}>{diff}</option>
					{/each}
				</select>
			</div>
			<div class="training-item">
				<label for="category">Category</label>
				<select id="category" bind:value={category}>
					{#each categories as cat}
						<option value={cat}>{cat}</option>
					{/each}
				</select>
			</div>
			<div class="training-item">
				<label for="energy-system">Energy System</label>
				<select id="energy-system" bind:value={energySystem}>
					{#each energySystems as es}
						<option value={es}>{es}</option>
					{/each}
				</select>
			</div>
			<div class="training-item">
				<label for="technique-focus">Technique Focus</label>
				<select id="technique-focus" bind:value={techniqueFocus}>
					{#each techniqueFocuses as tf}
						<option value={tf}>{tf}</option>
					{/each}
				</select>
			</div>
		</div>
	</div>

	<!-- Climbs Table Section -->
	<div class="climbs-section">
		<h4>Climbs</h4>
		<div class="table-container">
			<table class="climbs-table">
				<thead>
					<tr>
						{#if showSportColumn}
							<th>Sport?</th>
						{/if}
						<th>Name</th>
						<th>Grade</th>
						<th>Attempt</th>
						<th>#</th>
						<th>Notes</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each climbs as climb, index}
						<tr>
							{#if showSportColumn}
								<td class="center">
									<input type="checkbox" bind:checked={climb.isSport} />
								</td>
							{/if}
							<td>
								<input type="text" bind:value={climb.name} placeholder="Route name..." />
							</td>
							<td>
								<input 
									type="text" 
									bind:value={climb.grade} 
									placeholder="V3" 
									class="grade-input" 
									class:invalid={!isValidGrade(climb.grade)}
								/>
								{#if !isValidGrade(climb.grade)}
									<span class="grade-error">Invalid</span>
								{/if}
							</td>
							<td>
								<select 
									value={climb.attemptType}
									onchange={(e) => handleAttemptTypeChange(index, (e.target as HTMLSelectElement).value)}
								>
									{#each attemptTypes as type}
										<option value={type}>{type}</option>
									{/each}
								</select>
							</td>
							<td>
								<input 
									type="number" 
									bind:value={climb.attemptsNum} 
									min="1" 
									disabled={climb.attemptType === 'Flash'}
								/>
							</td>
							<td class="notes-cell" class:expanded={expandedNoteIndex === index}>
								<textarea 
									bind:value={climb.notes} 
									placeholder="Notes..."
									onfocus={() => handleNoteFocus(index)}
									onblur={handleNoteBlur}
								></textarea>
							</td>
							<td class="center">
								{#if climbs.length > 1}
									<button type="button" class="remove-btn" onclick={() => removeClimb(index)}>✕</button>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<button type="button" class="add-btn" onclick={addClimb}>+ Add Climb</button>
	</div>

	<!-- Submit Button -->
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

	.form-content h3 {
		margin: 0 0 1.5rem 0;
		color: var(--teal-secondary);
		font-size: 1.25rem;
	}

	.form-content h4 {
		margin: 0 0 0.75rem 0;
		color: var(--text-primary);
		font-size: 1rem;
		font-weight: 600;
	}

	/* Form Layout */
	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	@media (max-width: 640px) {
		.form-row {
			grid-template-columns: 1fr;
		}
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		margin-bottom: 1rem;
	}

	.form-group label {
		font-weight: 500;
		color: var(--text-primary);
		font-size: 0.9rem;
	}

	.form-group input,
	.form-group select {
		width: 100%;
		padding: 0.6rem 0.8rem;
		border-radius: 8px;
		border: 2px solid rgba(74, 155, 155, 0.25);
		background: white;
		font-size: 0.95rem;
		color: var(--text-primary);
		transition: border-color 0.2s ease, box-shadow 0.2s ease;
		box-sizing: border-box;
	}

	.form-group input:focus,
	.form-group select:focus {
		outline: none;
		border-color: var(--teal-primary);
		box-shadow: 0 0 0 3px rgba(74, 155, 155, 0.12);
	}

	.form-group select:disabled {
		background: rgba(0, 0, 0, 0.05);
		cursor: not-allowed;
	}

	/* Load Metrics Section */
	.load-section {
		background: linear-gradient(135deg, rgba(244, 196, 48, 0.08) 0%, rgba(74, 155, 155, 0.08) 100%);
		border-radius: 12px;
		padding: 1.25rem;
		margin: 1.5rem 0;
		border: 1px solid rgba(74, 155, 155, 0.15);
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
		padding: 0.5rem;
		text-align: center;
		border-radius: 8px;
		border: 2px solid rgba(74, 155, 155, 0.3);
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--teal-secondary);
	}

	.load-item input:focus {
		outline: none;
		border-color: var(--gold-primary);
		box-shadow: 0 0 0 3px rgba(244, 196, 48, 0.2);
	}

	.load-scale {
		font-size: 0.8rem;
		color: var(--text-secondary);
	}

	/* Training Details Section */
	.training-section {
		background: linear-gradient(135deg, rgba(74, 155, 155, 0.08) 0%, rgba(100, 180, 180, 0.06) 100%);
		border-radius: 12px;
		padding: 1.25rem;
		margin: 1.5rem 0;
		border: 1px solid rgba(74, 155, 155, 0.15);
	}

	.training-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
	}

	@media (max-width: 768px) {
		.training-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 480px) {
		.training-grid {
			grid-template-columns: 1fr;
		}
	}

	.training-item {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.training-item label {
		font-weight: 500;
		color: var(--text-primary);
		font-size: 0.85rem;
	}

	.training-item select {
		width: 100%;
		padding: 0.5rem 0.6rem;
		border-radius: 8px;
		border: 1.5px solid rgba(74, 155, 155, 0.3);
		background: white;
		font-size: 0.9rem;
		color: var(--text-primary);
		transition: border-color 0.2s ease, box-shadow 0.2s ease;
		cursor: pointer;
	}

	.training-item select:focus {
		outline: none;
		border-color: var(--teal-primary);
		box-shadow: 0 0 0 3px rgba(74, 155, 155, 0.12);
	}

	/* Climbs Table Section */
	.climbs-section {
		margin-top: 1.5rem;
	}

	.table-container {
		overflow-x: auto;
		border-radius: 10px;
		border: 1px solid rgba(74, 155, 155, 0.2);
	}

	.climbs-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
	}

	.climbs-table th {
		background: rgba(74, 155, 155, 0.1);
		padding: 0.75rem 0.5rem;
		text-align: left;
		font-weight: 600;
		color: var(--teal-secondary);
		white-space: nowrap;
	}

	.climbs-table td {
		padding: 0.5rem;
		border-top: 1px solid rgba(74, 155, 155, 0.1);
	}

	.climbs-table td.center {
		text-align: center;
	}

	.climbs-table input[type="text"] {
		width: 100%;
		min-width: 100px;
		padding: 0.4rem 0.6rem;
		border-radius: 6px;
		border: 1px solid rgba(74, 155, 155, 0.25);
		font-size: 0.9rem;
	}

	.climbs-table input[type="number"] {
		width: 60px;
		padding: 0.4rem;
		text-align: center;
		border-radius: 6px;
		border: 1px solid rgba(74, 155, 155, 0.25);
		font-size: 0.9rem;
	}

	.climbs-table input[type="number"]:disabled {
		background: rgba(0, 0, 0, 0.05);
		color: var(--text-secondary);
	}

	.climbs-table select {
		padding: 0.4rem 0.5rem;
		border-radius: 6px;
		border: 1px solid rgba(74, 155, 155, 0.25);
		font-size: 0.9rem;
		min-width: 80px;
	}

	.climbs-table input[type="checkbox"] {
		width: 18px;
		height: 18px;
		cursor: pointer;
		accent-color: var(--teal-primary);
	}

	.climbs-table input:focus,
	.climbs-table select:focus,
	.climbs-table textarea:focus {
		outline: none;
		border-color: var(--teal-primary);
	}

	/* Invalid grade styling */
	.grade-input.invalid {
		border-color: #d9534f !important;
		background: rgba(217, 83, 79, 0.05);
	}

	.grade-error {
		display: block;
		font-size: 0.7rem;
		color: #d9534f;
		margin-top: 2px;
	}

	.grade-input {
		width: 60px !important;
		min-width: 60px !important;
		text-align: center;
	}

	/* Notes cell with expandable textarea */
	.notes-cell {
		min-width: 80px;
		transition: min-width 0.2s ease;
	}

	.notes-cell.expanded {
		min-width: 200px;
	}

	.climbs-table textarea {
		width: 100%;
		min-width: 60px;
		min-height: 32px;
		padding: 0.4rem 0.6rem;
		border-radius: 6px;
		border: 1px solid rgba(74, 155, 155, 0.25);
		font-size: 0.85rem;
		font-family: inherit;
		resize: vertical;
		transition: min-height 0.2s ease;
	}

	.notes-cell.expanded textarea {
		min-height: 60px;
	}

	.remove-btn {
		background: none;
		border: none;
		color: #d9534f;
		font-size: 1rem;
		cursor: pointer;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		transition: background 0.2s ease;
	}

	.remove-btn:hover {
		background: rgba(217, 83, 79, 0.1);
	}

	.add-btn {
		margin-top: 0.75rem;
		padding: 0.6rem 1.25rem;
		background: transparent;
		border: 2px dashed rgba(74, 155, 155, 0.4);
		color: var(--teal-primary);
		border-radius: 8px;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.2s ease, border-color 0.2s ease;
	}

	.add-btn:hover {
		background: rgba(74, 155, 155, 0.05);
		border-color: var(--teal-primary);
	}

	/* Submit Section */
	.submit-section {
		margin-top: 2rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
	}

	.save-message {
		padding: 0.5rem 1rem;
		border-radius: 8px;
		font-size: 0.9rem;
		text-align: center;
	}

	.save-message.success {
		background: rgba(92, 184, 92, 0.15);
		color: #5cb85c;
	}

	.save-message.error {
		background: rgba(217, 83, 79, 0.15);
		color: #d9534f;
	}

    /* Input with Action (Manual Entry) */
    .input-with-action {
        display: flex;
        align-items: center;
        width: 100%;
        position: relative;
    }

    .input-with-action input {
        flex: 1;
    }

    .input-with-action input.flat-left {
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
        border-right: none;
    }

    .action-btn {
        padding: 0.6rem 1rem;
        background: #f8f9fa;
        border: 1.5px solid rgba(74, 155, 155, 0.3);
        color: #666;
        cursor: pointer;
        font-size: 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
    }
    
    .action-btn:hover {
        background: #eee;
        color: #333;
        border-color: rgba(74, 155, 155, 0.5);
    }

    .action-btn.flat-right {
        border-top-right-radius: 8px;
        border-bottom-right-radius: 8px;
        border-left: 1.5px solid rgba(74, 155, 155, 0.3);
    }


	.submit-btn {
		padding: 0.75rem 2rem;
		background: var(--teal-primary);
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s ease, transform 0.1s ease;
	}

	.submit-btn:hover:not(:disabled) {
		background: var(--teal-secondary);
		transform: translateY(-1px);
	}

	.submit-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}
</style>
