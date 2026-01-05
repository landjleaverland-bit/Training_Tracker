<script lang="ts">
	// Outdoor Climb form for logging outdoor climbing sessions
	import { onMount } from 'svelte';
	import { createOutdoorSession, isOnline } from '$lib/services/api';
	import { getAreas, getCrags } from '$lib/data/outdoor_locations';
	import MultiSelect from '$lib/components/common/MultiSelect.svelte';
	
	const areas = getAreas();
	const climbingTypes = ['Boulder', 'Sport', 'Trad'];
	const attemptTypes = ['Onsight', 'Flash', 'Redpoint', 'Repeat', 'Dogged', 'DNF'];

	// Training classification options
    // Copied from IndoorClimbForm for consistency, though 'Roof' might be rare outdoors it's still possible.
	const climbWallOptions = ['None', 'Overhang', 'Vertical', 'Slab', 'Roof'];
	const trainingTypeOptions = ['None', 'Projecting', 'Onsighting', 'Campusing', 'Repeaters', 'Comp Sim'];
	const difficulties = ['None', 'Easy', 'Medium', 'Hard', 'Max', 'Limit+'];
	const categoryOptions = ['None', 'Strength', 'Power', 'Strength Capacity', 'Power Capacity', 'Strength Endurance', 'Power Endurance', 'Endurance', 'Coordination', 'Slab Technique', 'Overhang Technique'];
	const energySystemOptions = ['None', 'Aerobic Lactic Capacity', 'Aerobic Lactic Power', 'Anaerobic Alactic Capacity', 'Anaerobic Alactic Power', 'Anaerobic Power', 'Anaerobic Lactic Capacity'];
	const techniqueFocusOptions = [
		'None',
		'Trusting feet',
		'Double-clutch',
		'Deadpointing',
		'Flagging',
		'Swapping feet',
		'Edging',
		'Smearing',
		'Matching',
		'Backstepping',
		'Drop Knee',
		'Bridging',
		'Laybacking',
		'Mantling',
		'Kneebar',
		'Dyno',
		'Coordination Moves',
		'Gastoning',
		'Undercutting',
		'Compressing',
		'Heel Hook',
		'Toe Hook',
		'Bicycle'
	];

	// Valid grades (case-insensitive matching)
	const validGrades = [
		'V0-', '4-', 'V0', '4', 'V0+', '4+', 'V1', '5', 'V2', '5+', 'V3', '6A', '6A+', 'V4', '6B', '6B+', 'V5', '6C', '6C+',
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
        wall?: string;
        techniqueFocus?: string;
	}

	// Form state
	let date = $state(new Date().toISOString().split('T')[0]);
	let area = $state('');
	let crag = $state('');
	let sector = $state('');
	let climbingType = $state('');
	let trainingTypes = $state<string[]>(['None']);
	let difficulty = $state('None');
	let categories = $state<string[]>(['None']);
	let energySystems = $state<string[]>(['None']);
	let fingerLoad = $state(3);
	let shoulderLoad = $state(3);
	let forearmLoad = $state(3);
	let openGrip = $state(3);
	let crimpGrip = $state(3);
	let pinchGrip = $state(3);
	let sloperGrip = $state(3);
	let jugGrip = $state(3);
	
	let climbs = $state<ClimbEntry[]>([
		{ isSport: false, name: '', grade: '', attemptType: 'Flash', attemptsNum: 1, notes: '' }
	]);
    
    let notes = $state('');

	// Reactive crag list based on selected area
	let availableCrags = $derived(area ? getCrags(area) : []);
    
    let isOtherCrag = $state(false);

    const STORAGE_KEY = 'outdoor_climb_draft';

    let loaded = $state(false);

    onMount(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                if (data.area) area = data.area;
                if (data.crag) crag = data.crag;
                if (data.sector) sector = data.sector;
                if (data.isOtherCrag) isOtherCrag = data.isOtherCrag;
                if (data.climbingType) climbingType = data.climbingType;
                if (data.trainingTypes) trainingTypes = data.trainingTypes;
                if (data.difficulty) difficulty = data.difficulty;
                if (data.categories) categories = data.categories;
                if (data.energySystems) energySystems = data.energySystems;
                
                if (data.fingerLoad) fingerLoad = data.fingerLoad;
                if (data.shoulderLoad) shoulderLoad = data.shoulderLoad;
                if (data.forearmLoad) forearmLoad = data.forearmLoad;
                
                if (data.openGrip) openGrip = data.openGrip;
                if (data.crimpGrip) crimpGrip = data.crimpGrip;
                if (data.pinchGrip) pinchGrip = data.pinchGrip;
                if (data.sloperGrip) sloperGrip = data.sloperGrip;
                if (data.jugGrip) jugGrip = data.jugGrip;
                
                if (data.climbs) climbs = data.climbs;
                if (data.notes) notes = data.notes;
            } catch (e) {
                console.error('Failed to restore draft', e);
            }
        }
        loaded = true;
    });

    $effect(() => {
        if (!loaded) return;
        const draft = {
            date, area, crag, sector, isOtherCrag, climbingType, trainingTypes, difficulty,
            categories, energySystems,
            fingerLoad, shoulderLoad, forearmLoad,
            openGrip, crimpGrip, pinchGrip, sloperGrip, jugGrip,
            climbs, notes
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    });

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
		if (value === 'Flash' || value === 'Onsight') {
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
				trainingTypes,
				difficulty,
				categories,
				energySystems,
				fingerLoad,
				shoulderLoad,
				forearmLoad,
				openGrip,
				crimpGrip,
				pinchGrip,
				sloperGrip,
				jugGrip,
				climbs: preparedClimbs,
                notes
			};

			// Save to server
			const result = await createOutdoorSession(sessionData);

			if (result.ok) {
				saveStatus = 'success';
				saveMessage = 'Session saved!';
				localStorage.removeItem(STORAGE_KEY);
			} else {
				saveStatus = 'error';
				saveMessage = 'Failed to save: ' + (result.error || 'Unknown error');
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
		trainingTypes = ['None'];
		difficulty = 'None';
		categories = ['None'];
		energySystems = ['None'];
		fingerLoad = 3;
		shoulderLoad = 3;
		forearmLoad = 3;
		openGrip = 3;
		crimpGrip = 3;
		pinchGrip = 3;
		sloperGrip = 3;
		jugGrip = 3;
		climbs = [{ isSport: false, name: '', grade: '', attemptType: 'Flash', attemptsNum: 1, notes: '' }];
        notes = '';
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

	<!-- Training Details Section -->
	<div class="training-section">
		<h4>Training Details</h4>
		<div class="training-grid">
			<div class="training-item">
				<label for="training-type">Training Type</label>
				<MultiSelect 
                    options={trainingTypeOptions} 
                    selected={trainingTypes} 
                    placeholder="Select types..." 
                    onChange={(val) => trainingTypes = val} 
                />
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
				<MultiSelect 
                    options={categoryOptions} 
                    selected={categories} 
                    placeholder="Select categories..." 
                    onChange={(val) => categories = val} 
                />
			</div>
			<div class="training-item">
				<label for="energy-system">Energy System</label>
				<MultiSelect 
                    options={energySystemOptions} 
                    selected={energySystems} 
                    placeholder="Select systems..." 
                    onChange={(val) => energySystems = val} 
                />
			</div>
            <!-- Technique Focus Removed -->
		</div>
	</div>

    <!-- Session Notes Section -->
    <div class="form-group notes-section">
        <label for="session-notes">Session Notes</label>
        <textarea 
            id="session-notes" 
            bind:value={notes} 
            placeholder="How did the session feel? Weather, conditions, mood..."
            rows="3"
        ></textarea>
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
						<th>Wall Angle</th>
						<th>Technique Focus</th>
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
									disabled={climb.attemptType === 'Flash' || climb.attemptType === 'Onsight'}
								/>
							</td>
                            <td>
								<select bind:value={climb.wall}>
									{#each climbWallOptions.filter(w => w !== 'None') as option}
										<option value={option}>{option}</option>
									{/each}
								</select>
							</td>
							<td>
								<select bind:value={climb.techniqueFocus}>
									{#each techniqueFocusOptions as option}
										<option value={option}>{option}</option>
									{/each}
								</select>
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

	.mt-4 {
		margin-top: 1.5rem !important;
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

	@media (max-width: 640px) {
		.load-section {
			padding: 0.8rem;
			margin: 1rem 0;
		}
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

	@media (max-width: 640px) {
		.training-section {
			padding: 0.8rem;
			margin: 1rem 0;
		}
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

	@media (max-width: 640px) {
		.notes-cell.expanded {
			position: absolute;
			left: 1rem;
			right: 1rem;
			z-index: 10;
			background: white;
			box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
			border-radius: 8px;
			padding: 0.5rem;
			min-width: unset;
		}

		.notes-cell.expanded textarea {
			min-height: 100px;
		}
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
