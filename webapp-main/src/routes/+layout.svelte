<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import TabBar from '$lib/components/TabBar.svelte';
	import Login from '$lib/components/Login.svelte';
	import { isAuthenticated, isAuthLoading } from '$lib/services/auth';
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

		main {
			padding: 0.5rem;
			padding-bottom: 7rem; /* Ensure content is not hidden behind fixed TabBar */
		}
	}
</style>
