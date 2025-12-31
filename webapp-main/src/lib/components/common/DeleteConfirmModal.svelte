<script lang="ts">
    import { fade, scale } from 'svelte/transition';

    let { 
        isOpen = false, 
        title = 'Confirm Delete', 
        message = 'Are you sure you want to delete this item? This action cannot be undone.',
        confirmKeyword = 'delete',
        onConfirm, 
        onCancel,
        requireInput = true
    } = $props<{
        isOpen: boolean;
        title?: string;
        message?: string;
        confirmKeyword?: string;
        onConfirm: () => void;
        onCancel: () => void;
        requireInput?: boolean;
    }>();

    let input = $state('');
    let canConfirm = $derived(!requireInput || input.toLowerCase() === confirmKeyword.toLowerCase());

    function handleConfirm() {
        if (canConfirm) {
            onConfirm();
            input = ''; // Reset
        }
    }

    function handleCancel() {
        onCancel();
        input = ''; // Reset
    }
</script>

{#if isOpen}
    <!-- Backdrop -->
    <button class="backdrop" onclick={handleCancel} transition:fade={{ duration: 200 }} aria-label="Close modal"></button>

    <!-- Modal -->
    <div class="modal" role="dialog" aria-modal="true" transition:scale={{ duration: 200, start: 0.9 }}>
        <h3>{title}</h3>
        <p>{message}</p>
        
        {#if requireInput}
            <div class="input-group">
                <label for="delete-confirm">Type <strong>{confirmKeyword}</strong> to confirm:</label>
                <input 
                    type="text" 
                    id="delete-confirm"
                    bind:value={input} 
                    placeholder={confirmKeyword}
                    autocomplete="off"
                />
            </div>
        {/if}

        <div class="actions">
            <button class="btn-cancel" onclick={handleCancel}>Cancel</button>
            <button 
                class="btn-delete" 
                disabled={!canConfirm} 
                onclick={handleConfirm}
            >
                Delete
            </button>
        </div>
    </div>
{/if}

<style>
    .backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1000;
        border: none;
        cursor: pointer;
    }

    .modal {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 1.5rem;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        z-index: 1001;
        width: 90%;
        max-width: 400px;
        text-align: center;
    }

    h3 {
        margin: 0 0 0.5rem 0;
        color: var(--text-primary);
    }

    p {
        color: var(--text-secondary);
        font-size: 0.9rem;
        margin-bottom: 1.5rem;
    }

    .input-group {
        text-align: left;
        margin-bottom: 1.5rem;
    }

    label {
        display: block;
        font-size: 0.85rem;
        margin-bottom: 0.4rem;
        color: var(--text-secondary);
    }

    input {
        width: 100%;
        padding: 0.6rem;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 1rem;
    }

    input:focus {
        border-color: #d9534f;
        outline: none;
    }

    .actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
    }

    button {
        padding: 0.6rem 1.2rem;
        border-radius: 6px;
        border: none;
        font-weight: 600;
        cursor: pointer;
        transition: opacity 0.2s;
    }

    .btn-cancel {
        background: #f0f0f0;
        color: #333;
    }

    .btn-delete {
        background: #d9534f;
        color: white;
    }

    .btn-delete:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
</style>
