<script lang="ts">
	/**
	 * @file DeleteDataModal.svelte
	 * @component
	 * @description A modal for bulk deleting sessions from the local cache.
	 * Filtering by activity type and time range.
	 */
    import { fade, scale } from 'svelte/transition';
    import type { Session } from '$lib/types/session';

    let { 
        isOpen = false, 
        sessions = [],
        onClose,
        onDelete
    } = $props<{
        /** Visibility state. */
        isOpen: boolean;
        /** List of all available sessions. */
        sessions: Session[];
        /** Close callback. */
        onClose: () => void;
        /** Delete callback with criteria. */
        onDelete: (criteria: { activityType: string, timeRange: string }) => void;
    }>();

    let selectedActivity = $state('all');
    let selectedTimeRange = $state('all_time');

    const activityOptions = [
        { value: 'all', label: 'All Activities' },
        { value: 'indoor_climb', label: 'Indoor Climb' },
        { value: 'outdoor_climb', label: 'Outdoor Climb' },
        { value: 'gym_session', label: 'Gym Session' },
        { value: 'fingerboarding', label: 'Fingerboarding' },
        { value: 'competition', label: 'Competition' }
    ];

    const timeRangeOptions = [
        { value: '24_hours', label: 'Past 24 Hours' },
        { value: '7_days', label: 'Past 7 Days' },
        { value: '30_days', label: 'Past 30 Days' },
        { value: '1_year', label: 'Past Year' },
        { value: 'all_time', label: 'All Time' }
    ];

    /**
     * Filters sessions based on selected criteria to preview impact.
     */
    function filterSessions(sessions: Session[], activity: string, range: string): Session[] {
        const now = new Date();
        return sessions.filter(session => {
            // Filter by Activity
            if (activity !== 'all' && session.activityType !== activity) {
                return false;
            }

            // Filter by Time Range
            if (range === 'all_time') return true;

            const sessionDate = new Date(session.date);
            const diffTime = now.getTime() - sessionDate.getTime();
            const diffDays = diffTime / (1000 * 3600 * 24);

            switch (range) {
                case '24_hours':
                    return diffDays <= 1;
                case '7_days':
                    return diffDays <= 7;
                case '30_days':
                    return diffDays <= 30;
                case '1_year':
                    return diffDays <= 365;
                default:
                    return true;
            }
        });
    }

    let sessionsToDelete = $derived(filterSessions(sessions, selectedActivity, selectedTimeRange));
    let count = $derived(sessionsToDelete.length);

    function handleDelete() {
        onDelete({
            activityType: selectedActivity,
            timeRange: selectedTimeRange
        });
        // Reset selections? No need if component unmounts or parent handles it.
    }
</script>

{#if isOpen}
    <!-- Backdrop -->
    <button class="backdrop" onclick={onClose} transition:fade={{ duration: 200 }} aria-label="Close modal"></button>

    <!-- Modal -->
    <div class="modal" role="dialog" aria-modal="true" transition:scale={{ duration: 200, start: 0.9 }}>
        <h3>Delete Data</h3>
        <p class="subtitle">Select data to remove from your local cache.</p>
        
        <div class="form-group">
            <label for="delete-activity">Activity Type</label>
            <select id="delete-activity" bind:value={selectedActivity}>
                {#each activityOptions as option}
                    <option value={option.value}>{option.label}</option>
                {/each}
            </select>
        </div>

        <div class="form-group">
            <label for="delete-range">Time Range</label>
            <select id="delete-range" bind:value={selectedTimeRange}>
                {#each timeRangeOptions as option}
                    <option value={option.value}>{option.label}</option>
                {/each}
            </select>
        </div>

        <div class="summary-box" class:has-items={count > 0}>
            <p>
                This will delete <strong>{count}</strong> session{count !== 1 ? 's' : ''}.
            </p>
            {#if count === 0}
                <small>Try adjusting the filters to find data.</small>
            {/if}
        </div>

        <div class="actions">
            <button class="btn-cancel" onclick={onClose}>Cancel</button>
            <button 
                class="btn-delete" 
                disabled={count === 0} 
                onclick={handleDelete}
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
        border-radius: 16px;
        box-shadow: 0 4px 25px rgba(0, 0, 0, 0.2);
        z-index: 1001;
        width: 90%;
        max-width: 400px;
    }

    h3 {
        margin: 0 0 0.25rem 0;
        color: var(--text-primary);
        font-size: 1.25rem;
    }

    .subtitle {
        margin: 0 0 1.5rem 0;
        color: var(--text-secondary);
        font-size: 0.9rem;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 1rem;
        text-align: left;
    }

    label {
        font-weight: 600;
        color: var(--text-primary);
        font-size: 0.9rem;
    }

    select {
        padding: 0.75rem;
        border-radius: 8px;
        border: 1px solid #ddd;
        background: white;
        font-size: 1rem;
        width: 100%;
        cursor: pointer;
    }

    select:focus {
        outline: none;
        border-color: var(--teal-primary);
        box-shadow: 0 0 0 2px rgba(74, 155, 155, 0.1);
    }

    .summary-box {
        background: #f8f9fa;
        border-radius: 8px;
        padding: 1rem;
        margin: 1.5rem 0;
        text-align: center;
        border: 1px solid #eee;
    }

    .summary-box.has-items {
        background: rgba(255, 77, 77, 0.05);
        border-color: rgba(255, 77, 77, 0.2);
    }

    .summary-box p {
        margin: 0;
        color: var(--text-primary);
    }

    .summary-box strong {
        color: #d9534f;
    }

    .summary-box small {
        display: block;
        margin-top: 0.25rem;
        color: var(--text-secondary);
    }

    .actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
    }

    button {
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        border: none;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 0.95rem;
    }

    .btn-cancel {
        background: #f0f0f0;
        color: #333;
    }

    .btn-cancel:hover {
        background: #e0e0e0;
    }

    .btn-delete {
        background: #d9534f;
        color: white;
    }

    .btn-delete:hover:not(:disabled) {
        background: #c9302c;
    }

    .btn-delete:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        background: #d9534f;
    }
</style>
