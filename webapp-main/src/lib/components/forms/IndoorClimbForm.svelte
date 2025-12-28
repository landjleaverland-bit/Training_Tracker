<script lang="ts">
	// Indoor Climb form for logging climbing sessions
	
	const locations = [
		'Rockstar Swindon',
		'Flashpoint Swindon',
		'Flashpoint Bristol',
		'Redpoint Bristol',
		'TCH Bristol',
		'Other'
	];

	const climbingTypes = ['Bouldering', 'Sport', 'Mixed'];
	const sessionTypes = ['Projecting', 'Onsighting', 'Campusing'];
	const attemptTypes = ['Flash', 'Redpoint', 'Dogged'];

	// Valid grades (case-insensitive matching)
	const validGrades = [
		'V0-', '4-',
		'V0', '4',
		'V0+', '4+',
		'V1', '5',
		'V2', '5+',
		'V3', '6A',
		'V4', '6B',
		'V5', '6C',
		'V6', '7A',
		'V7', '7A+',
		'V8', '7B', '7B+',
		'V9', '7C',
		'V10', '7C+',
		'V11', '8A',
		'V12', '8A+',
		'V13', '8B',
		'V14', '8B+',
		'V15', '8C',
		'V16', '8C+',
		'V17', '9A'
	];

	// Normalize grades for case-insensitive comparison
	const validGradesLower = validGrades.map(g => g.toLowerCase());

	// Track which notes field is expanded
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
	let location = $state('');
	let customLocation = $state('');
	let climbingType = $state('');
	let sessionType = $state('');
	let fingerLoad = $state(3);
	let shoulderLoad = $state(3);
	let forearmLoad = $state(3);
	
	let climbs = $state<ClimbEntry[]>([
		{ isSport: false, name: '', grade: '', attemptType: 'Flash', attemptsNum: 1, notes: '' }
	]);

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

	// Only show Sport? column when Mixed is selected
	let showSportColumn = $derived(climbingType === 'Mixed');

	// Get isSport value based on climbing type
	function getIsSport(climb: ClimbEntry): boolean {
		if (climbingType === 'Sport') return true;
		if (climbingType === 'Bouldering') return false;
		return climb.isSport; // Mixed - use per-climb value
	}

	// Validate grade input
	function isValidGrade(grade: string): boolean {
		if (!grade.trim()) return true; // Empty is allowed (not filled yet)
		return validGradesLower.includes(grade.trim().toLowerCase());
	}
</script>

<div class="form-content">
	<h3>🧗 Indoor Climb</h3>
	
	<!-- Basic Info Section -->
	<div class="form-row">
		<div class="form-group">
			<label for="date">Date</label>
			<input type="date" id="date" bind:value={date} />
		</div>
		
		<div class="form-group">
			<label for="location">Location</label>
			<select id="location" bind:value={location}>
				<option value="" disabled>Select location...</option>
				{#each locations as loc}
					<option value={loc}>{loc}</option>
				{/each}
			</select>
		</div>
	</div>

	{#if location === 'Other'}
		<div class="form-group">
			<label for="custom-location">Custom Location</label>
			<input type="text" id="custom-location" bind:value={customLocation} placeholder="Enter location name..." />
		</div>
	{/if}

	<div class="form-row">
		<div class="form-group">
			<label for="climbing-type">Climbing Type</label>
			<select id="climbing-type" bind:value={climbingType}>
				<option value="" disabled>Select type...</option>
				{#each climbingTypes as type}
					<option value={type}>{type}</option>
				{/each}
			</select>
		</div>

		<div class="form-group">
			<label for="session-type">Session Type</label>
			<select id="session-type" bind:value={sessionType}>
				<option value="" disabled>Select session...</option>
				{#each sessionTypes as type}
					<option value={type}>{type}</option>
				{/each}
			</select>
		</div>
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
		<button type="submit" class="submit-btn">Save Session</button>
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
		padding: 0.6rem 0.8rem;
		border-radius: 8px;
		border: 2px solid rgba(74, 155, 155, 0.25);
		background: white;
		font-size: 0.95rem;
		color: var(--text-primary);
		transition: border-color 0.2s ease, box-shadow 0.2s ease;
	}

	.form-group input:focus,
	.form-group select:focus {
		outline: none;
		border-color: var(--teal-primary);
		box-shadow: 0 0 0 3px rgba(74, 155, 155, 0.12);
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
	}

	@media (max-width: 480px) {
		.load-metrics {
			flex-direction: column;
			gap: 1rem;
		}
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
		transition: all 0.2s ease;
	}

	.add-btn:hover {
		border-color: var(--teal-primary);
		background: rgba(74, 155, 155, 0.05);
	}

	/* Submit Section */
	.submit-section {
		margin-top: 2rem;
		padding-top: 1.5rem;
		border-top: 1px solid rgba(74, 155, 155, 0.15);
	}

	.submit-btn {
		width: 100%;
		padding: 0.9rem 1.5rem;
		background: linear-gradient(135deg, var(--gold-primary) 0%, var(--teal-primary) 100%);
		color: white;
		border: none;
		border-radius: 10px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}

	.submit-btn:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 15px rgba(244, 196, 48, 0.3);
	}

	.submit-btn:active {
		transform: translateY(0);
	}
</style>
