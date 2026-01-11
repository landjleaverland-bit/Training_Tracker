<script lang="ts">
	/**
	 * @file EditSessionModal.svelte
	 * @component
	 * @description Full-screen modal for editing an existing session.
	 * Dynamically loads the appropriate form based on activity type.
	 */
	import { fade, fly } from 'svelte/transition';
	import IndoorClimbForm from '$lib/components/forms/IndoorClimbForm.svelte';
	import OutdoorClimbForm from '$lib/components/forms/OutdoorClimbForm.svelte';
	import GymSessionForm from '$lib/components/forms/GymSessionForm.svelte';
	import FingerboardingForm from '$lib/components/forms/FingerboardingForm.svelte';
	import CompetitionForm from '$lib/components/forms/CompetitionForm.svelte';

	interface Props {
		/** Visibility state. */
		isOpen: boolean;
		/** Type of activity to edit (e.g., 'indoor_climb'). */
		activityType: string;
		/** Original data to populate the form. */
		initialData: any;
		/** Close callback. */
		onClose: () => void;
		/** Save success callback. */
		onSaved: () => void;
	}

	let { isOpen, activityType, initialData, onClose, onSaved }: Props = $props();

	function handleDialogKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
            // Native dialog handles escape, but we explicitly sync logic
            e.preventDefault();
			onClose();
		}
	}

    function dialogAction(node: HTMLDialogElement) {
        node.showModal();
        return {
            destroy() {
                if (node.open) node.close();
            }
        }
    }
</script>

{#if isOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
	<dialog 
        class="edit-dialog" 
        use:dialogAction
        onclose={onClose}
        onclick={(e) => {
            // Close if clicking the backdrop area (which is the dialog element itself in this setup)
            // But since we are full screen, this is less relevant, but good practice if we add padding later
            if (e.target === e.currentTarget) onClose();
        }}
    >
        <!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="dialog-content"
			transition:fly={{ duration: 250, y: 50, opacity: 0 }}
			onclick={(e) => e.stopPropagation()}
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
	</dialog>
{/if}

<style>
	.edit-dialog {
        /* Dialog Setup: Reset defaults and force full screen transparent container */
		width: 100vw;
		height: 100vh;
		max-width: 100vw;
		max-height: 100vh;
        margin: 0;
        padding: 0;
		background: transparent;
        border: none;
        outline: none;
        
        /* Positioning */
        position: fixed;
        top: 0;
        left: 0;
        z-index: 9999;
	}

    .edit-dialog::backdrop {
        background: rgba(0, 0, 0, 0.5); /* Just in case, though content covers it */
        backdrop-filter: blur(2px);
    }

	.dialog-content {
		background: white;
		width: 100%;
		height: 100%; /* Full screen */
		display: flex;
		flex-direction: column;
		box-shadow: none;
        overflow: hidden;
        border-radius: 0;
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
        min-height: 0;
		overflow-y: auto;
		padding: 1.5rem;
        padding-bottom: calc(1.5rem + env(safe-area-inset-bottom));
        overscroll-behavior: contain;
	}
    
    @media (max-width: 640px) {
        .modal-header {
            padding: 1rem;
        }

        .modal-body {
            padding: 1rem;
            padding-bottom: calc(1rem + env(safe-area-inset-bottom));
        }
    }
</style>
