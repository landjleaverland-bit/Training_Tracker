<script lang="ts">
	// Placeholder form for Fingerboarding logging
</script>

<div class="form-content">
	<h3>🤏 Fingerboarding</h3>
	<p class="form-placeholder">Fingerboarding form fields will go here</p>
</div>

<style>
	.form-content {
		animation: slideIn 0.2s ease;
	}

	@keyframes slideIn {
		from { opacity: 0; transform: translateY(4px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.form-content h3 {
		margin: 0 0 1rem 0;
		color: var(--teal-secondary);
		font-size: 1.25rem;
	}

	.form-placeholder {
		color: var(--text-secondary);
		font-style: italic;
	}
</style>
