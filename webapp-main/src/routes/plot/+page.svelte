<script lang="ts">
	import LineChart from '$lib/components/LineChart.svelte';

	// Plot Data page - for visualizing training progress

	// Sample data generation
	const generateData = () => {
		const data = [];
		const startDate = new Date('2024-01-01');
		for (let i = 0; i < 30; i++) {
			const date = new Date(startDate);
			date.setDate(startDate.getDate() + i);
			// Random value between 10 and 50 with some trend
			const value = 10 + i + Math.random() * 10;
			data.push({ date, value });
		}
		return data;
	};

	let sampleData = $state(generateData());

	// Dimensions
	let width = 800;
	let height = 400;
</script>

<div class="page">
	<div class="page-header">
		<h1>📈 Plot Data</h1>
		<p class="subtitle">Visualize your progress</p>
	</div>
	
	<div class="content-card">
		{#if sampleData.length > 0}
			<div class="chart-wrapper">
				<h3>Performance Trend</h3>
				<LineChart
					data={sampleData}
					xAccessor={(d) => d.date}
					yAccessor={(d) => d.value}
					{width}
					{height}
					color="var(--teal-primary)"
				/>
			</div>
		{:else}
			<p class="placeholder-text">No data available to plot.</p>
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
		overflow-x: auto; /* Handle smaller screens */
	}

	.chart-wrapper {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.chart-wrapper h3 {
		color: var(--text-primary);
		margin-bottom: 1rem;
	}

	.placeholder-text {
		color: var(--text-secondary);
		font-style: italic;
		text-align: center;
		margin: 2rem 0;
	}
</style>
