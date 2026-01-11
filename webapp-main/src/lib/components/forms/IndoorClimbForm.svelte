<script lang="ts">
    /**
     * @file IndoorClimbForm.svelte
     * @component
     * @description Form for logging indoor climbing sessions.
     * Includes tracking for:
     * - Climbing type (Boulder, Sport, Mixed)
     * - Training details (Volume, Limit, etc.)
     * - Grading (French/V-scale)
     * - Detailed climb logging with attempts and styles
     */
	// Indoor Climb form for logging climbing sessions
	import { onMount, tick } from 'svelte';
	import { createIndoorSession, updateIndoorSession, isOnline } from '$lib/services/api';
	import MultiSelect from '$lib/components/common/MultiSelect.svelte';
	const locations = [
		'Rockstar Unit 3',
		'Rockstar Unit 5',
		'Rockstar Techno',
		'Flashpoint Bristol',
		'Redpoint Bristol',
		'TCH Bristol',
		'TCA Mothership',
		'TCA Church',
		'TCA Arc',
		'Bloc',
		'270 Climbing',
		'Other'
	];

	const climbingTypes = ['Bouldering', 'Sport', 'Mixed'];
	const attemptTypes = ['Onsight', 'Flash', 'Redpoint', 'Repeat', 'Dogged', 'DNF'];

	// Training classification options
	const trainingTypeOptions = ['None', 'Projecting', 'Onsighting', 'Campusing', 'Repeaters', 'Comp Sim'];
	const difficulties = ['None', 'Easy', 'Medium', 'Hard', 'Max', 'Limit+'];
	const categoryOptions = ['None', 'Strength', 'Power', 'Strength Capacity', 'Power Capacity', 'Strength Endurance', 'Power Endurance', 'Endurance', 'Coordination', 'Slab Technique', 'Overhang Technique'];
	const energySystemOptions = ['None', 'Aerobic Lactic Capacity', 'Aerobic Lactic Power', 'Anaerobic Alactic Capacity', 'Anaerobic Alactic Power', 'Anaerobic Power', 'Anaerobic Lactic Capacity'];
	const techniqueFocusOptions = [
		'None',
		'Trusting feet',
		'Double-clutch',
		'Standing on volumes',
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
		'Pogo',
		'Coordination Moves',
		'Gastoning',
		'Undercutting',
		'Compressing',
		'Heel Hook',
		'Toe Hook',
		'Bicycle'
	];
    // Split options per user request
	const climbWallOptions = ['None', 'Overhang', 'Vertical', 'Slab', 'Roof'];
    const sessionWallOptions = ['None', 'Moon Board', 'Kilter Board', 'Tension Board', 'Beast', 'Circuit Board', 'Boulder wall', 'Lead wall', 'Comp wall', 'Auto belays'];

	import GradeInput from '$lib/components/ui/GradeInput.svelte';
	import LoadInput from '$lib/components/ui/LoadInput.svelte';
	import SessionNotes from '$lib/components/ui/SessionNotes.svelte';
	import { VALID_GRADES_LOWER } from '$lib/constants';

	// Track which notes field is expanded
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

    interface Props {
        initialData?: any;
        onCancel?: () => void;
        onSaved?: () => void;
    }

    let { initialData, onCancel, onSaved }: Props = $props();
    let isEditing = $derived(!!initialData);

	// Form state
	let date = $state(new Date().toISOString().split('T')[0]);
	let time = $state(new Date().toTimeString().split(' ')[0].slice(0, 5));
	let location = $state('');
	// customLocation removed in favor of inline entry
	let climbingType = $state('');
	let trainingTypes = $state<string[]>(['None']);
	let difficulty = $state('None');
	let categories = $state<string[]>(['None']);
	let energySystems = $state<string[]>(['None']);
	let wallAngles = $state<string[]>(['None']);
	// wallAngles removed
	let fingerLoad = $state(3);
	let shoulderLoad = $state(3);
	let forearmLoad = $state(3);
	let openGrip = $state(3);
	let crimpGrip = $state(3);
	let pinchGrip = $state(3);
	let sloperGrip = $state(3);
	let jugGrip = $state(3);
	
	let climbs = $state<ClimbEntry[]>([
		{ isSport: false, name: '', grade: '', attemptType: 'Flash', attemptsNum: 1, notes: '', wall: 'Overhang' }
	]);
    
    let notes = $state('');
    let isOtherLocation = $state(false);
    
    const STORAGE_KEY = 'indoor_climb_draft';

    let loaded = $state(false);

    onMount(() => {
        if (initialData) {
            // Populate form with initial data
            date = initialData.date;
            time = initialData.time || '12:00';
            
            // Handle location
            if (locations.includes(initialData.location)) {
                location = initialData.location;
                isOtherLocation = false;
            } else if (initialData.customLocation) {
                 location = initialData.customLocation;
                 isOtherLocation = true;
            } else {
                 location = initialData.location; // Fallback
                 isOtherLocation = true; // Assume custom if not in list
            }
            
            climbingType = initialData.climbingType;
            trainingTypes = initialData.trainingTypes || ['None'];
            difficulty = initialData.difficulty || 'None';
            categories = initialData.categories || ['None'];
            energySystems = initialData.energySystems || ['None'];
            wallAngles = initialData.wallAngles || ['None'];
            
            fingerLoad = initialData.fingerLoad || 3;
            shoulderLoad = initialData.shoulderLoad || 3;
            forearmLoad = initialData.forearmLoad || 3;
            
            openGrip = initialData.openGrip || 3;
            crimpGrip = initialData.crimpGrip || 3;
            pinchGrip = initialData.pinchGrip || 3;
            sloperGrip = initialData.sloperGrip || 3;
            jugGrip = initialData.jugGrip || 3;
            
            if (initialData.climbs && initialData.climbs.length > 0) {
                climbs = JSON.parse(JSON.stringify(initialData.climbs)); // Deep copy
            } else {
                 climbs = [{ isSport: false, name: '', grade: '', attemptType: 'Flash', attemptsNum: 1, notes: '', wall: 'Overhang' }];
            }
            
            notes = initialData.notes || '';
        } else {
            // Only load draft if NOT editing
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                try {
                    const data = JSON.parse(saved);
                    if (data.location) location = data.location;
                    if (data.time) time = data.time;
                    if (data.isOtherLocation) isOtherLocation = data.isOtherLocation;
                    if (data.climbingType) climbingType = data.climbingType;
                    if (data.trainingTypes) trainingTypes = data.trainingTypes;
                    if (data.difficulty) difficulty = data.difficulty;
                    if (data.categories) categories = data.categories;
                    if (data.energySystems) energySystems = data.energySystems;
                    if (data.wallAngles) wallAngles = data.wallAngles;
                    
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
        }
        loaded = true;
    });

    $effect(() => {
        if (!loaded || isEditing) return; // Don't save drafts when editing
        const draft = {
            date, time, location, isOtherLocation, climbingType, trainingTypes, difficulty,
            categories, energySystems,
            fingerLoad, shoulderLoad, forearmLoad,
            openGrip, crimpGrip, pinchGrip, sloperGrip, jugGrip,
            climbs, notes
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    });

    function onLocationChange() {
        if (location === 'Other') {
            isOtherLocation = true;
            location = '';
        }
    }

    function cancelOtherLocation() {
        isOtherLocation = false;
        location = '';
    }

	function addClimb() {
		climbs = [...climbs, { isSport: false, name: '', grade: '', attemptType: 'Flash', attemptsNum: 1, notes: '', wall: 'Overhang' }];
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

	// Only show Sport? column when Mixed is selected
	let showSportColumn = $derived(climbingType === 'Mixed');

	// Get isSport value based on climbingType
	function getIsSport(climb: ClimbEntry): boolean {
		if (climbingType === 'Sport') return true;
		if (climbingType === 'Bouldering') return false;
		return climb.isSport; // Mixed - use per-climb value
	}

	// Validate grade input
	function isValidGrade(grade: string): boolean {
		if (!grade.trim()) return true; // Empty is allowed (not filled yet)
		return VALID_GRADES_LOWER.includes(grade.trim().toLowerCase());
	}

	// Save status
	let saveStatus = $state<'idle' | 'saving' | 'success' | 'error'>('idle');
	let saveMessage = $state('');

	// Validate form before saving
	function validateForm(): string | null {
		if (!location) return 'Please select a location';
		// Removed check for customLocation since it's now inline in location
		if (!climbingType) return 'Please select a climbing type';
		
		// Check for invalid grades
		const invalidGrades = climbs.filter(c => c.grade.trim() && !isValidGrade(c.grade));
		if (invalidGrades.length > 0) return 'Please fix invalid grades';
		
		return null;
	}

	// Save session to local cache and sync to server
    /**
     * Validates and saves the indoor climbing session to Firestore.
     */
    async function saveSession() {
		const error = validateForm();
		if (error) {
			saveStatus = 'error';
			saveMessage = error;
			return;
		}

		saveStatus = 'saving';
		
		try {
			// Prepare climbs with correct isSport based on climbingType
			const preparedClimbs = climbs.map(climb => ({
				...climb,
				isSport: getIsSport(climb)
			}));

			const sessionData = {
				date,
				time,
				location, // Location now holds the final value (custom or selected)
				customLocation: isOtherLocation ? location : undefined,
				climbingType,
				trainingTypes, // Array
				difficulty,
				categories, // Array
				energySystems, // Array
				wallAngles, // Array
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

            let result;
            if (isEditing) {
                result = await updateIndoorSession(initialData.id, sessionData);
            } else {
                result = await createIndoorSession(sessionData);
            }

			if (result.ok) {
				saveStatus = 'success';
				saveMessage = isEditing ? 'Session updated!' : 'Session saved!';
                
                if (!isEditing) {
				    localStorage.removeItem(STORAGE_KEY); // Clear draft
                }
                
                if (onSaved) {
                    setTimeout(() => {
                        onSaved();
                    }, 500); // Small delay to show success message
                }
                
			} else {
				saveStatus = 'error';
				saveMessage = 'Failed to save: ' + (result.error || 'Unknown error');
			}

            if (!isEditing) {
			    // Dispatch custom event to notify parent of session save (for log page refreshes)
			    window.dispatchEvent(new CustomEvent('session-saved'));
			    
			    // Reset form after short delay
			    setTimeout(() => {
				    resetForm();
			    }, 2000);
            }
		} catch (e) {
			saveStatus = 'error';
			saveMessage = 'Failed to save session';
			console.error('Save error:', e);
		}
	}

	// Reset form to initial state
	function resetForm() {
		date = new Date().toISOString().split('T')[0];
		time = new Date().toTimeString().split(' ')[0].slice(0, 5);
		location = '';
        isOtherLocation = false;
		climbingType = '';
		trainingTypes = ['None'];
		difficulty = 'None';
		categories = ['None'];
		energySystems = ['None'];
		wallAngles = ['None'];
		fingerLoad = 3;
		shoulderLoad = 3;
		forearmLoad = 3;
		openGrip = 3;
		crimpGrip = 3;
		pinchGrip = 3;
		sloperGrip = 3;
		jugGrip = 3;
		climbs = [{ isSport: false, name: '', grade: '', attemptType: 'Flash', attemptsNum: 1, notes: '', wall: 'Overhang' }];
        notes = '';
		saveStatus = 'idle';
		saveMessage = '';
	}
</script>

<div class="form-content">

	
	<!-- Basic Info Section -->
	<div class="form-row">
		<div class="form-group">
			<label for="date">Date</label>
			<div class="date-time-row">
				<input type="date" id="date" bind:value={date} />
				<input type="time" id="time" bind:value={time} />
			</div>
		</div>
		
		<div class="form-group">
			<label for="location">Location</label>
            {#if isOtherLocation}
                <div class="input-with-action">
                    <input 
                        type="text" 
                        id="location-manual" 
                        bind:value={location} 
                        placeholder="Enter custom location..." 
                        class="flat-left"
                    />
                    <button 
                        type="button"
                        class="action-btn flat-right" 
                        onclick={cancelOtherLocation}
                        title="Back to list"
                    >✕</button>
                </div>
            {:else}
                <select id="location" bind:value={location} onchange={onLocationChange}>
                    <option value="" disabled>Select location...</option>
                    {#each locations as loc}
                        <option value={loc}>{loc}</option>
                    {/each}
                </select>
            {/if}
		</div>
	</div>

	<!-- Custom Location input block removed -->

	<div class="form-group">
		<label for="climbing-type">Climbing Type</label>
		<select id="climbing-type" bind:value={climbingType}>
			<option value="" disabled>Select type...</option>
			{#each climbingTypes as type}
				<option value={type}>{type}</option>
			{/each}
		</select>
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
			<div class="training-item">
				<label for="wall-angle">Wall</label>
				<MultiSelect 
                    options={sessionWallOptions} 
                    selected={wallAngles} 
                    placeholder="Select walls..." 
                    onChange={(val) => wallAngles = val} 
                />
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
								<GradeInput bind:value={climb.grade} />
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

	<!-- Load Metrics Section -->
	<div class="load-section">
		<h4>Load Metrics</h4>
		<div class="load-metrics">
			<div class="metric-row">
				<LoadInput id="finger-load" label="Finger" bind:value={fingerLoad} />
			</div>
			<div class="metric-row">
				<LoadInput id="shoulder-load" label="Shoulder" bind:value={shoulderLoad} />
			</div>
			<div class="metric-row">
				<LoadInput id="forearm-load" label="Forearm" bind:value={forearmLoad} />
			</div>
		</div>
		
		<h4 class="mt-4">Grip Metrics</h4>
		<div class="load-metrics">
			<div class="metric-row">
				<LoadInput id="open-grip" label="Open" bind:value={openGrip} />
			</div>
			<div class="metric-row">
				<LoadInput id="crimp-grip" label="Crimp" bind:value={crimpGrip} />
			</div>
			<div class="metric-row">
				<LoadInput id="pinch-grip" label="Pinch" bind:value={pinchGrip} />
			</div>
			<div class="metric-row">
				<LoadInput id="sloper-grip" label="Sloper" bind:value={sloperGrip} />
			</div>
			<div class="metric-row">
				<LoadInput id="jug-grip" label="Jug" bind:value={jugGrip} />
			</div>
		</div>
	</div>

    <!-- Session Notes Section -->
    <div class="notes-section">
        <SessionNotes bind:value={notes} />
    </div>



	<!-- Submit Button -->
	<div class="submit-section">
		{#if saveMessage}
			<div class="save-message" class:success={saveStatus === 'success'} class:error={saveStatus === 'error'}>
				{saveMessage}
			</div>
		{/if}
        
        <div class="action-buttons">
            {#if isEditing}
                 <button 
                     type="button" 
                     class="cancel-btn-large" 
                     onclick={onCancel}
                     disabled={saveStatus === 'saving'}
                 >
                     Cancel
                 </button>
            {/if}
            
            <button 
                type="button" 
                class="submit-btn" 
                onclick={saveSession}
                disabled={saveStatus === 'saving'}
            >
                {#if saveStatus === 'saving'}
                    {isEditing ? 'Updating...' : 'Saving...'}
                {:else if saveStatus === 'success'}
                    ✓ {isEditing ? 'Updated!' : 'Saved!'}
                {:else}
                    {isEditing ? 'Update Session' : 'Save Session'}
                {/if}
            </button>
        </div>
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



	.form-content h4 {
		margin: 0 0 1rem 0;
		color: var(--teal-secondary);
		font-size: 1.1rem;
		font-weight: 700;
		text-align: center;
		text-transform: uppercase;
		letter-spacing: 0.05em;
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

	.load-metrics {
		display: flex;
		flex-direction: column;
		gap: 0; /* Removing gap as rows have padding */
	}

	.metric-row {
		padding: 0.4rem 0.8rem; /* Reduced padding */
		border-radius: 6px;
	}

	.metric-row:nth-child(odd) {
		background-color: rgba(74, 155, 155, 0.08); /* Light teal tint */
	}

	.metric-row:nth-child(even) {
		background-color: rgba(255, 255, 255, 0.6); /* Slightly transparent white */
	}

	.date-time-row {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 0.5rem;
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


	/* Form Layout */
	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin-bottom: 1rem;
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
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1rem;
	}

	.training-item {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	
	.training-item label {
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--text-secondary);
	}



	/* Climbs Table */
	.climbs-section {
		margin-top: 2rem;
	}

	.table-container {
		overflow-x: auto;
		border-radius: 8px;
		border: 1px solid rgba(0, 0, 0, 0.08);
		margin-bottom: 1rem;
	}
	
	.climbs-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
		min-width: 800px; /* Ensure scroll on small screens */
	}

	.climbs-table th {
		text-align: left;
		padding: 0.75rem 0.5rem;
		background: rgba(74, 155, 155, 0.05);
		color: var(--text-secondary);
		font-weight: 600;
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.climbs-table td {
		padding: 0.5rem;
		border-bottom: 1px solid rgba(0, 0, 0, 0.05);
		vertical-align: top;
	}

	.climbs-table tr:last-child td {
		border-bottom: none;
	}

	.climbs-table input[type="text"],
	.climbs-table input[type="number"],
	.climbs-table select,
	.climbs-table textarea {
		width: 100%;
		padding: 0.4rem;
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 4px;
		font-size: 0.9rem;
		background: white;
	}

	.climbs-table input:focus,
	.climbs-table select:focus,
	.climbs-table textarea:focus {
		outline: none;
		border-color: var(--teal-secondary);
		box-shadow: 0 0 0 2px rgba(74, 155, 155, 0.1);
	}


	.center {
		text-align: center;
	}

	.notes-cell {
		width: 250px;
	}
	
	.notes-cell textarea {
		height: 34px;
		transition: height 0.2s;
		resize: none;
	}
	
	.notes-cell.expanded textarea {
		height: 100px;
	}
	
	.add-btn {
		width: 100%;
		padding: 0.8rem;
		background: white; /* ghostly */
		border: 2px dashed rgba(74, 155, 155, 0.3);
		color: var(--teal-secondary);
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}
	
	.add-btn:hover {
		background: rgba(74, 155, 155, 0.05);
		border-color: var(--teal-secondary);
	}

	.remove-btn {
		background: none;
		border: none;
		color: #ccc;
		font-size: 1.2rem;
		cursor: pointer;
		padding: 0.2rem 0.5rem;
		line-height: 1;
	}
	
	.remove-btn:hover {
		color: #e57373;
	}

	.submit-section {
		margin-top: 2rem;
		padding-top: 1.5rem;
		border-top: 1px solid rgba(0, 0, 0, 0.08);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

    .action-buttons {
        display: flex;
        gap: 1rem;
        width: 100%;
        justify-content: center;
    }

	.submit-btn {
		background: var(--teal-secondary);
		color: white;
		border: none;
		padding: 1rem 3rem;
		border-radius: 30px;
		font-size: 1.1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		box-shadow: 0 4px 10px rgba(74, 155, 155, 0.25);
        flex: 1;
        max-width: 300px;
	}

	.submit-btn:hover:not(:disabled) {
		background: var(--teal-primary);
		transform: translateY(-2px);
		box-shadow: 0 6px 15px rgba(74, 155, 155, 0.3);
	}
	
	.submit-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}
    
    .cancel-btn-large {
        background: white;
        color: #777;
        border: 2px solid #ddd;
        padding: 1rem 3rem;
        border-radius: 30px;
        font-size: 1.1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        flex: 1;
        max-width: 300px;
    }
    
    .cancel-btn-large:hover {
        background: #f5f5f5;
        border-color: #ccc;
        color: #555;
    }

	.save-message {
		padding: 0.8rem 1.5rem;
		border-radius: 8px;
		font-weight: 500;
		animation: slideIn 0.3s;
	}

	.save-message.success {
		background: #d4edda;
		color: #155724;
	}

	.save-message.error {
		background: #f8d7da;
		color: #721c24;
	}

	/* Manual Location Input */
	.input-with-action {
		display: flex;
	}

	.flat-left {
		border-top-right-radius: 0 !important;
		border-bottom-right-radius: 0 !important;
		border-right: none !important;
	}

	.flat-right {
		border-top-left-radius: 0 !important;
		border-bottom-left-radius: 0 !important;
		background: var(--teal-secondary) !important;
		color: white !important;
		padding: 0.5rem 1rem !important;
		border: none;
		cursor: pointer;
	}
</style>
