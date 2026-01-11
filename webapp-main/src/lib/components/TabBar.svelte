<script lang="ts">
	/**
	 * @file TabBar.svelte
	 * @component
	 * @description Main navigation bar for the application.
	 * Displays links to major routes (Log, View, Plot) and handles logout.
	 * Responsive design adjusts to bottom bar on mobile.
	 */
	import { page } from '$app/state';
	import { base } from '$app/paths';
	import { logout } from '$lib/services/auth';

	const tabs = [
		{ name: 'Log Data', path: '/log', icon: '📝' },
		{ name: 'View Data', path: '/view', icon: '📊' },
		{ name: 'Plot Data', path: '/plot', icon: '📈' }
	];

	function isActive(tabPath: string): boolean {
		const currentPath = page.url.pathname.replace(base, '') || '/';
		return currentPath === tabPath || currentPath.startsWith(tabPath + '/');
	}

	async function handleLogout() {
		await logout();
	}
</script>

<nav class="tab-bar">
	{#each tabs as tab}
		<a
			href="{base}{tab.path}"
			class="tab"
			class:active={isActive(tab.path)}
		>
			<span class="tab-icon">{tab.icon}</span>
			<span class="tab-label">{tab.name}</span>
		</a>
	{/each}
	
	<button class="tab logout-btn" onclick={handleLogout} aria-label="Sign Out">
		<span class="tab-icon">🚪</span>
		<span class="tab-label">Sign Out</span>
	</button>
</nav>

<style>
	.tab-bar {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(12px);
		border-bottom: 1px solid rgba(74, 155, 155, 0.2);
		box-shadow: 0 4px 20px rgba(74, 155, 155, 0.1);
	}

	.tab {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		border-radius: 12px;
		text-decoration: none;
		font-weight: 500;
		font-size: 0.95rem;
		color: #4A9B9B;
		background: transparent;
		transition: all 0.2s ease;
		position: relative;
		overflow: hidden;
	}

	.tab:hover {
		background: rgba(244, 196, 48, 0.15);
		color: #2E8B8B;
	}

	button.tab {
		border: none;
		cursor: pointer;
		font-family: inherit;
		font-size: 0.95rem; /* Ensure font size match */
	}

	.logout-btn:hover {
		background: rgba(217, 83, 79, 0.1);
		color: #d9534f;
	}

	.tab.active {
		background: linear-gradient(135deg, #F4C430 0%, #4A9B9B 100%);
		color: white;
		box-shadow: 0 4px 15px rgba(244, 196, 48, 0.4);
	}

	.tab.active:hover {
		background: linear-gradient(135deg, #E6B72B 0%, #2E8B8B 100%);
	}

	.tab-icon {
		font-size: 1.1rem;
	}

	.tab-label {
		letter-spacing: 0.02em;
	}

	/* Mobile: bottom fixed tabs */
	@media (max-width: 640px) {
		.logout-btn {
			display: none;
		}

		.tab-bar {
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
			z-index: 50;
			border-bottom: none;
			border-top: 1px solid rgba(74, 155, 155, 0.2);
			padding: 0.5rem 0.5rem calc(0.5rem + env(safe-area-inset-bottom)) 0.5rem;
			gap: 0.25rem;
		}

		.tab {
			flex: 1;
			flex-direction: column;
			gap: 0.25rem;
			padding: 0.5rem 0.75rem;
			font-size: 0.75rem;
		}

		.tab-icon {
			font-size: 1.25rem;
		}
	}
</style>
