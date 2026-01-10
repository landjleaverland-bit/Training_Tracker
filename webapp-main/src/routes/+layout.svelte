<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import TabBar from '$lib/components/TabBar.svelte';
	import Login from '$lib/components/Login.svelte';
	import { isAuthenticated, isAuthLoading, logout } from '$lib/services/auth';
	import ReloadPrompt from '$lib/components/common/ReloadPrompt.svelte';
	import { onMount } from 'svelte';

	let { children } = $props();

	// Auth state
	let isLoggedIn = $state(false);
    let isLoading = $state(true);
	
    // Subscribe to auth stores
    $effect(() => {
        const unsubscribeAuth = isAuthenticated.subscribe(value => {
            isLoggedIn = value;
        });
        const unsubscribeLoading = isAuthLoading.subscribe(value => {
            isLoading = value;
        });
        return () => {
            unsubscribeAuth();
            unsubscribeLoading();
        };
    });

	function handleLoginSuccess() {
		// No manual state update needed, store handles it
	}

    async function handleLogout() {
        await logout();
    }
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

{#if isLoading}
	<!-- Loading state while checking auth -->
	<div class="loading-container">
		<p>Loading...</p>
	</div>
{:else if !isLoggedIn}
	<!-- Show login if not authenticated -->
	<Login onSuccess={handleLoginSuccess} />
{:else}
	<!-- Main app content -->
	<div class="app-container">
		<header>
			<TabBar />
            <button class="mobile-logout" onclick={handleLogout} aria-label="Sign Out">🚪</button>
		</header>
		<main>
			{@render children()}
		</main>
	</div>
{/if}

<ReloadPrompt />

<style>
	.loading-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--teal-primary);
		font-size: 1.1rem;
	}

	.app-container {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	header {
		position: sticky;
		top: 0;
		z-index: 40;
	}

    .mobile-logout {
        display: none;
    }

	main {
		flex: 1;
		padding: 1.5rem;
		max-width: 1200px;
		margin: 0 auto;
		width: 100%;
	}

	/* On mobile, header doesn't need sticky top - TabBar handles bottom positioning */
	@media (max-width: 640px) {
		header {
			position: static;
		}

        .mobile-logout {
            display: flex;
            align-items: center;
            justify-content: center;
            position: fixed;
            top: 1rem;
            right: 1rem;
            z-index: 60;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(74, 155, 155, 0.2);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            font-size: 1.2rem;
            cursor: pointer;
            transition: transform 0.2s;
        }

        .mobile-logout:active {
            transform: scale(0.95);
        }

		main {
			padding: 0.5rem;
			padding-bottom: 7rem; /* Ensure content is not hidden behind fixed TabBar */
		}
	}
</style>
