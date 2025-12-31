<script lang="ts">
	import { slide } from 'svelte/transition';

	interface Props {
		onFilterParamsChange: (params: FilterParams) => void;
	}

	let { onFilterParamsChange }: Props = $props();

	export interface FilterParams {
		startDate: string;
		endDate: string;
		name: string;
	}

	let isExpanded = $state(false);
	
	let startDate = $state('');
	let endDate = $state('');
	let name = $state('');

	function toggleExpand() {
		isExpanded = !isExpanded;
	}

	function resetFilters() {
		startDate = '';
		endDate = '';
		name = '';
		applyFilters();
	}

	function applyFilters() {
		onFilterParamsChange({
			startDate,
			endDate,
			name
		});
	}
</script>

<div class="filter-container">
	<button class="filter-header" onclick={toggleExpand} aria-expanded={isExpanded}>
		<div class="header-content">
			<span class="icon">🔍</span>
			<span class="title">Filters</span>
			{#if isExpanded}
				<span class="chevron">▲</span>
			{:else}
				<span class="chevron">▼</span>
			{/if}
		</div>
	</button>

	{#if isExpanded}
		<div class="filter-body" transition:slide={{ duration: 200 }}>
			<div class="filter-grid">
				<div class="filter-item">
					<label for="start-date">Start Date</label>
					<input type="date" id="start-date" bind:value={startDate} onchange={applyFilters} />
				</div>
				<div class="filter-item">
					<label for="end-date">End Date</label>
					<input type="date" id="end-date" bind:value={endDate} onchange={applyFilters} />
				</div>
				<div class="filter-item">
					<label for="name-filter">Session Name</label>
					<input 
						type="text" 
						id="name-filter" 
						bind:value={name} 
						placeholder="e.g. Leg Day" 
						oninput={applyFilters}
					/>
				</div>
			</div>
			
			<div class="filter-actions">
				<button class="reset-btn" onclick={resetFilters}>Reset Filters</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.filter-container {
		background: white;
		border-radius: 12px;
		border: 1px solid rgba(74, 155, 155, 0.2);
		margin-bottom: 1.5rem;
		overflow: hidden;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
	}

	.filter-header {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.25rem;
		background: rgba(74, 155, 155, 0.05);
		border: none;
		cursor: pointer;
		transition: background 0.2s ease;
	}

	.filter-header:hover {
		background: rgba(74, 155, 155, 0.1);
	}

	.header-content {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
	}

	.title {
		font-weight: 600;
		color: var(--teal-secondary);
		font-size: 1rem;
		flex: 1;
		text-align: left;
	}

	.icon {
		font-size: 1.1rem;
	}

	.chevron {
		color: var(--teal-secondary);
		font-size: 0.8rem;
	}

	.filter-body {
		padding: 1.25rem;
		border-top: 1px solid rgba(74, 155, 155, 0.1);
	}

	.filter-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1rem;
	}

	.filter-item {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.filter-item label {
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--text-secondary);
	}

	.filter-item input {
		padding: 0.5rem 0.75rem;
		border-radius: 8px;
		border: 1px solid rgba(74, 155, 155, 0.3);
		font-size: 0.9rem;
		color: var(--text-primary);
		background: white;
	}

	.filter-item input:focus {
		outline: none;
		border-color: var(--teal-primary);
		box-shadow: 0 0 0 3px rgba(74, 155, 155, 0.1);
	}

	.filter-actions {
		display: flex;
		justify-content: flex-end;
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px dashed rgba(74, 155, 155, 0.2);
	}

	.reset-btn {
		background: none;
		border: none;
		color: var(--text-secondary);
		font-size: 0.9rem;
		cursor: pointer;
		text-decoration: underline;
		padding: 0.25rem 0.5rem;
	}

	.reset-btn:hover {
		color: var(--teal-secondary);
	}
</style>
