<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import TabBar from '$lib/components/TabBar.svelte';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="app-container">
	<header>
		<TabBar />
	</header>
	<main>
		{@render children()}
	</main>
</div>

<style>
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
	}
</style>
