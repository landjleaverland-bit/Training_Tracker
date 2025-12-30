<script lang="ts">
	// Filter component for Outdoor Climbs
	import { slide } from 'svelte/transition';
	import { getAreas, getCrags } from '$lib/data/outdoor_locations';

	// Props
	interface Props {
		onFilterParamsChange: (params: FilterParams) => void;
	}

	let { onFilterParamsChange }: Props = $props();

	export interface FilterParams {
		startDate: string;
		endDate: string;
		area: string;
		crag: string;
		sessionType: string;
		grade: string;
	}

    // Get areas from data source
	const areas = getAreas();
	
	// Extract standard training types used in the form
	const trainingTypes = ['Projecting', 'Onsighting', 'Campusing', 'Repeaters', 'Fun', 'Volume'];

	// State
	let isExpanded = $state(false);
	
	let startDate = $state('');
	let endDate = $state('');
	let area = $state('');
	let crag = $state('');
	let sessionType = $state(''); // Maps to trainingType in data
	let grade = $state('');
    let isOtherArea = $state(false);

	// Reactive crag list based on selected area
    // If area is 'Other', we don't fetch crags
	let availableCrags = $derived(area && area !== 'Other' ? getCrags(area) : []);

    // Reset details when area changes
    function onAreaChange() {
        if (area === 'Other') {
            isOtherArea = true;
            // Clear filtering area value if it was 'Other' so we don't filter by literal "Other"
            // Wait, typically we want to allow typing. 
            // In the filter context, selecting 'Other' likely implies "I want to type a manual area".
            // So we'll clear the 'area' bound value to allow typing?
            // No, the UI pattern usually is: Select 'Other' -> input box appears.
            // Let's implement that.
            area = ''; // Clear so they can type
        } else {
            isOtherArea = false;
        }
        crag = ''; // Reset crag
        applyFilters();
    }

	function toggleExpand() {
		isExpanded = !isExpanded;
	}

	function resetFilters() {
		startDate = '';
		endDate = '';
		area = '';
		crag = '';
		sessionType = '';
		grade = '';
        isOtherArea = false;
		applyFilters();
	}

	function applyFilters() {
		onFilterParamsChange({
			startDate,
			endDate,
			area,
			crag,
			sessionType,
			grade
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
					<label for="area-filter">Area</label>
                    {#if isOtherArea}
                        <div class="input-with-action">
                            <input 
                                type="text" 
                                id="area-filter-text" 
                                bind:value={area} 
                                placeholder="Type area name..." 
                                oninput={applyFilters}
                                class="flat-left"
                            />
                            <button 
                                class="action-btn flat-right" 
                                onclick={() => { isOtherArea = false; area = ''; applyFilters(); }}
                                title="Back to list"
                            >✕</button>
                        </div>
                    {:else}
                        <select id="area-filter" bind:value={area} onchange={onAreaChange}>
                            <option value="">All Areas</option>
                            {#each areas as a}
                                <option value={a}>{a}</option>
                            {/each}
                            <option value="Other">Other (Manual Entry)</option>
                        </select>
                    {/if}
				</div>
				<div class="filter-item">
					<label for="crag-filter">Crag</label>
                    {#if !isOtherArea && area && availableCrags.length > 0}
                         <select id="crag-filter" bind:value={crag} onchange={applyFilters}>
                            <option value="">All Crags</option>
                            {#each availableCrags as c}
                                <option value={c}>{c}</option>
                            {/each}
                        </select>
                    {:else}
                        <input 
                            type="text" 
                            id="crag-filter-text" 
                            bind:value={crag} 
                            placeholder={area ? "Filter crag..." : "Select area first"} 
                            oninput={applyFilters}
                            disabled={!isOtherArea && !area} 
                        />
                    {/if}
				</div>
				<div class="filter-item">
					<label for="session-type-filter">Session Type</label>
					<select id="session-type-filter" bind:value={sessionType} onchange={applyFilters}>
						<option value="">Any Type</option>
						{#each trainingTypes as type}
							<option value={type}>{type}</option>
						{/each}
					</select>
				</div>
				<div class="filter-item">
					<label for="grade-filter">Grade (Exact)</label>
					<input 
						type="text" 
						id="grade-filter" 
						bind:value={grade} 
						placeholder="e.g. 7a" 
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

	.filter-item input,
	.filter-item select {
		padding: 0.5rem 0.75rem;
		border-radius: 8px;
		border: 1px solid rgba(74, 155, 155, 0.3);
		font-size: 0.9rem;
		color: var(--text-primary);
		background: white;
	}

	.filter-item input:focus,
	.filter-item select:focus {
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

    .input-with-action {
        display: flex;
        align-items: center;
        width: 100%;
    }

    .input-with-action input {
        flex: 1;
    }

    .input-with-action input.flat-left {
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
        border-right: none;
    }

    .action-btn {
        padding: 0.5rem 0.8rem;
        background: #f8f9fa;
        border: 1px solid rgba(74, 155, 155, 0.3);
        color: #666;
        cursor: pointer;
        font-size: 0.9rem;
    }
    
    .action-btn:hover {
        background: #eee;
        color: #333;
    }

    .action-btn.flat-right {
        border-top-right-radius: 8px;
        border-bottom-right-radius: 8px;
        border-left: 1px solid rgba(74, 155, 155, 0.3);
    }
</style>
