<script lang="ts">
	// View Data page - for viewing training history
	import { fade, scale, slide } from 'svelte/transition';
	import IndoorClimbView from '$lib/components/views/IndoorClimbView.svelte';
	import OutdoorClimbView from '$lib/components/views/OutdoorClimbView.svelte';
	import GymSessionView from '$lib/components/views/GymSessionView.svelte';
	import FingerboardingView from '$lib/components/views/FingerboardingView.svelte';
	import CompetitionView from '$lib/components/views/CompetitionView.svelte';
	import CalendarView from '$lib/components/common/CalendarView.svelte';
	import { getIndoorSessions, getOutdoorSessions, getGymSessions, getFingerboardSessions, getCompetitionSessions } from '$lib/services/api';
	import type { Session } from '$lib/types/session';

	const activityTypes = [
		{ value: 'indoor_climb', label: 'Indoor Climb', icon: '🧗' },
		{ value: 'outdoor_climb', label: 'Outdoor Climb', icon: '⛰️' },
		{ value: 'gym_session', label: 'Gym Session', icon: '🏋️' },
		{ value: 'fingerboarding', label: 'Fingerboarding', icon: '🤏' },
		{ value: 'competition', label: 'Competition', icon: '🏆' },
		{ value: 'combined', label: 'Combined', icon: '📅' }
	];

	let selectedActivity = $state('');
	let showCalendar = $state(false);
	let activeSessions = $state<any[]>([]);
	let activeDate = $state('');

	// Reset state when activity changes
	$effect(() => {
		if (selectedActivity) {
			activeSessions = [];
			activeDate = '';
			
			if (selectedActivity === 'combined') {
				fetchAllSessions();
			}
		}
	});

	async function fetchAllSessions() {
		try {
			const [indoor, outdoor, gym, finger, comp] = await Promise.all([
				getIndoorSessions(),
				getOutdoorSessions(),
				getGymSessions(),
				getFingerboardSessions(),
				getCompetitionSessions()
			]);

			let allSessions: any[] = [];
			if (indoor.ok && indoor.data) allSessions = [...allSessions, ...indoor.data.map(s => ({ ...s, activityType: 'indoor_climb' }))];
			if (outdoor.ok && outdoor.data) allSessions = [...allSessions, ...outdoor.data.map(s => ({ ...s, activityType: 'outdoor_climb' }))];
			if (gym.ok && gym.data) allSessions = [...allSessions, ...gym.data.map(s => ({ ...s, activityType: 'gym_session' }))];
			if (finger.ok && finger.data) allSessions = [...allSessions, ...finger.data.map(s => ({ ...s, activityType: 'fingerboarding' }))];
			if (comp.ok && comp.data) allSessions = [...allSessions, ...comp.data.map(s => ({ ...s, activityType: 'competition' }))];

			allSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
			activeSessions = allSessions;
		} catch (e) {
			console.error("Failed to fetch combined sessions", e);
		}
	}

    // Settings/Delete Modal removed as local cache is deprecated.
    // Bulk delete functionality can be added later if needed via API.
</script>

<div class="page">
	<div class="page-header">
		<div>
			<h1>📊 View Data</h1>
			<p class="subtitle">Browse your training history</p>
		</div>
    </div>

	
	<div class="content-card">
		<div class="form-group-row">
			<div class="form-group flex-1">
				<label for="activity-type">Activity Type</label>
				<select id="activity-type" bind:value={selectedActivity}>
					<option value="" disabled>Select an activity...</option>
					{#each activityTypes as activity (activity.value)}
						<option value={activity.value}>{activity.icon} {activity.label}</option>
					{/each}
				</select>
			</div>
			
			{#if selectedActivity}
				<button 
					class="calendar-toggle {showCalendar ? 'active' : ''}" 
					onclick={() => showCalendar = !showCalendar}
					title="Toggle Calendar View"
				>
					📅
				</button>
			{/if}
		</div>

		{#if showCalendar && selectedActivity}
			<div transition:slide={{ duration: 200 }}>
				<CalendarView 
					bind:selectedDate={activeDate} 
					sessions={activeSessions} 
					activityType={selectedActivity} 
				/>
			</div>
		{/if}

		{#if selectedActivity}
			<div class="view-container">
				{#if selectedActivity === 'indoor_climb'}
					<IndoorClimbView bind:sessions={activeSessions} bind:selectedDate={activeDate} />
				{:else if selectedActivity === 'outdoor_climb'}
					<OutdoorClimbView bind:sessions={activeSessions} bind:selectedDate={activeDate} />
				{:else if selectedActivity === 'gym_session'}
					<GymSessionView bind:sessions={activeSessions} bind:selectedDate={activeDate} />
				{:else if selectedActivity === 'fingerboarding'}
					<FingerboardingView bind:sessions={activeSessions} bind:selectedDate={activeDate} />
				{:else if selectedActivity === 'competition'}
					<CompetitionView bind:sessions={activeSessions} bind:selectedDate={activeDate} />
				{:else if selectedActivity === 'combined'}
					<div style="padding: 3rem; text-align: center; color: var(--text-secondary); background: rgba(255, 255, 255, 0.5); border-radius: 12px; border: 2px dashed rgba(74, 155, 155, 0.15);">
						<p style="margin: 0 0 0.5rem 0; font-size: 1.1rem;">Combined view is currently a placeholder for future updates.</p>
						<small style="opacity: 0.7;">You can still use the calendar above to view all your sessions!</small>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.page {
		animation: fadeIn 0.3s ease;
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(8px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.page-header {
		margin-bottom: 1.5rem;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}











	.page-header h1 {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--teal-secondary);
		margin: 0 0 0.5rem 0;
	}

	.subtitle {
		color: var(--text-secondary);
		font-size: 1rem;
		margin: 0;
	}

	.content-card {
		background: rgba(255, 255, 255, 0.9);
		border-radius: 16px;
		padding: 2rem;
		box-shadow: 0 4px 20px rgba(74, 155, 155, 0.1);
		border: 1px solid rgba(74, 155, 155, 0.15);
	}

	.form-group-row {
		display: flex;
		align-items: flex-end;
		gap: 1rem;
	}

	.flex-1 {
		flex: 1;
	}

	.calendar-toggle {
		background: white;
		border: 2px solid rgba(74, 155, 155, 0.3);
		border-radius: 10px;
		height: 48px;
		width: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.calendar-toggle:hover {
		border-color: var(--teal-primary);
		background: rgba(74, 155, 155, 0.05);
	}

	.calendar-toggle.active {
		background: var(--teal-secondary);
		border-color: var(--teal-secondary);
		box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-group label {
		font-weight: 600;
		color: var(--text-primary);
		font-size: 0.95rem;
	}

	.form-group select {
		padding: 0.75rem 1rem;
		border-radius: 10px;
		border: 2px solid rgba(74, 155, 155, 0.3);
		background: white;
		font-size: 1rem;
		color: var(--text-primary);
		cursor: pointer;
		transition: border-color 0.2s ease, box-shadow 0.2s ease;
		height: 48px;
	}

	.form-group select:focus {
		outline: none;
		border-color: var(--teal-primary);
		box-shadow: 0 0 0 3px rgba(74, 155, 155, 0.15);
	}

	.form-group select:hover {
		border-color: var(--teal-primary);
	}

	.view-container {
		margin-top: 1.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid rgba(74, 155, 155, 0.15);
	}
</style>
