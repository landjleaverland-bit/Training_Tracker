<script lang="ts">
    import { createCompetitionSession, markAsSynced, markAsSyncError } from '$lib/services/cache';
    import { createCompetitionSession as syncToServer, isOnline } from '$lib/services/api';
    import type { CompetitionRound, CompetitionClimbResult } from '$lib/types/session';

    const venues = [
        'Flashpoint Bristol', 'Rockstar Techno', 'Rockstar Unit 3', 'Rockstar Unit 5',
        'Bloc', 'TCA', 'Other'
    ];
    const competitionTypes = ['Bouldering', 'Lead', 'Speed'];
    const roundOptions = ['Qualifiers', 'Semi-Finals', 'Finals', 'Result', 'Other'];
    const resultStatuses = ['Flash', 'Top', 'Zone', 'Attempt'];

    let date = $state(new Date().toISOString().split('T')[0]);
    let venue = $state('');
    let customVenue = $state('');
    let type = $state('Bouldering');
    
    // Load Metrics
    let fingerLoad = $state(4);
    let shoulderLoad = $state(4);
    let forearmLoad = $state(4);

    // Round Configuration
    let roundName = $state('Qualifiers');
    let customRoundName = $state('');
    let finalPosition = $state<number | null>(null);

    // Dynamic Problem Table
    let climbs = $state<CompetitionClimbResult[]>([
        { name: '#1', status: 'Flash', attemptCount: 1, notes: '' }
    ]);

    // Computed states
    let isResultMode = $derived(roundName === 'Result');
    let showCustomVenue = $derived(venue === 'Other');
    let showCustomRound = $derived(roundName === 'Other');
    let actualRoundName = $derived(roundName === 'Other' ? customRoundName : roundName);

    function addClimbRow() {
        const nextNum = climbs.length + 1;
        climbs = [...climbs, { name: `#${nextNum}`, status: 'Flash', attemptCount: 1, notes: '' }];
    }

    function removeClimbRow(index: number) {
        if (climbs.length > 1) {
            climbs = climbs.filter((_, i) => i !== index);
        } else {
            // If last row, just clear it
            climbs[0] = { name: '#1', status: 'Flash', attemptCount: 1, notes: '' };
        }
    }

    function handleStatusChange(index: number, status: string) {
        climbs[index].status = status as any;
        if (status === 'Flash') {
            climbs[index].attemptCount = 1;
        }
    }

    let saveStatus = $state<'idle' | 'saving' | 'success' | 'error'>('idle');
    let saveMessage = $state('');

    async function saveSession() {
        if (!venue || (venue === 'Other' && !customVenue)) {
            saveStatus = 'error';
            saveMessage = 'Please specify a venue';
            return;
        }

        saveStatus = 'saving';
        
        try {
            const roundData: CompetitionRound = {
                name: actualRoundName,
                position: isResultMode ? finalPosition : undefined,
                climbs: isResultMode ? undefined : JSON.parse(JSON.stringify(climbs))
            };

            const sessionData = {
                date,
                venue: venue === 'Other' ? customVenue : venue,
                customVenue: venue === 'Other' ? customVenue : undefined,
                type: type as any,
                fingerLoad: isResultMode ? undefined : fingerLoad,
                shoulderLoad: isResultMode ? undefined : shoulderLoad,
                forearmLoad: isResultMode ? undefined : forearmLoad,
                rounds: [roundData] // Currently creating a new session per log, could append in future logic
            };

            const localSession = createCompetitionSession(sessionData);

            if (isOnline()) {
                const result = await syncToServer(sessionData);
                if (result.ok) {
                    markAsSynced(localSession.id);
                    saveStatus = 'success';
                    saveMessage = 'Competition saved and synced!';
                } else {
                    markAsSyncError(localSession.id);
                    saveStatus = 'success';
                    saveMessage = 'Saved locally. Sync failed: ' + (result.error || 'Unknown error');
                }
            } else {
                saveStatus = 'success';
                saveMessage = 'Saved locally. Will sync when online.';
            }

            window.dispatchEvent(new CustomEvent('session-saved'));
            setTimeout(() => {
                resetForm();
            }, 2000);
        } catch (e) {
            saveStatus = 'error';
            saveMessage = 'Failed to save session';
            console.error('Save error:', e);
        }
    }

    function resetForm() {
        date = new Date().toISOString().split('T')[0];
        venue = '';
        customVenue = '';
        finalPosition = null;
        climbs = [{ name: '#1', status: 'Flash', attemptCount: 1, notes: '' }];
        saveStatus = 'idle';
        saveMessage = '';
    }
</script>

<div class="form-content">
    <h3>🏆 Competition</h3>

    <!-- General Info -->
    <div class="form-grid">
        <div class="form-group">
            <label for="date">Date</label>
            <input type="date" id="date" bind:value={date} />
        </div>
        <div class="form-group">
            <label for="venue">Venue</label>
            <select id="venue" bind:value={venue}>
                <option value="" disabled>Select venue...</option>
                {#each venues as v}
                    <option value={v}>{v}</option>
                {/each}
            </select>
            {#if showCustomVenue}
                <input type="text" bind:value={customVenue} placeholder="Enter venue name" class="mt-2" />
            {/if}
        </div>
    </div>

    <div class="form-group mb-4">
        <label for="type">Type</label>
        <select id="type" bind:value={type}>
            {#each competitionTypes as t}
                <option value={t}>{t}</option>
            {/each}
        </select>
    </div>

    <!-- Round Configuration -->
    <div class="round-section">
        <div class="form-group">
            <label for="round">Round</label>
            <select id="round" bind:value={roundName}>
                {#each roundOptions as r}
                    <option value={r}>{r}</option>
                {/each}
            </select>
            {#if showCustomRound}
                <input type="text" bind:value={customRoundName} placeholder="Round name" class="mt-2" />
            {/if}
        </div>

        {#if isResultMode}
            <!-- RESULT MODE -->
            <div class="result-mode-content">
                <div class="form-group">
                    <label for="position">Final Position</label>
                    <input type="number" id="position" bind:value={finalPosition} placeholder="#" class="large-input" />
                </div>
            </div>
        {:else}
            <!-- STANDARD MODE -->
            <div class="load-metrics-compact">
                <div class="metric">
                    <label for="finger">Finger Load</label>
                    <input type="number" id="finger" bind:value={fingerLoad} min="0" max="5" step="0.5" />
                </div>
                <div class="metric">
                    <label for="shoulder">Shoulder Load</label>
                    <input type="number" id="shoulder" bind:value={shoulderLoad} min="0" max="5" step="0.5" />
                </div>
                <div class="metric">
                    <label for="forearm">Forearm Load</label>
                    <input type="number" id="forearm" bind:value={forearmLoad} min="0" max="5" step="0.5" />
                </div>
            </div>

            <div class="climbs-table-container">
                <div class="section-header">
                    <h4>Boulders / Routes</h4>
                </div>
                
                <table class="climbs-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Result</th>
                            <th>Att.</th>
                            <th>Notes</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each climbs as climb, i}
                            <tr>
                                <td class="col-name">
                                    <input type="text" bind:value={climb.name} />
                                </td>
                                <td class="col-status">
                                    <select 
                                        value={climb.status} 
                                        onchange={(e) => handleStatusChange(i, (e.target as HTMLSelectElement).value)}
                                    >
                                        {#each resultStatuses as s}
                                            <option value={s}>{s}</option>
                                        {/each}
                                    </select>
                                </td>
                                <td class="col-attempt">
                                    {#if climb.status !== 'Flash'}
                                        <input type="number" bind:value={climb.attemptCount} min="1" />
                                    {:else}
                                        <span class="flash-dash">-</span>
                                    {/if}
                                </td>
                                <td class="col-notes">
                                    <input type="text" bind:value={climb.notes} placeholder="..." />
                                </td>
                                <td class="col-action">
                                    <button onclick={() => removeClimbRow(i)}>✕</button>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
                <button class="add-row-btn" onclick={addClimbRow}>+ Add Row</button>
            </div>
        {/if}
    </div>

    <div class="submit-section">
		{#if saveMessage}
			<div class="save-message" class:success={saveStatus === 'success'} class:error={saveStatus === 'error'}>
				{saveMessage}
			</div>
		{/if}
		<button 
			type="button" 
			class="submit-btn" 
			onclick={saveSession}
			disabled={saveStatus === 'saving'}
		>
			{#if saveStatus === 'saving'}
				Saving...
			{:else if saveStatus === 'success'}
				✓ Saved!
			{:else}
				Save Session
			{/if}
		</button>
	</div>
</div>

<style>
    .form-content { animation: slideIn 0.2s ease; }
    @keyframes slideIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
    
    h3 { margin: 0 0 1.5rem 0; color: var(--teal-secondary); font-size: 1.25rem; }
    h4 { margin: 0; font-size: 1rem; color: var(--text-primary); }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.4rem; }
    .form-group label { font-size: 0.85rem; font-weight: 500; color: var(--text-secondary); }
    
    input, select {
        padding: 0.6rem;
        border: 1px solid rgba(74, 155, 155, 0.3);
        border-radius: 8px;
        font-size: 0.95rem;
        width: 100%;
        box-sizing: border-box;
    }

    .mt-2 { margin-top: 0.5rem; }
    .mb-4 { margin-bottom: 1rem; }

    .round-section {
        background: #f8f9fa;
        border-radius: 12px;
        padding: 1rem;
        margin-bottom: 1.5rem;
        border: 1px solid #e9ecef;
    }

    .load-metrics-compact {
        display: flex;
        gap: 1rem;
        margin: 1rem 0;
        padding: 0.75rem;
        background: white;
        border-radius: 8px;
        justify-content: space-around;
        border: 1px solid #eee;
    }

    .metric { text-align: center; }
    .metric input { width: 60px; text-align: center; font-weight: 600; color: var(--teal-secondary); }

    .climbs-table-container { margin-top: 1rem; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
    
    .climbs-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
    .climbs-table th { text-align: left; color: var(--text-secondary); font-weight: 500; padding: 0.5rem; border-bottom: 1px solid #ddd; }
    .climbs-table td { padding: 0.25rem; }
    
    .col-name input { width: 50px; text-align: center; }
    .col-attempt input { width: 50px; text-align: center; }
    .col-status select { min-width: 90px; }
    .col-action button { background: none; border: none; color: #d9534f; cursor: pointer; padding: 0.5rem; }
    
    .add-row-btn {
        width: 100%;
        margin-top: 0.5rem;
        padding: 0.5rem;
        background: white;
        border: 1px dashed #aaa;
        color: var(--text-secondary);
        border-radius: 6px;
        cursor: pointer;
    }

    .result-mode-content {
        margin-top: 1.5rem;
        text-align: center;
    }

    .large-input {
        font-size: 2rem !important;
        width: 100px !important;
        text-align: center;
        padding: 1rem !important;
        margin: 0 auto;
        display: block;
        border-color: var(--gold-primary) !important;
        color: var(--teal-secondary);
        font-weight: 700;
    }

    .submit-btn {
		width: 100%;
		padding: 1rem;
		background: linear-gradient(135deg, var(--teal-primary) 0%, var(--teal-secondary) 100%);
		color: white;
		border: none;
		border-radius: 12px;
		font-weight: 600;
		font-size: 1.1rem;
		cursor: pointer;
		margin-top: 1rem;
		box-shadow: 0 4px 12px rgba(74, 155, 155, 0.3);
	}
    
    .submit-btn:disabled { opacity: 0.7; }
    
    .save-message {
		text-align: center;
		padding: 0.5rem;
		margin-bottom: 0.5rem;
		border-radius: 6px;
		font-size: 0.9rem;
	}

	.save-message.success { background: #d4edda; color: #155724; }
	.save-message.error { background: #f8d7da; color: #721c24; }
</style>
