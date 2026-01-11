<script lang="ts">
	/**
	 * @file ReloadPrompt.svelte
	 * @component
	 * @description Handles Service Worker updates and offline readiness.
	 * Displays a prompt (toast) to the user when a new version is available or cached.
	 */
	import { onMount } from 'svelte';
    import { base } from '$app/paths';

	let needRefresh = $state(false);
	let offlineReady = $state(false);
	let registration: ServiceWorkerRegistration | null = null;

	function close() {
		needRefresh = false;
		offlineReady = false;
	}

	function updateServiceWorker() {
		if (registration && registration.waiting) {
			registration.waiting.postMessage({ type: 'SKIP_WAITING' });
			// Instead of purely relying on controllerchange, we can force reload
			// But ideally standard SW lifecycle flow handles this via controllerchange
			// For now, let's just reload after a short delay to allow the SW to activate
            if (window.location) {
                // Sending SKIP_WAITING should trigger controllerchange, 
                // but let's be safe and reload if we are the ones who asked for it.
                // However, the cleanest way is a listener on navigator.serviceWorker.
                // We'll trust the listener below.
            }
		}
	}

	onMount(() => {
		if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
            // In DEVELOPMENT, unregister any existing service workers to avoid conflicts/errors
            if (import.meta.env.DEV) {
                navigator.serviceWorker.getRegistrations().then(registrations => {
                    for (const registration of registrations) {
                        registration.unregister();
                        console.log('Unregistered Service Worker in Dev mode');
                    }
                });
                return; // Stop here
            }

			// Register the SW (Production only)
			navigator.serviceWorker.register(`${base}/service-worker.js`, {
				scope: `${base}/`
			}).then(reg => {
				registration = reg;

				reg.addEventListener('updatefound', () => {
					const newWorker = reg.installing;
					if (newWorker) {
						newWorker.addEventListener('statechange', () => {
							if (newWorker.state === 'installed') {
								if (navigator.serviceWorker.controller) {
									// New update available
									needRefresh = true;
								} else {
									// Content is cached for offline use
									offlineReady = true;
                                    setTimeout(() => offlineReady = false, 3000); // Hide after 3s
								}
							}
						});
					}
				});

                // Check for updates periodically (every hour)
                setInterval(() => {
                    reg.update();
                }, 60 * 60 * 1000);

                // Check for updates when the app returns to foreground
                document.addEventListener('visibilitychange', () => {
                    if (document.visibilityState === 'visible') {
                        reg.update();
                    }
                });
			});

			// Listen for the controlling service worker changing
			// This happens when the new SW skips waiting and becomes active
			navigator.serviceWorker.addEventListener('controllerchange', () => {
				window.location.reload();
			});
		}
	});
</script>

{#if needRefresh}
	<div class="pwa-toast" role="alert">
		<div class="message">
			<span>New version available!</span>
		</div>
		<div class="buttons">
			<button onclick={updateServiceWorker}>Reload</button>
			<button class="close" onclick={close}>✕</button>
		</div>
	</div>
{/if}

{#if offlineReady}
    <div class="pwa-toast" role="alert">
        <div class="message">
            <span>App ready to work offline</span>
        </div>
        <button class="close" onclick={close}>✕</button>
    </div>
{/if}

<style>
	.pwa-toast {
		position: fixed;
		right: 16px;
		bottom: 16px;
		margin: 16px;
		padding: 12px;
		border: 1px solid var(--teal-primary);
		background-color: white;
		border-radius: 8px;
		z-index: 100;
		text-align: left;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		display: flex;
		align-items: center;
		gap: 12px;
        animation: slideUp 0.3s ease-out;
	}

    @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }

	.message {
		margin-right: 8px;
        font-weight: 500;
        color: var(--text-primary);
        font-size: 0.9rem;
	}

    .buttons {
        display: flex;
        gap: 8px;
    }

	button {
		border: 1px solid var(--teal-primary);
		outline: none;
		margin-right: 5px;
		border-radius: 4px;
		padding: 4px 12px;
        background: var(--teal-primary);
        color: white;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.85rem;
	}

    button:hover {
        background: var(--teal-secondary);
    }

    button.close {
        background: transparent;
        color: #999;
        border: 1px solid #eee;
        padding: 4px 8px;
        margin-right: 0;
        font-size: 1rem;
        line-height: 1;
    }

    button.close:hover {
        background: #f5f5f5;
        color: #333;
    }
</style>
