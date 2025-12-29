<script lang="ts">
	// Fingerboarding View - displays fingerboarding history
</script>

<div class="view-container">
	<h2 class="view-title">🤏 Fingerboarding History</h2>
	<p class="placeholder-text">Your fingerboarding sessions will appear here</p>
</div>

<style>
	.view-container {
		animation: fadeIn 0.3s ease;
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(8px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.view-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 1rem 0;
	}

	.placeholder-text {
		color: var(--text-secondary);
		font-style: italic;
		text-align: center;
		padding: 2rem;
		background: rgba(74, 155, 155, 0.05);
		border-radius: 12px;
		margin: 0;
	}
</style>
