<script lang="ts">
	import { loginWithGoogle } from '$lib/services/auth';

	interface Props {
		onSuccess: () => void;
	}

	let { onSuccess }: Props = $props();

	let isLoading = $state(false);
	let error = $state('');

	async function handleLogin() {
		isLoading = true;
		error = '';

		const result = await loginWithGoogle();

		if (result.ok) {
			onSuccess();
		} else {
			error = result.error || 'Login failed';
			isLoading = false;
		}
	}
</script>

<div class="login-container">
	<div class="login-card">
		<div class="login-header">
			<h1>🏋️ Training Tracker</h1>
			<p>Sign in to continue</p>
		</div>

		<div class="login-content">
			{#if error}
				<div class="error-message">{error}</div>
			{/if}

			<button class="google-btn" onclick={handleLogin} disabled={isLoading}>
				{#if isLoading}
					<span>Signing in...</span>
				{:else}
                    <svg class="google-icon" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.12c-.22-.66-.35-1.36-.35-2.12s.13-1.46.35-2.12V7.04H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.96l3.66-2.84z"/>
                        <path fill="#EA4335" d="M12 4.36c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.09 14.97 0 12 0 7.7 0 3.99 2.47 2.18 7.04l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
					<span>Sign in with Google</span>
				{/if}
			</button>
		</div>
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
		padding: 3rem 2.5rem;
		width: 100%;
		max-width: 400px;
		box-shadow: 0 10px 40px rgba(74, 155, 155, 0.15);
		border: 1px solid rgba(74, 155, 155, 0.1);
        text-align: center;
	}

	.login-header {
		margin-bottom: 2.5rem;
	}

	.login-header h1 {
		font-size: 1.75rem;
		color: var(--teal-secondary, #2E8B8B);
		margin: 0 0 0.75rem 0;
	}

	.login-header p {
		color: var(--text-secondary, #5D6D7E);
		margin: 0;
		font-size: 1rem;
	}

	.error-message {
		background: rgba(217, 83, 79, 0.1);
		color: #c9302c;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
		font-size: 0.9rem;
		border: 1px solid rgba(217, 83, 79, 0.2);
	}

	.google-btn {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.8rem 1.5rem;
		background: white;
		color: #3c4043;
		border: 1px solid #dadce0;
		border-radius: 4px;
		font-family: 'Google Sans', arial, sans-serif;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s, box-shadow 0.2s;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
	}

	.google-btn:hover:not(:disabled) {
		background-color: #f7f8f8;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
	}

    .google-btn:active:not(:disabled) {
        background-color: #f1f3f4;
    }

	.google-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

    .google-icon {
        width: 18px;
        height: 18px;
        margin-right: 12px;
    }
</style>
