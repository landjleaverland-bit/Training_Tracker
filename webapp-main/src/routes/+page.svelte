<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { onMount } from 'svelte';

	onMount(() => {
		goto(`${base}/log`, { replaceState: true });
	});
</script>

<div class="loading">
	<p>Loading...</p>
</div>

<style>
	.loading {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 50vh;
		color: var(--teal-primary);
		font-size: 1.1rem;
	}
</style>
