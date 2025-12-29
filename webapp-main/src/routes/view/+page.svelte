<script lang="ts">
	// View Data page - for viewing training history
	import IndoorClimbView from '$lib/components/views/IndoorClimbView.svelte';
	import OutdoorClimbView from '$lib/components/views/OutdoorClimbView.svelte';
	import GymSessionView from '$lib/components/views/GymSessionView.svelte';
	import FingerboardingView from '$lib/components/views/FingerboardingView.svelte';
	import CompetitionView from '$lib/components/views/CompetitionView.svelte';

	const activityTypes = [
		{ value: 'indoor_climb', label: 'Indoor Climb', icon: '🧗' },
		{ value: 'outdoor_climb', label: 'Outdoor Climb', icon: '⛰️' },
		{ value: 'gym_session', label: 'Gym Session', icon: '🏋️' },
		{ value: 'fingerboarding', label: 'Fingerboarding', icon: '🤏' },
		{ value: 'competition', label: 'Competition', icon: '🏆' }
	];

	let selectedActivity = $state('');
</script>

<div class="page">
	<div class="page-header">
		<h1>📊 View Data</h1>
		<p class="subtitle">Browse your training history</p>
	</div>
	
	<div class="content-card">
		<div class="form-group">
			<label for="activity-type">Activity Type</label>
			<select id="activity-type" bind:value={selectedActivity}>
				<option value="" disabled>Select an activity...</option>
				{#each activityTypes as activity (activity.value)}
					<option value={activity.value}>{activity.icon} {activity.label}</option>
				{/each}
			</select>
		</div>

		{#if selectedActivity}
			<div class="view-container">
				{#if selectedActivity === 'indoor_climb'}
					<IndoorClimbView />
				{:else if selectedActivity === 'outdoor_climb'}
					<OutdoorClimbView />
				{:else if selectedActivity === 'gym_session'}
					<GymSessionView />
				{:else if selectedActivity === 'fingerboarding'}
					<FingerboardingView />
				{:else if selectedActivity === 'competition'}
					<CompetitionView />
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
