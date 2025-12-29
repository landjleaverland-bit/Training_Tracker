<script>
    import { login } from "$lib/stores/auth";
    import { fade } from "svelte/transition";

    let keyInput = "";
    let error = "";
    let loading = false;

    async function handleSubmit() {
        if (!keyInput.trim()) {
            error = "Please enter a password";
            return;
        }

        loading = true;
        error = "";

        try {
            const success = await login(keyInput.trim());
            if (!success) {
                error = "Incorrect password";
            }
        } catch (e) {
            error = "An error occurred";
        } finally {
            loading = false;
        }
    }
</script>

<div class="login-container" in:fade>
    <div class="lock-icon">
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            ><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path
                d="M7 11V7a5 5 0 0 1 10 0v4"
            /></svg
        >
    </div>

    <h2>Access Restricted</h2>
    <p>Please enter your password to unlock the application.</p>

    <form on:submit|preventDefault={handleSubmit}>
        <div class="input-group">
            <input
                type="password"
                placeholder="Enter Password"
                bind:value={keyInput}
                class:error
                disabled={loading}
            />
            {#if error}
                <span class="error-text">{error}</span>
            {/if}
        </div>

        <button type="submit" class="unlock-button"> Unlock App </button>
    </form>
</div>

<style>
    .login-container {
        text-align: center;
        padding: 1rem 0;
    }

    .lock-icon {
        color: #a78bfa;
        margin-bottom: 1.5rem;
        opacity: 0.8;
    }

    h2 {
        font-size: 1.75rem;
        margin-bottom: 0.5rem;
        color: #f8fafc;
    }

    p {
        color: #94a3b8;
        margin-bottom: 2rem;
        font-size: 0.95rem;
    }

    form {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .input-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        text-align: left;
    }

    input {
        background: rgba(15, 23, 42, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 0.75rem;
        padding: 0.875rem 1rem;
        color: #f8fafc;
        font-size: 1rem;
        transition: all 0.2s ease;
        outline: none;
    }

    input:focus {
        border-color: #a78bfa;
        box-shadow: 0 0 0 2px rgba(167, 139, 250, 0.3);
    }

    input.error {
        border-color: #ef4444;
    }

    .error-text {
        font-size: 0.75rem;
        color: #ef4444;
        padding-left: 0.5rem;
    }

    .unlock-button {
        background: linear-gradient(135deg, #6366f1 0%, #a78bfa 100%);
        color: white;
        border: none;
        padding: 0.875rem;
        border-radius: 0.75rem;
        font-weight: 700;
        cursor: pointer;
        transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
    }

    .unlock-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 15px -3px rgba(167, 139, 250, 0.4);
    }

    .unlock-button:active {
        transform: translateY(0);
    }
</style>
