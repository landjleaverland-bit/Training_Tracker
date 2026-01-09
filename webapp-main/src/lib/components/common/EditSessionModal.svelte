<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import IndoorClimbForm from '$lib/components/forms/IndoorClimbForm.svelte';
	import OutdoorClimbForm from '$lib/components/forms/OutdoorClimbForm.svelte';
	import GymSessionForm from '$lib/components/forms/GymSessionForm.svelte';
	import FingerboardingForm from '$lib/components/forms/FingerboardingForm.svelte';
	import CompetitionForm from '$lib/components/forms/CompetitionForm.svelte';

	interface Props {
		isOpen: boolean;
		activityType: string;
		initialData: any;
		onClose: () => void;
		onSaved: () => void;
	}

	let { isOpen, activityType, initialData, onClose, onSaved }: Props = $props();

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
	<div class="modal-backdrop" transition:fade={{ duration: 200 }} onclick={onClose} role="button" tabindex="0" onkeydown={handleKeydown}>
		<div
			class="modal-content"
			transition:scale={{ duration: 200, start: 0.95 }}
			onclick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            tabindex="0"
            onkeydown={() => {}}
		>
			<div class="modal-header">
				<h2>Edit Session</h2>
				<button class="close-btn" onclick={onClose}>&times;</button>
			</div>
			
			<div class="modal-body">
				{#if activityType === 'indoor_climb'}
					<IndoorClimbForm {initialData} onCancel={onClose} onSaved={onSaved} />
				{:else if activityType === 'outdoor_climb'}
					<OutdoorClimbForm {initialData} onCancel={onClose} onSaved={onSaved} />
				{:else if activityType === 'gym_session'}
					<GymSessionForm {initialData} onCancel={onClose} onSaved={onSaved} />
				{:else if activityType === 'fingerboarding'}
					<FingerboardingForm {initialData} onCancel={onClose} onSaved={onSaved} />
				{:else if activityType === 'competition'}
					<CompetitionForm {initialData} onCancel={onClose} onSaved={onSaved} />
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(2px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal-content {
		background: white;
		border-radius: 16px;
		width: 100%;
		max-width: 800px;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        overflow: hidden;
	}

	.modal-header {
		padding: 1rem 1.5rem;
		border-bottom: 1px solid #eee;
		display: flex;
		justify-content: space-between;
		align-items: center;
        background: #fff;
        z-index: 10;
        flex-shrink: 0;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.25rem;
		color: var(--teal-secondary);
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 1.5rem;
		line-height: 1;
		color: #999;
		cursor: pointer;
		padding: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		width: 32px;
		height: 32px;
		transition: all 0.2s;
	}

	.close-btn:hover {
		background: #f5f5f5;
		color: #333;
	}

	.modal-body {
		flex: 1;
        min-height: 0; /* Critical for scrolling in flex container */
		overflow-y: auto;
		padding: 1.5rem;
        padding-bottom: calc(1.5rem + env(safe-area-inset-bottom));
        overscroll-behavior: contain;
	}
    
    @media (max-width: 640px) {
        .modal-backdrop {
            padding: 0;
            align-items: flex-end;
        }

        .modal-content {
            height: 100%; /* Full screen on mobile */
            max-height: 100%;
            border-radius: 0;
        }

        .modal-header {
            padding: 1rem;
        }

        .modal-body {
            padding: 1rem;
            padding-bottom: calc(1rem + env(safe-area-inset-bottom)); /* Safe area for iOS home bar */
        }
    }
</style>
