<script lang="ts">
	// Log Data page - for entering training data
	import IndoorClimbForm from '$lib/components/forms/IndoorClimbForm.svelte';
	import OutdoorClimbForm from '$lib/components/forms/OutdoorClimbForm.svelte';
	import GymSessionForm from '$lib/components/forms/GymSessionForm.svelte';
	import FingerboardingForm from '$lib/components/forms/FingerboardingForm.svelte';
	import CompetitionForm from '$lib/components/forms/CompetitionForm.svelte';
	import { syncAllPending, getPendingCount } from '$lib/services/sync';
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
	
	// Sync state
	let pendingCount = $state(0);
	let syncStatus = $state<'idle' | 'syncing' | 'success' | 'error'>('idle');
	let syncMessage = $state('');
	let online = $state(true);

	// Check for pending sessions on mount and when online status changes
	onMount(() => {
		updatePendingCount();
		online = isOnline();
		
		// Listen for online/offline events
		const handleOnline = () => {
			online = true;
			updatePendingCount();
		};
		const handleOffline = () => {
			online = false;
		};
		
		// Listen for session-saved events from forms
		const handleSessionSaved = () => {
			updatePendingCount();
		};
		
		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);
		window.addEventListener('session-saved', handleSessionSaved);
		
		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
			window.removeEventListener('session-saved', handleSessionSaved);
		};
	});

	function updatePendingCount() {
		pendingCount = getPendingCount();
	}

	async function handleSync() {
		if (!online) {
			syncStatus = 'error';
			syncMessage = 'No network connection';
			return;
		}

		syncStatus = 'syncing';
		syncMessage = '';

		try {
			const result = await syncAllPending();
			
			if (result.failed === 0 && result.success > 0) {
				syncStatus = 'success';
				syncMessage = `Synced ${result.success} session${result.success > 1 ? 's' : ''}!`;
			} else if (result.failed > 0 && result.success > 0) {
				syncStatus = 'error';
				syncMessage = `Synced ${result.success}, failed ${result.failed}`;
			} else if (result.failed > 0) {
				syncStatus = 'error';
				syncMessage = `Failed to sync ${result.failed} session${result.failed > 1 ? 's' : ''}`;
			} else {
				syncStatus = 'idle';
				syncMessage = '';
			}

			updatePendingCount();
			
			// Reset status after delay
			if (syncStatus === 'success') {
				setTimeout(() => {
					syncStatus = 'idle';
					syncMessage = '';
				}, 3000);
			}
		} catch (e) {
			syncStatus = 'error';
			syncMessage = 'Sync failed';
			console.error('Sync error:', e);
		}
	}
</script>

<div class="page">
	<div class="page-header">
		<h1>📝 Log Data</h1>
		<p class="subtitle">Record your training sessions</p>
	</div>

	{#if pendingCount > 0}
		<div class="sync-banner" class:offline={!online}>
			<div class="sync-info">
				<span class="sync-icon">{online ? '🔄' : '📴'}</span>
				<span class="sync-text">
					{#if online}
						{pendingCount} session{pendingCount > 1 ? 's' : ''} waiting to sync
					{:else}
						Offline - {pendingCount} session{pendingCount > 1 ? 's' : ''} saved locally
					{/if}
				</span>
			</div>
			{#if online}
				<button 
					class="sync-btn"
					class:syncing={syncStatus === 'syncing'}
					onclick={handleSync}
					disabled={syncStatus === 'syncing'}
				>
					{#if syncStatus === 'syncing'}
						<span class="spinner"></span> Syncing...
					{:else if syncStatus === 'success'}
						✓ Synced!
					{:else}
						Sync Now
					{/if}
				</button>
			{/if}
			{#if syncMessage}
				<div class="sync-message" class:error={syncStatus === 'error'} class:success={syncStatus === 'success'}>
					{syncMessage}
				</div>
			{/if}
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

	/* Sync Banner Styles */
	.sync-banner {
		background: linear-gradient(135deg, rgba(244, 196, 48, 0.15) 0%, rgba(255, 193, 7, 0.1) 100%);
		border: 1px solid rgba(244, 196, 48, 0.4);
		border-radius: 12px;
		padding: 1rem 1.25rem;
		margin-bottom: 1.5rem;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1rem;
	}

	.sync-banner.offline {
		background: linear-gradient(135deg, rgba(158, 158, 158, 0.15) 0%, rgba(120, 120, 120, 0.1) 100%);
		border-color: rgba(158, 158, 158, 0.4);
	}

	.sync-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
		min-width: 200px;
	}

	.sync-icon {
		font-size: 1.25rem;
	}

	.sync-text {
		font-weight: 500;
		color: var(--text-primary);
		font-size: 0.95rem;
	}

	.sync-btn {
		padding: 0.6rem 1.25rem;
		background: linear-gradient(135deg, var(--gold-primary) 0%, var(--gold-secondary) 100%);
		border: none;
		border-radius: 8px;
		font-weight: 600;
		font-size: 0.9rem;
		color: #1a1a1a;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.sync-btn:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(244, 196, 48, 0.3);
	}

	.sync-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.sync-btn.syncing {
		background: linear-gradient(135deg, rgba(244, 196, 48, 0.6) 0%, rgba(218, 165, 32, 0.6) 100%);
	}

	.spinner {
		width: 14px;
		height: 14px;
		border: 2px solid rgba(0, 0, 0, 0.2);
		border-top-color: #1a1a1a;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.sync-message {
		width: 100%;
		text-align: center;
		font-size: 0.85rem;
		font-weight: 500;
		padding: 0.5rem;
		border-radius: 6px;
		animation: fadeIn 0.2s ease;
	}

	.sync-message.success {
		color: #2e7d32;
		background: rgba(46, 125, 50, 0.1);
	}

	.sync-message.error {
		color: #c62828;
		background: rgba(198, 40, 40, 0.1);
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
