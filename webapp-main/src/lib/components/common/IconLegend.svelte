<script>
	import { slide } from 'svelte/transition';

	let isOpen = $state(false);

	const legendItems = [
		{ icon: '👁️', label: 'Onsight' },
		{ icon: '⚡', label: 'Flash' },
		{ icon: '🔴', label: 'Redpoint' },
		{ icon: '🛠️', label: 'Dogged' },
		{ icon: '❌', label: 'DNF' }
	];
</script>

<div class="legend-container">
	<button 
		class="legend-toggle" 
		onclick={() => isOpen = !isOpen}
		aria-expanded={isOpen}
	>
		<span class="icon">ℹ️</span>
		<span class="text">Icon Legend</span>
		<span class="chevron">{isOpen ? '▼' : '▶'}</span>
	</button>

	{#if isOpen}
		<div class="legend-content" transition:slide>
			<div class="legend-grid">
				{#each legendItems as item}
					<div class="legend-item">
						<span class="l-icon">{item.icon}</span>
						<span class="l-label">{item.label}</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.legend-container {
		margin-bottom: 1rem;
		background: rgba(255, 255, 255, 0.5);
		border-radius: 8px;
		border: 1px solid rgba(0,0,0,0.05);
		overflow: hidden;
	}

	.legend-toggle {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.8rem;
		background: none;
		border: none;
		cursor: pointer;
		color: var(--text-secondary);
		font-size: 0.85rem;
		font-weight: 500;
	}

	.legend-toggle:hover {
		background: rgba(0,0,0,0.02);
	}

	.chevron {
		margin-left: auto;
		font-size: 0.7rem;
		opacity: 0.5;
	}

	.legend-content {
		padding: 0 0.8rem 0.8rem 0.8rem;
		border-top: 1px solid rgba(0,0,0,0.03);
	}

	.legend-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.8rem 1.5rem;
		padding-top: 0.5rem;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.l-icon {
		font-size: 1rem;
	}

	.l-label {
		font-size: 0.8rem;
		color: var(--text-secondary);
	}
</style>
