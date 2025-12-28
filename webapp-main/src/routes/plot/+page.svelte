<script lang="ts">
	// Plot Data page - for visualizing training progress
</script>

<div class="page">
	<div class="page-header">
		<h1>📈 Plot Data</h1>
		<p class="subtitle">Visualize your progress</p>
	</div>
	
	<div class="content-card">
		<p class="placeholder-text">Charts and graphs will appear here</p>
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

	.placeholder-text {
		color: var(--text-secondary);
		font-style: italic;
		text-align: center;
		margin: 2rem 0;
	}
</style>
