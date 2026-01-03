<script lang="ts">
	// View Data page - for viewing training history
	import { fade, scale } from 'svelte/transition';
	import IndoorClimbView from '$lib/components/views/IndoorClimbView.svelte';
	import OutdoorClimbView from '$lib/components/views/OutdoorClimbView.svelte';
	import GymSessionView from '$lib/components/views/GymSessionView.svelte';
	import FingerboardingView from '$lib/components/views/FingerboardingView.svelte';
	import CompetitionView from '$lib/components/views/CompetitionView.svelte';
	import DeleteDataModal from '$lib/components/common/DeleteDataModal.svelte';
	import { getAllSessions, deleteSessions } from '$lib/services/cache';
	import type { Session } from '$lib/types/session';

	const activityTypes = [
		{ value: 'indoor_climb', label: 'Indoor Climb', icon: '🧗' },
		{ value: 'outdoor_climb', label: 'Outdoor Climb', icon: '⛰️' },
		{ value: 'gym_session', label: 'Gym Session', icon: '🏋️' },
		{ value: 'fingerboarding', label: 'Fingerboarding', icon: '🤏' },
		{ value: 'competition', label: 'Competition', icon: '🏆' }
	];

	let selectedActivity = $state('');
	let isSettingsOpen = $state(false);
	let isDeleteDataModalOpen = $state(false);
	let allSessions = $state<Session[]>([]);

	function openSettings() {
		isSettingsOpen = true;
	}

	function closeSettings() {
		isSettingsOpen = false;
	}

	function handleClearCacheClick() {
		allSessions = getAllSessions();
		isSettingsOpen = false;
		isDeleteDataModalOpen = true;
	}

	function handleDeleteData(criteria: { activityType: string, timeRange: string }) {
		const { activityType, timeRange } = criteria;
		const now = new Date();
		
		const idsToDelete: string[] = [];

		allSessions.forEach(session => {
			if (activityType !== 'all' && session.activityType !== activityType) return;

			if (timeRange !== 'all_time') {
				const sessionDate = new Date(session.date);
				const diffTime = now.getTime() - sessionDate.getTime();
				const diffDays = diffTime / (1000 * 3600 * 24);

				switch (timeRange) {
					case '24_hours': if (diffDays > 1) return; break;
					case '7_days': if (diffDays > 7) return; break;
					case '30_days': if (diffDays > 30) return; break;
					case '1_year': if (diffDays > 365) return; break;
				}
			}

			idsToDelete.push(session.id);
		});

		isDeleteDataModalOpen = false;
		if (idsToDelete.length > 0) {
			deleteSessions(idsToDelete);
			window.location.reload();
		}
	}
</script>

<div class="page">
	<div class="page-header">
		<div>
			<h1>📊 View Data</h1>
			<p class="subtitle">Browse your training history</p>
		</div>
		<button class="settings-btn" onclick={openSettings} aria-label="Settings">
			⚙️
		</button>
	</div>
	
	{#if isSettingsOpen}
		<!-- Backdrop -->
		<button class="backdrop" onclick={closeSettings} transition:fade={{ duration: 200 }} aria-label="Close settings"></button>

		<!-- Settings Modal -->
		<div class="settings-modal" role="dialog" aria-modal="true" transition:scale={{ duration: 200, start: 0.9 }}>
			<div class="settings-header">
				<h3>Settings</h3>
				<button class="close-btn" onclick={closeSettings}>✕</button>
			</div>
			
			<div class="settings-content">
				<div class="setting-item">
					<div class="setting-info">
						<span class="setting-label">Local Data</span>
						<span class="setting-desc">Remove specific sessions from this device</span>
					</div>
					<button class="btn-clear-cache" onclick={handleClearCacheClick}>
						Delete Data
					</button>
				</div>
			</div>
		</div>
	{/if}

	<DeleteDataModal
		isOpen={isDeleteDataModalOpen}
		sessions={allSessions}
		onClose={() => isDeleteDataModalOpen = false}
		onDelete={handleDeleteData}
	/>
	
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
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}

	.settings-btn {
		background: rgba(255, 255, 255, 0.5);
		border: 1px solid rgba(74, 155, 155, 0.2);
		border-radius: 50%;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.25rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.settings-btn:hover {
		background: white;
		transform: rotate(45deg);
		box-shadow: 0 2px 10px rgba(74, 155, 155, 0.1);
	}

	.backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: rgba(0, 0, 0, 0.5);
		z-index: 1000;
		border: none;
		cursor: pointer;
	}

	.settings-modal {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: white;
		padding: 1.5rem;
		border-radius: 16px;
		box-shadow: 0 4px 25px rgba(0, 0, 0, 0.2);
		z-index: 1001;
		width: 90%;
		max-width: 400px;
	}

	.settings-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid #eee;
	}

	.settings-header h3 {
		margin: 0;
		color: var(--text-primary);
		font-size: 1.25rem;
	}

	.close-btn {
		background: transparent;
		border: none;
		font-size: 1.2rem;
		color: var(--text-secondary);
		cursor: pointer;
		padding: 0.25rem;
		line-height: 1;
		border-radius: 4px;
	}

	.close-btn:hover {
		background: #f5f5f5;
		color: var(--text-primary);
	}

	.setting-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	.setting-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.setting-label {
		font-weight: 600;
		color: var(--text-primary);
		font-size: 0.95rem;
	}

	.setting-desc {
		font-size: 0.8rem;
		color: var(--text-secondary);
	}

	.btn-clear-cache {
		padding: 0.5rem 1rem;
		border-radius: 8px;
		border: 1px solid #ff4d4d;
		background: rgba(255, 77, 77, 0.1);
		color: #ff4d4d;
		font-weight: 600;
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
	}

	.btn-clear-cache:hover {
		background: #ff4d4d;
		color: white;
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
