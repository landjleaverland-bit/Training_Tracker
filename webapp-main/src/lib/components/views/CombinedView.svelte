<script lang="ts">
	// Combined View - displays all session types in date order
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import IndoorClimbCard from './indoor/IndoorClimbCard.svelte';
	import OutdoorClimbCard from './outdoor/OutdoorClimbCard.svelte';
	import GymSessionCard from './gym/GymSessionCard.svelte';
	import FingerboardSessionCard from './fingerboarding/FingerboardSessionCard.svelte';
	import CompetitionCard from './competition/CompetitionCard.svelte';
	import {
		getIndoorSessions,
		getOutdoorSessions,
		getGymSessions,
		getFingerboardSessions,
		getCompetitionSessions
	} from '$lib/services/api';

	interface Props {
		sessions?: any[];
		selectedDate?: string;
	}

	let { sessions = $bindable([]), selectedDate = $bindable('') }: Props = $props();
	let filteredSessions = $state<any[]>([]);

	let isLoading = $state(false);
	let fetchError = $state('');

	// Date filter state
	let filterStartDate = $state('');
	let filterEndDate = $state('');

	$effect(() => {
		if (selectedDate !== undefined) {
			filterStartDate = selectedDate;
			filterEndDate = selectedDate;
			applyFilters();
		}
	});

	// Pagination state
	let visibleCount = $state(20);
	const ITEMS_PER_PAGE = 20;

	onMount(() => {
		handleFetchData();
	});

	async function handleFetchData() {
		isLoading = true;
		fetchError = '';

		try {
			const [indoor, outdoor, gym, finger, comp] = await Promise.all([
				getIndoorSessions(),
				getOutdoorSessions(),
				getGymSessions(),
				getFingerboardSessions(),
				getCompetitionSessions()
			]);

			let allSessions: any[] = [];
			if (indoor.ok && indoor.data)
				allSessions = [
					...allSessions,
					...indoor.data.map((s) => ({ ...s, activityType: 'indoor_climb' }))
				];
			if (outdoor.ok && outdoor.data)
				allSessions = [
					...allSessions,
					...outdoor.data.map((s) => ({ ...s, activityType: 'outdoor_climb' }))
				];
			if (gym.ok && gym.data)
				allSessions = [
					...allSessions,
					...gym.data.map((s) => ({ ...s, activityType: 'gym_session' }))
				];
			if (finger.ok && finger.data)
				allSessions = [
					...allSessions,
					...finger.data.map((s) => ({ ...s, activityType: 'fingerboarding' }))
				];
			if (comp.ok && comp.data)
				allSessions = [
					...allSessions,
					...comp.data.map((s) => ({ ...s, activityType: 'competition' }))
				];

			allSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
			sessions = allSessions;
			applyFilters();
		} catch (e) {
			fetchError = e instanceof Error ? e.message : 'Unknown error';
		} finally {
			isLoading = false;
		}
	}

	function applyFilters() {
		visibleCount = ITEMS_PER_PAGE;

		filteredSessions = sessions.filter((session) => {
			if (filterStartDate && session.date < filterStartDate) return false;
			if (filterEndDate && session.date > filterEndDate) return false;
			return true;
		});
	}

	function loadMore() {
		visibleCount += ITEMS_PER_PAGE;
	}

	function getSessionLabel(activityType: string): string {
		switch (activityType) {
			case 'indoor_climb':
				return '🧗 Indoor';
			case 'outdoor_climb':
				return '⛰️ Outdoor';
			case 'gym_session':
				return '🏋️ Gym';
			case 'fingerboarding':
				return '🤏 Fingerboard';
			case 'competition':
				return '🏆 Competition';
			default:
				return '📋 Session';
		}
	}

	function getTypeBorderClass(activityType: string): string {
		switch (activityType) {
			case 'indoor_climb':
				return 'type-indoor';
			case 'outdoor_climb':
				return 'type-outdoor';
			case 'gym_session':
				return 'type-gym';
			case 'fingerboarding':
				return 'type-fingerboard';
			case 'competition':
				return 'type-competition';
			default:
				return '';
		}
	}
</script>

<div class="view-container">
	<div class="view-header">
		<h2 class="view-title">📅 Combined Training History</h2>
		<div class="header-actions">
			<button
				class="action-btn"
				onclick={handleFetchData}
				disabled={isLoading}
				title="Fetch data from cloud"
			>
				{#if isLoading}
					<span class="spinner"></span> Fetching...
				{:else}
					☁️ Fetch Data
				{/if}
			</button>
		</div>
	</div>

	{#if fetchError}
		<div class="error-banner" transition:slide>
			{fetchError}
		</div>
	{/if}

	<!-- Type Legend -->
	<div class="type-legend">
		<div class="legend-item"><span class="legend-dot type-indoor"></span> Indoor</div>
		<div class="legend-item"><span class="legend-dot type-outdoor"></span> Outdoor</div>
		<div class="legend-item"><span class="legend-dot type-gym"></span> Gym</div>
		<div class="legend-item"><span class="legend-dot type-fingerboard"></span> Fingerboard</div>
		<div class="legend-item"><span class="legend-dot type-competition"></span> Competition</div>
	</div>

	<div class="sessions-list">
		{#each filteredSessions.slice(0, visibleCount) as session (session.id)}
			<div class="combined-card-wrapper {getTypeBorderClass(session.activityType)}">
				<div class="type-indicator">
					{getSessionLabel(session.activityType)}
				</div>
				{#if session.activityType === 'indoor_climb'}
					<IndoorClimbCard {session} onDelete={handleFetchData} />
				{:else if session.activityType === 'outdoor_climb'}
					<OutdoorClimbCard {session} onDelete={handleFetchData} />
				{:else if session.activityType === 'gym_session'}
					<GymSessionCard {session} onDelete={handleFetchData} />
				{:else if session.activityType === 'fingerboarding'}
					<FingerboardSessionCard {session} onDelete={handleFetchData} />
				{:else if session.activityType === 'competition'}
					<CompetitionCard {session} />
				{/if}
			</div>
		{/each}

		{#if filteredSessions.length === 0}
			<div class="empty-state">
				<p>No sessions found.</p>
				{#if sessions.length > 0}
					<small>Try adjusting your date filter or calendar selection.</small>
				{/if}
			</div>
		{/if}

		{#if visibleCount < filteredSessions.length}
			<div class="load-more-container">
				<button class="load-more-btn" onclick={loadMore}>
					Load More ({filteredSessions.length - visibleCount} remaining)
				</button>
			</div>
		{/if}
	</div>
</div>

<style>
	.view-container {
		animation: fadeIn 0.3s ease;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.view-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
	}

	.header-actions {
		display: flex;
		gap: 0.5rem;
	}

	.view-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}

	.action-btn {
		background: var(--teal-secondary);
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 8px;
		font-weight: 600;
		font-size: 0.9rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		transition:
			background 0.2s ease,
			transform 0.1s ease;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.action-btn:hover:not(:disabled) {
		background: var(--teal-primary);
		transform: translateY(-1px);
	}

	.action-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.spinner {
		width: 14px;
		height: 14px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.error-banner {
		background: rgba(217, 83, 79, 0.1);
		color: #d9534f;
		padding: 0.75rem;
		border-radius: 8px;
		margin-bottom: 1rem;
		font-size: 0.9rem;
		text-align: center;
		border: 1px solid rgba(217, 83, 79, 0.2);
	}

	.type-legend {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0 0.5rem;
		margin-bottom: 1rem;
		font-size: 0.8rem;
		color: var(--text-secondary);
		flex-wrap: wrap;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}

	.legend-dot {
		width: 10px;
		height: 10px;
		border-radius: 3px;
	}

	.legend-dot.type-indoor {
		background: rgba(66, 165, 245, 0.7);
	}
	.legend-dot.type-outdoor {
		background: rgba(129, 199, 132, 0.7);
	}
	.legend-dot.type-gym {
		background: rgba(255, 183, 77, 0.7);
	}
	.legend-dot.type-fingerboard {
		background: rgba(149, 117, 205, 0.7);
	}
	.legend-dot.type-competition {
		background: rgba(239, 83, 80, 0.7);
	}

	.combined-card-wrapper {
		position: relative;
		border-left: 4px solid transparent;
		border-radius: 4px;
		margin-bottom: 0.25rem;
	}

	.combined-card-wrapper.type-indoor {
		border-left-color: rgba(66, 165, 245, 0.7);
	}
	.combined-card-wrapper.type-outdoor {
		border-left-color: rgba(129, 199, 132, 0.7);
	}
	.combined-card-wrapper.type-gym {
		border-left-color: rgba(255, 183, 77, 0.7);
	}
	.combined-card-wrapper.type-fingerboard {
		border-left-color: rgba(149, 117, 205, 0.7);
	}
	.combined-card-wrapper.type-competition {
		border-left-color: rgba(239, 83, 80, 0.7);
	}

	.type-indicator {
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-secondary);
		padding: 0.2rem 0.5rem 0 0.5rem;
	}

	.empty-state {
		text-align: center;
		padding: 3rem 1rem;
		color: var(--text-secondary);
		background: rgba(255, 255, 255, 0.5);
		border-radius: 12px;
		border: 2px dashed rgba(74, 155, 155, 0.15);
	}

	.empty-state p {
		margin: 0 0 0.5rem 0;
		font-size: 1.1rem;
	}

	.empty-state small {
		opacity: 0.7;
	}

	.load-more-container {
		display: flex;
		justify-content: center;
		padding: 1rem 0 6rem 0;
	}

	.load-more-btn {
		background: white;
		border: 1px solid var(--teal-secondary);
		color: var(--teal-secondary);
		padding: 0.6rem 1.5rem;
		border-radius: 20px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}

	.load-more-btn:hover {
		background: var(--teal-secondary);
		color: white;
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(74, 155, 155, 0.2);
	}
</style>
