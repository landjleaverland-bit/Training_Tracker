<script lang="ts">
	// Log Data page - for entering training data
	import IndoorClimbForm from '$lib/components/forms/IndoorClimbForm.svelte';
	import OutdoorClimbForm from '$lib/components/forms/OutdoorClimbForm.svelte';
	import GymSessionForm from '$lib/components/forms/GymSessionForm.svelte';
	import FingerboardingForm from '$lib/components/forms/FingerboardingForm.svelte';
	import CompetitionForm from '$lib/components/forms/CompetitionForm.svelte';
    import { isOnline } from '$lib/services/api';
    import { onMount } from 'svelte';
	
	const activityTypes = [
		{ value: 'indoor_climb', label: 'Indoor Climb', icon: '🧗' },
		{ value: 'outdoor_climb', label: 'Outdoor Climb', icon: '⛰️' },
		{ value: 'gym_session', label: 'Gym Session', icon: '🏋️' },
		{ value: 'fingerboarding', label: 'Fingerboarding', icon: '🤏' },
		{ value: 'competition', label: 'Competition', icon: '🏆' }
	];

	let selectedActivity = $state('');
    let online = $state(true);
    
    onMount(() => {
        online = isOnline();
        const handleOnline = () => online = true;
        const handleOffline = () => online = false;
        
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    });
</script>

<div class="page">
	<div class="page-header">
		<h1>📝 Log Data</h1>
		<p class="subtitle">Record your training sessions</p>
	</div>
    
    {#if !online}
        <div class="offline-banner">
            ⚠️ You are currently offline. Changes may not save if specific offline mode is not configured.
        </div>
    {/if}
	
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
			<div class="form-container">
				{#if selectedActivity === 'indoor_climb'}
					<IndoorClimbForm />
				{:else if selectedActivity === 'outdoor_climb'}
					<OutdoorClimbForm />
				{:else if selectedActivity === 'gym_session'}
					<GymSessionForm />
				{:else if selectedActivity === 'fingerboarding'}
					<FingerboardingForm />
				{:else if selectedActivity === 'competition'}
					<CompetitionForm />
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

    .offline-banner {
        background: #fff3cd;
        color: #856404;
        padding: 0.75rem;
        border-radius: 8px;
        margin-bottom: 1rem;
        border: 1px solid #ffeeba;
        text-align: center;
        font-weight: 500;
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

	.form-container {
		margin-top: 1.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid rgba(74, 155, 155, 0.15);
	}

	@media (max-width: 640px) {
		.page {
			padding-bottom: 6rem;
		}
	}
</style>
