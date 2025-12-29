<script lang="ts">
	import { login, verifyPassword } from '$lib/services/auth';

	interface Props {
		onSuccess: () => void;
	}

	let { onSuccess }: Props = $props();

	let password = $state('');
	let isLoading = $state(false);
	let error = $state('');

	async function handleSubmit(e: Event) {
		e.preventDefault();
		
		if (!password.trim()) {
			error = 'Please enter a password';
			return;
		}

		isLoading = true;
		error = '';

		try {
			// Verify password hash locally
			const isValid = await verifyPassword(password);
			if (!isValid) {
				error = 'Invalid password';
				isLoading = false;
				return;
			}

			// Store password and notify parent
			login(password);
			onSuccess();
		} catch {
			error = 'Login failed. Please try again.';
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="login-container">
	<div class="login-card">
		<div class="login-header">
			<h1>🏋️ Training Tracker</h1>
			<p>Enter your password to continue</p>
		</div>

		<form onsubmit={handleSubmit}>
			<div class="form-group">
				<label for="password">Password</label>
				<input
					type="password"
					id="password"
					bind:value={password}
					placeholder="Enter password..."
					disabled={isLoading}
					autocomplete="current-password"
				/>
			</div>

			{#if error}
				<div class="error-message">{error}</div>
			{/if}

			<button type="submit" class="login-btn" disabled={isLoading}>
				{#if isLoading}
					Verifying...
				{:else}
					Login
				{/if}
			</button>
		</form>
	</div>
</div>

<style>
	.login-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		background: linear-gradient(135deg, var(--bg-primary, #FEFCF7) 0%, var(--bg-secondary, #FBF8F1) 100%);
	}

	.login-card {
		background: rgba(255, 255, 255, 0.95);
		border-radius: 20px;
		padding: 2.5rem;
		width: 100%;
		max-width: 400px;
		box-shadow: 0 10px 40px rgba(74, 155, 155, 0.15);
		border: 1px solid rgba(74, 155, 155, 0.1);
	}

	.login-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.login-header h1 {
		font-size: 1.75rem;
		color: var(--teal-secondary, #2E8B8B);
		margin: 0 0 0.5rem 0;
	}

	.login-header p {
		color: var(--text-secondary, #5D6D7E);
		margin: 0;
		font-size: 0.95rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group label {
		display: block;
		font-weight: 500;
		color: var(--text-primary, #2C3E50);
		margin-bottom: 0.5rem;
		font-size: 0.9rem;
	}

	.form-group input {
		width: 100%;
		padding: 0.9rem 1rem;
		border-radius: 10px;
		border: 2px solid rgba(74, 155, 155, 0.25);
		background: white;
		font-size: 1rem;
		color: var(--text-primary, #2C3E50);
		transition: border-color 0.2s ease, box-shadow 0.2s ease;
		box-sizing: border-box;
	}

	.form-group input:focus {
		outline: none;
		border-color: var(--teal-primary, #4A9B9B);
		box-shadow: 0 0 0 3px rgba(74, 155, 155, 0.12);
	}

	.form-group input:disabled {
		background: rgba(0, 0, 0, 0.05);
		cursor: not-allowed;
	}

	.error-message {
		background: rgba(217, 83, 79, 0.1);
		color: #c9302c;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		margin-bottom: 1rem;
		font-size: 0.9rem;
		text-align: center;
		border: 1px solid rgba(217, 83, 79, 0.2);
	}

	.login-btn {
		width: 100%;
		padding: 0.9rem 1.5rem;
		background: linear-gradient(135deg, var(--gold-primary, #F4C430) 0%, var(--teal-primary, #4A9B9B) 100%);
		color: white;
		border: none;
		border-radius: 10px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}

	.login-btn:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 4px 15px rgba(244, 196, 48, 0.3);
	}

	.login-btn:active:not(:disabled) {
		transform: translateY(0);
	}

	.login-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}
</style>
