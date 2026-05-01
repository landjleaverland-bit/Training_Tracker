<script lang="ts">
	/**
	 * @file CompetitionForm.svelte
	 * @component
	 * @description Form for logging competition climbing sessions.
	 * Supports multiple rounds (Qualifiers, Semi-Finals, Finals, etc.),
	 * each with a climb table and position tracking.
	 */
	import { onMount, createEventDispatcher } from 'svelte';
	import { createCompetitionSession, updateCompetitionSession, isOnline } from '$lib/services/api';
	import type {
		CompetitionSession,
		CompetitionRound,
		CompetitionClimbResult
	} from '$lib/types/session';
	import LoadInput from '$lib/components/ui/LoadInput.svelte';
	import SessionNotes from '$lib/components/ui/SessionNotes.svelte';
	import DeleteConfirmModal from '$lib/components/common/DeleteConfirmModal.svelte';
	import { slide } from 'svelte/transition';

	const dispatch = createEventDispatcher();

	// Props
	interface Props {
		initialData?: CompetitionSession | null;
		onCancel?: () => void;
		onSaved?: () => void;
	}

	let { initialData = null, onCancel, onSaved }: Props = $props();
	let isEditing = $derived(!!initialData);

	const venues = [
		'Flashpoint Bristol',
		'Rockstar Techno',
		'Rockstar Unit 3',
		'Rockstar Unit 5',
		'Bloc',
		'TCA',
		'Other'
	];
	const competitionTypes = ['Bouldering', 'Lead', 'Speed'];
	const roundOptions = ['Qualifiers', 'Semi-Finals', 'Finals', 'Other'];
	const resultStatuses = ['Flash', 'Top', 'Zone', 'Attempt'];

	let date = $state(new Date().toISOString().split('T')[0]);
	let time = $state(new Date().toTimeString().split(' ')[0].slice(0, 5));
	let venue = $state('');
	let customVenue = $state('');
	let type = $state('Bouldering');

	// Load Metrics
	let fingerLoad = $state(4);
	let shoulderLoad = $state(4);
	let forearmLoad = $state(4);

	// --- Multi-Round State ---
	interface RoundState {
		id: string;
		name: string;
		customName: string;
		position: number | null;
		climbs: CompetitionClimbResult[];
		expanded: boolean;
	}

	function createDefaultRound(name: string = 'Qualifiers'): RoundState {
		return {
			id: crypto.randomUUID(),
			name,
			customName: '',
			position: null,
			climbs: [{ name: '#1', status: 'Flash', attemptCount: 1, notes: '' }],
			expanded: true
		};
	}

	let rounds = $state<RoundState[]>([createDefaultRound()]);

	let notes = $state('');
	let isTBC = $state(false);

	const STORAGE_KEY = 'competition_session_draft';
	let loaded = $state(false);

	onMount(() => {
		if (initialData) {
			date = initialData.date;
			time = initialData.time || '12:00';
			type = initialData.type || 'Bouldering';
			notes = initialData.notes || '';

			if (venues.includes(initialData.venue)) {
				venue = initialData.venue;
			} else {
				venue = 'Other';
				customVenue = initialData.venue;
			}

			fingerLoad = initialData.fingerLoad ?? 4;
			shoulderLoad = initialData.shoulderLoad ?? 4;
			forearmLoad = initialData.forearmLoad ?? 4;

			// Convert existing rounds to RoundState
			if (initialData.rounds && initialData.rounds.length > 0) {
				rounds = initialData.rounds.map((r) => {
					const isStandardName = roundOptions.includes(r.name);
					return {
						id: crypto.randomUUID(),
						name: isStandardName ? r.name : 'Other',
						customName: isStandardName ? '' : r.name,
						position: r.position ?? null,
						climbs:
							r.climbs && r.climbs.length > 0
								? r.climbs
								: [{ name: '#1', status: 'Flash', attemptCount: 1, notes: '' }],
						expanded: true
					};
				});
			}

			isTBC = initialData.isTBC !== undefined ? initialData.isTBC : false;
			loaded = true;
		} else {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved) {
				try {
					const data = JSON.parse(saved);

					// Check if draft is older than 24 hours
					const isStale = data.draftSavedAt ? (Date.now() - data.draftSavedAt > 24 * 60 * 60 * 1000) : false;

					if (data.date && !isStale) date = data.date;
					if (data.venue) venue = data.venue;
					if (data.time && !isStale) time = data.time;
					if (data.customVenue) customVenue = data.customVenue;
					if (data.type) type = data.type;
					if (data.fingerLoad) fingerLoad = data.fingerLoad;
					if (data.shoulderLoad) shoulderLoad = data.shoulderLoad;
					if (data.forearmLoad) forearmLoad = data.forearmLoad;
					if (data.rounds) rounds = data.rounds;
					if (data.notes) notes = data.notes;
					if (data.isTBC !== undefined) isTBC = data.isTBC;
				} catch (e) {
					console.error('Failed to restore draft', e);
				}
			}
			loaded = true;
		}
	});

	$effect(() => {
		if (!loaded || isEditing) return;
		const draft = {
			date,
			time,
			venue,
			customVenue,
			type,
			fingerLoad,
			shoulderLoad,
			forearmLoad,
			rounds,
			notes,
			isTBC,
			draftSavedAt: Date.now()
		};
		localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
	});

	let showCustomVenue = $derived(venue === 'Other');

	// --- Round Management ---
	let showDeleteRoundModal = $state(false);
	let roundToDeleteIndex = $state<number | null>(null);

	function addRound() {
		// Collapse existing rounds, add expanded new one
		rounds = rounds.map((r) => ({ ...r, expanded: false }));
		const defaultName = rounds.length === 1 ? 'Finals' : 'Other';
		rounds = [...rounds, createDefaultRound(defaultName)];
	}

	function confirmRemoveRound(index: number) {
		roundToDeleteIndex = index;
		showDeleteRoundModal = true;
	}

	function executeRemoveRound() {
		if (roundToDeleteIndex !== null && rounds.length > 1) {
			rounds = rounds.filter((_, i) => i !== roundToDeleteIndex);
		}
		showDeleteRoundModal = false;
		roundToDeleteIndex = null;
	}

	function toggleRound(index: number) {
		rounds[index].expanded = !rounds[index].expanded;
	}

	function getActualRoundName(round: RoundState): string {
		return round.name === 'Other' ? round.customName : round.name;
	}

	// --- Climb Management (per round) ---
	function addClimbToRound(roundIndex: number) {
		const nextNum = rounds[roundIndex].climbs.length + 1;
		rounds[roundIndex].climbs = [
			...rounds[roundIndex].climbs,
			{ name: `#${nextNum}`, status: 'Flash', attemptCount: 1, notes: '' }
		];
	}

	function removeClimbFromRound(roundIndex: number, climbIndex: number) {
		const round = rounds[roundIndex];
		if (round.climbs.length > 1) {
			rounds[roundIndex].climbs = round.climbs.filter((_, i) => i !== climbIndex);
		} else {
			rounds[roundIndex].climbs[0] = { name: '#1', status: 'Flash', attemptCount: 1, notes: '' };
		}
	}

	function handleStatusChange(roundIndex: number, climbIndex: number, status: string) {
		rounds[roundIndex].climbs[climbIndex].status = status as any;
		if (status === 'Flash') {
			rounds[roundIndex].climbs[climbIndex].attemptCount = 1;
		}
	}

	let saveStatus = $state<'idle' | 'saving' | 'success' | 'error'>('idle');
	let saveMessage = $state('');

	async function saveSession() {
		if (!venue || (venue === 'Other' && !customVenue)) {
			saveStatus = 'error';
			saveMessage = 'Please specify a venue';
			return;
		}

		saveStatus = 'saving';

		try {
			const roundsData: CompetitionRound[] = rounds.map((r) => ({
				name: getActualRoundName(r),
				position: r.position,
				climbs: JSON.parse(JSON.stringify(r.climbs))
			}));

			const sessionData = {
				date,
				time,
				venue: venue === 'Other' ? customVenue : venue,
				customVenue: venue === 'Other' ? customVenue : undefined,
				type: type as any,
				fingerLoad,
				shoulderLoad,
				forearmLoad,
				rounds: roundsData,
				notes,
				isTBC
			};

			let result;
			if (isEditing && initialData) {
				result = await updateCompetitionSession(initialData.id, sessionData);
			} else {
				result = await createCompetitionSession(sessionData);
			}

			if (result.ok) {
				saveStatus = 'success';
				saveMessage = 'Competition saved!';
				if (!isEditing) {
					localStorage.removeItem(STORAGE_KEY);
					isTBC = false;
				}

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
		venue = '';
		customVenue = '';
		rounds = [createDefaultRound()];
		notes = '';
		saveStatus = 'idle';
		saveMessage = '';
	}
</script>

<div class="form-content">
	<div
		style="flex: 1; display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;"
	>
		{#if !isEditing}
			<h3 style="margin: 0; color: var(--teal-secondary);">🏆 Competition</h3>
		{/if}
	</div>

	<!-- General Info -->
	<div class="form-group mb-4">
		<label for="date">Date</label>
		<div class="date-time-row">
			<input type="date" id="date" bind:value={date} />
			<input type="time" id="time" bind:value={time} />
		</div>
	</div>
	<div class="form-group mb-4">
		<label for="venue">Venue</label>
		<select id="venue" bind:value={venue}>
			<option value="" disabled>Select venue...</option>
			{#each venues as v}
				<option value={v}>{v}</option>
			{/each}
		</select>
		{#if showCustomVenue}
			<input type="text" bind:value={customVenue} placeholder="Enter venue name" class="mt-2" />
		{/if}
	</div>

	<div class="form-group mb-4">
		<label for="type">Type</label>
		<select id="type" bind:value={type}>
			{#each competitionTypes as t}
				<option value={t}>{t}</option>
			{/each}
		</select>
	</div>

	<!-- Session Notes Section -->
	<div class="form-group mb-4">
		<SessionNotes bind:value={notes} placeholder="How did the comp go? Strategy, mindset, etc." />
	</div>

	<!-- Load Metrics -->
	<div class="section-header centered">
		<h4>Load Metrics</h4>
	</div>
	<div class="load-metrics-column">
		<div class="metric-row">
			<LoadInput id="finger" label="Finger Load" bind:value={fingerLoad} max={5} />
		</div>
		<div class="metric-row">
			<LoadInput id="shoulder" label="Shoulder Load" bind:value={shoulderLoad} max={5} />
		</div>
		<div class="metric-row">
			<LoadInput id="forearm" label="Forearm Load" bind:value={forearmLoad} max={5} />
		</div>
	</div>

	<!-- Rounds Section -->
	<div class="rounds-section">
		<div class="section-header">
			<h4>Rounds</h4>
		</div>

		{#each rounds as round, ri}
			<div class="round-card" transition:slide={{ duration: 150 }}>
				<div
					class="round-card-header"
					role="button"
					tabindex="0"
					onclick={() => toggleRound(ri)}
					onkeydown={(e) => e.key === 'Enter' && toggleRound(ri)}
				>
					<div class="round-summary">
						<span class="round-name">{getActualRoundName(round) || 'New Round'}</span>
						{#if round.position}
							<span class="position-pill">#{round.position}</span>
						{/if}
						{#if !round.expanded}
							<span class="climb-count"
								>{round.climbs.length} climb{round.climbs.length !== 1 ? 's' : ''}</span
							>
						{/if}
					</div>
					<div class="round-actions">
						{#if rounds.length > 1}
							<button
								type="button"
								class="remove-round-btn"
								onclick={(e) => {
									e.stopPropagation();
									confirmRemoveRound(ri);
								}}
								title="Remove round">✕</button
							>
						{/if}
						<span class="chevron">{round.expanded ? '▲' : '▼'}</span>
					</div>
				</div>

				{#if round.expanded}
					<div class="round-body" transition:slide={{ duration: 150 }}>
						<div class="round-meta">
							<div class="form-group">
								<label for="round-name-{ri}">Round</label>
								<select id="round-name-{ri}" bind:value={round.name}>
									{#each roundOptions as r}
										<option value={r}>{r}</option>
									{/each}
								</select>
								{#if round.name === 'Other'}
									<input
										type="text"
										bind:value={round.customName}
										placeholder="Round name"
										class="mt-2"
									/>
								{/if}
							</div>
							<div class="form-group">
								<label for="position-{ri}">Position</label>
								<input
									type="number"
									id="position-{ri}"
									bind:value={round.position}
									placeholder="#"
									class="position-input"
								/>
							</div>
						</div>

						<!-- Climb Table -->
						<div class="climbs-table-container">
							<table class="climbs-table">
								<thead>
									<tr>
										<th>#</th>
										<th>Result</th>
										<th>Att.</th>
										<th>Notes</th>
										<th></th>
									</tr>
								</thead>
								<tbody>
									{#each round.climbs as climb, ci}
										<tr>
											<td class="col-name">
												<input type="text" bind:value={climb.name} />
											</td>
											<td class="col-status">
												<select
													value={climb.status}
													onchange={(e) =>
														handleStatusChange(ri, ci, (e.target as HTMLSelectElement).value)}
												>
													{#each resultStatuses as s}
														<option value={s}>{s}</option>
													{/each}
												</select>
											</td>
											<td class="col-attempt">
												{#if climb.status !== 'Flash'}
													<input type="number" bind:value={climb.attemptCount} min="1" />
												{:else}
													<span class="flash-dash">-</span>
												{/if}
											</td>
											<td class="col-notes">
												<input type="text" bind:value={climb.notes} placeholder="..." />
											</td>
											<td class="col-action">
												<button type="button" onclick={() => removeClimbFromRound(ri, ci)}>✕</button
												>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
							<button type="button" class="add-row-btn" onclick={() => addClimbToRound(ri)}
								>+ Add Climb</button
							>
						</div>
					</div>
				{/if}
			</div>
		{/each}

		<button type="button" class="add-round-btn" onclick={addRound}>+ Add Round</button>
	</div>

	<div class="tbc-checkbox-wrapper">
		<input type="checkbox" id="tbc-checkbox" bind:checked={isTBC} />
		<label
			for="tbc-checkbox"
			class="tbc-label"
			title="Mark this session as To Be Completed (e.g., if you plan to add more rounds or notes later)"
		>
			<span class="custom-checkbox"></span>
			TBC (To Be Completed)
		</label>
	</div>

	<div class="submit-section">
		{#if saveMessage}
			<div
				class="save-message"
				class:success={saveStatus === 'success'}
				class:error={saveStatus === 'error'}
			>
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

<DeleteConfirmModal
	isOpen={showDeleteRoundModal}
	title="Delete Round"
	message="Are you sure you want to delete this round? All climbs logged in this round will be lost."
	confirmKeyword="round"
	onConfirm={executeRemoveRound}
	onCancel={() => {
		showDeleteRoundModal = false;
		roundToDeleteIndex = null;
	}}
/>

<style>
	.form-content {
		animation: slideIn 0.2s ease;
	}
	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	h3 {
		margin: 0 0 1.5rem 0;
		color: var(--teal-secondary);
		font-size: 1.25rem;
	}
	h4 {
		margin: 0;
		font-size: 1rem;
		color: var(--text-primary);
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.form-group label {
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--text-secondary);
	}

	input,
	select {
		padding: 0.6rem;
		border: 1px solid rgba(74, 155, 155, 0.3);
		border-radius: 8px;
		font-size: 0.95rem;
		width: 100%;
		box-sizing: border-box;
	}

	.date-time-row {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 0.5rem;
	}

	.mt-2 {
		margin-top: 0.5rem;
	}
	.mb-4 {
		margin-bottom: 1rem;
	}

	/* Load Metrics */
	.load-metrics-column {
		display: flex;
		flex-direction: column;
		gap: 0;
		margin-bottom: 1.5rem;
	}

	.metric-row {
		padding: 0.4rem 0.8rem;
		border-radius: 6px;
	}

	.metric-row:nth-child(odd) {
		background-color: rgba(74, 155, 155, 0.08);
	}

	.metric-row:nth-child(even) {
		background-color: rgba(255, 255, 255, 0.6);
	}

	.section-header.centered {
		justify-content: center;
		margin-bottom: 0.5rem;
	}

	.section-header.centered h4 {
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 700;
		color: var(--teal-secondary);
		font-size: 1.1rem;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	/* Rounds */
	.rounds-section {
		margin-bottom: 1.5rem;
	}

	.round-card {
		background: #f8f9fa;
		border-radius: 12px;
		border: 1px solid #e9ecef;
		margin-bottom: 0.75rem;
		overflow: hidden;
	}

	.round-card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.8rem 1rem;
		cursor: pointer;
		user-select: none;
	}

	.round-card-header:hover {
		background: rgba(74, 155, 155, 0.05);
	}

	.round-summary {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.round-name {
		font-weight: 600;
		color: var(--teal-secondary);
		font-size: 1rem;
	}

	.position-pill {
		background-color: #ffd700;
		color: #856404;
		font-weight: 700;
		padding: 0.1rem 0.5rem;
		border-radius: 12px;
		font-size: 0.8rem;
	}

	.climb-count {
		font-size: 0.8rem;
		color: var(--text-secondary);
	}

	.round-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.remove-round-btn {
		background: none;
		border: none;
		color: #d9534f;
		cursor: pointer;
		padding: 0.3rem 0.5rem;
		font-size: 0.9rem;
		border-radius: 4px;
	}

	.remove-round-btn:hover {
		background: rgba(217, 83, 79, 0.1);
	}

	.chevron {
		color: #aaa;
		font-size: 0.8rem;
	}

	.round-body {
		padding: 0 1rem 1rem 1rem;
		border-top: 1px solid #e9ecef;
	}

	.round-meta {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 1rem;
		padding: 0.75rem 0;
	}

	.position-input {
		width: 70px !important;
		text-align: center;
		font-weight: 600;
		font-size: 1.1rem !important;
	}

	.add-round-btn {
		width: 100%;
		padding: 0.75rem;
		background: white;
		border: 2px dashed rgba(74, 155, 155, 0.3);
		color: var(--teal-primary);
		font-weight: 600;
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.add-round-btn:hover {
		background: rgba(45, 212, 191, 0.05);
		border-color: var(--teal-primary);
	}

	/* Climbs Table */
	.climbs-table-container {
		margin-top: 0.5rem;
	}

	.climbs-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
	}
	.climbs-table th {
		text-align: left;
		color: var(--text-secondary);
		font-weight: 500;
		padding: 0.5rem;
		border-bottom: 1px solid #ddd;
	}
	.climbs-table td {
		padding: 0.25rem;
	}

	.col-name input {
		width: 50px;
		text-align: center;
	}
	.col-attempt input {
		width: 50px;
		text-align: center;
	}
	.col-status select {
		min-width: 90px;
	}
	.col-action button {
		background: none;
		border: none;
		color: #d9534f;
		cursor: pointer;
		padding: 0.5rem;
	}

	.col-notes {
		position: relative;
		min-width: 40px;
	}
	.col-notes input:focus {
		position: absolute;
		right: 0;
		width: 220px;
		max-width: 70vw;
		z-index: 10;
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
		top: 50%;
		transform: translateY(-50%);
	}

	.add-row-btn {
		width: 100%;
		margin-top: 0.5rem;
		padding: 0.5rem;
		background: white;
		border: 1px dashed #aaa;
		color: var(--text-secondary);
		border-radius: 6px;
		cursor: pointer;
	}

	.flash-dash {
		text-align: center;
		display: block;
		color: var(--text-secondary);
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
		margin-top: 1rem;
		box-shadow: 0 4px 12px rgba(74, 155, 155, 0.3);
	}

	.submit-btn:disabled {
		opacity: 0.7;
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

	/* Sleek TBC Checkbox Styles */
	.tbc-checkbox-wrapper {
		display: flex;
		justify-content: center;
		margin: 0.5rem 0 1.5rem 0;
		width: 100%;
	}

	.tbc-checkbox-wrapper input[type='checkbox'] {
		display: none;
	}

	.tbc-label {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		cursor: pointer;
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--text-secondary);
		padding: 0.6rem 1.2rem;
		border-radius: 30px;
		background: rgba(0, 0, 0, 0.03);
		border: 1px solid rgba(0, 0, 0, 0.08);
		transition: all 0.2s ease;
		user-select: none;
	}

	.tbc-label:hover {
		background: rgba(239, 108, 0, 0.05);
		border-color: rgba(239, 108, 0, 0.2);
		color: #ef6c00;
	}

	.custom-checkbox {
		width: 20px;
		height: 20px;
		border-radius: 6px;
		border: 2px solid rgba(0, 0, 0, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
		background: white;
	}

	.custom-checkbox::after {
		content: '';
		width: 5px;
		height: 10px;
		border: solid white;
		border-width: 0 2px 2px 0;
		transform: rotate(45deg);
		opacity: 0;
		transition: opacity 0.2s ease;
		margin-top: -2px;
	}

	.tbc-checkbox-wrapper input[type='checkbox']:checked + .tbc-label {
		background: rgba(239, 108, 0, 0.1);
		border-color: rgba(239, 108, 0, 0.4);
		color: #ef6c00;
	}

	.tbc-checkbox-wrapper input[type='checkbox']:checked + .tbc-label .custom-checkbox {
		background: #ef6c00;
		border-color: #ef6c00;
	}

	.tbc-checkbox-wrapper input[type='checkbox']:checked + .tbc-label .custom-checkbox::after {
		opacity: 1;
	}
</style>
