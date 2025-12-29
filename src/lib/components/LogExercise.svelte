<!-- @context-ref: docs/GEMINI_CONTEXT.md - Sync Orchestration Logic. Consult context for offline/sync contracts. -->
<script>
    import { fade } from "svelte/transition";
    import IndoorClimb from "./log/IndoorClimb.svelte";
    import OutdoorClimb from "./log/OutdoorClimb.svelte";
    import Fingerboarding from "./log/Fingerboarding.svelte";
    import Competition from "./log/Competition.svelte";

    let selectedId = "";

    const options = [
        { id: "indoor", text: "Indoor Climb", component: IndoorClimb },
        {
            id: "fingerboard",
            text: "Fingerboarding",
            component: Fingerboarding,
        },
        { id: "outdoor", text: "Outdoor Climb", component: OutdoorClimb },
        { id: "competition", text: "Competition", component: Competition },
    ];

    import { apiKey } from "$lib/stores/auth";
    import { addLog, historyStore, markLogAsSynced } from "$lib/stores/history";
    import { get } from "svelte/store";
    import { onMount, onDestroy } from "svelte";

    /** @type {any} */
    let activeComponent;
    let isSaving = false;
    let isSyncing = false;
    let saveMessage = "";
    let saveSuccess = false;
    // Format current date for datetime-local input (YYYY-MM-DDTHH:mm)
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    let logDate = new Date(now.getTime() - offset).toISOString().slice(0, 16);

    // REPLACE WITH YOUR ACTUAL DEPLOYED CLOUD FUNCTION URL
    const API_URL = "https://save-log-825153765638.europe-west1.run.app";

    $: selectedOption = options.find((o) => o.id === selectedId);

    // Count pending logs across all types
    $: pendingLogsCount = Object.values($historyStore)
        .flat()
        .filter((l) => l.synced === false).length;

    // Clear message when switching tabs
    $: if (selectedId) {
        saveMessage = "";
    }

    onMount(() => {
        // Auto-sync on load
        if (pendingLogsCount > 0) {
            syncOfflineLogs();
        }

        // Auto-sync when coming back online
        const handleOnline = () => {
            console.log("Network restored, attempting sync...");
            syncOfflineLogs();
        };

        window.addEventListener("online", handleOnline);

        return () => {
            window.removeEventListener("online", handleOnline);
        };
    });

    async function syncOfflineLogs() {
        if (pendingLogsCount === 0) return;

        isSyncing = true;
        saveMessage = "Syncing offline logs...";
        saveSuccess = true; // Neutral/Info color

        const currentToken = get(apiKey);
        if (!currentToken) {
            saveMessage = "Authentication error. Please log in first.";
            saveSuccess = false;
            isSyncing = false;
            return;
        }

        let successCount = 0;
        let failCount = 0;

        try {
            const store = get(historyStore);
            // Iterate over all types and their logs
            for (const [type, logs] of Object.entries(store)) {
                // Find pending logs for this type
                const pendingForType = logs.filter(
                    (/** @type {any} */ l) => l.synced === false,
                );

                for (const log of pendingForType) {
                    try {
                        // Create payload WITHOUT 'synced' property
                        const { synced, ...payload } = log;

                        const response = await fetch(API_URL, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${currentToken}`,
                            },
                            body: JSON.stringify(payload),
                        });

                        if (!response.ok) {
                            throw new Error(`Failed to sync log`);
                        }

                        // Mark as synced locally
                        markLogAsSynced(type, log, true);
                        successCount++;
                    } catch (e) {
                        console.error("Sync error for log:", log, e);
                        failCount++;
                    }
                }
            }

            if (failCount === 0) {
                saveMessage = `Successfully synced ${successCount} logs!`;
                saveSuccess = true;
            } else {
                saveMessage = `Synced ${successCount} logs. Failed to sync ${failCount} logs.`;
                saveSuccess = false;
            }
        } catch (error) {
            console.error("Global sync error:", error);
            saveMessage = "Error during sync.";
            saveSuccess = false;
        } finally {
            isSyncing = false;
        }
    }

    async function submitToBigQuery() {
        if (!activeComponent || !activeComponent.getData) {
            console.error("Component does not support data export");
            return;
        }

        const data = activeComponent.getData();
        const currentToken = get(apiKey);

        // Basic Validation
        if (
            !data.location ||
            (selectedId !== "indoor" && !data.session) ||
            (!data.isResultOnly &&
                data.exercises &&
                data.exercises.length === 0)
        ) {
            saveMessage =
                "Please select a Location, Session, and add at least one exercise.";
            saveSuccess = false;
            return;
        }

        // Prepare payload for BigQuery
        const payload = {
            activity_type: selectedId,
            location: data.location,
            session_type: data.session,
            finger_load: data.fingerLoad || 0,
            shoulder_load: data.shoulderLoad || 0,
            forearm_load: data.forearmLoad || 0,
            training: data.training || null,
            climbs: data.exercises,
            date: new Date(logDate).toISOString(),
            round: data.round || null,
            position: data.position || null,
            isResultOnly: data.isResultOnly || false,
        };

        // If no token, we are definitely offline/unauth, so save locally immediately
        if (!currentToken) {
            addLog(selectedId, { ...payload, synced: false });
            saveMessage = "Saved offline (Not logged in). Sync later.";
            saveSuccess = true; // Still a "success" in that data isn't lost
            return;
        }

        isSaving = true;
        saveMessage = "";

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${currentToken}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(
                    `Server error (${response.status}): ${errorText}`,
                );
            }

            saveMessage = "Log saved successfully!";
            saveSuccess = true;

            // Add to local cache immediately
            addLog(selectedId, { ...payload, synced: true });

            // Optional: Data reset logic could go here
        } catch (error) {
            console.error("Save Error:", error);
            // Fallback: Save offline
            addLog(selectedId, { ...payload, synced: false });

            saveMessage = "Network error. Saved offline. Please Sync later.";
            saveSuccess = true;
        } finally {
            isSaving = false;
        }
    }
</script>

<div class="tab-content">
    <div class="header-row">
        <h2>Log Exercise</h2>
        {#if pendingLogsCount > 0}
            <button
                class="sync-button"
                on:click={syncOfflineLogs}
                disabled={isSyncing}
            >
                {#if isSyncing}
                    Syncing...
                {:else}
                    Sync ({pendingLogsCount})
                {/if}
            </button>
        {/if}
    </div>
    <div class="header-inputs">
        <div class="dropdown-wrapper">
            <label for="log-date">When did you do this?</label>
            <input
                type="datetime-local"
                id="log-date"
                bind:value={logDate}
                class="date-input"
            />
        </div>

        <div class="dropdown-wrapper">
            <label for="exercise-type">What did you do today?</label>
            <select id="exercise-type" bind:value={selectedId}>
                <option value="" disabled selected
                    >Select activity type...</option
                >
                {#each options as option}
                    <option value={option.id}>
                        {option.text}
                    </option>
                {/each}
            </select>
        </div>
    </div>

    {#if selectedOption}
        <div class="config-wrapper" in:fade>
            <svelte:component
                this={selectedOption.component}
                bind:this={activeComponent}
            />

            {#if saveMessage}
                <div
                    class="message"
                    class:success={saveSuccess}
                    class:error={!saveSuccess}
                    transition:fade
                >
                    {saveMessage}
                </div>
            {/if}

            <button
                class="save-button"
                on:click={submitToBigQuery}
                disabled={isSaving}
            >
                {isSaving ? "Saving..." : "Save Log"}
            </button>
        </div>
    {/if}
</div>

<style>
    .message {
        padding: 0.75rem;
        border-radius: 0.5rem;
        font-size: 0.9rem;
        text-align: center;
        margin-top: 0.5rem;
    }
    .message.success {
        background: rgba(34, 197, 94, 0.2);
        color: #4ade80;
        border: 1px solid rgba(34, 197, 94, 0.3);
    }
    .message.error {
        background: rgba(239, 68, 68, 0.2);
        color: #f87171;
        border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .tab-content {
        animation: fadeIn 0.3s ease-out;
    }

    h2 {
        font-size: 1.5rem;
        margin-bottom: 0; /* Remove bottom margin as it's now in header-row */
        color: #f8fafc;
    }

    .header-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }

    .sync-button {
        background: rgba(234, 179, 8, 0.2);
        color: #facc15;
        border: 1px solid rgba(234, 179, 8, 0.3);
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .sync-button:hover {
        background: rgba(234, 179, 8, 0.3);
        transform: translateY(-1px);
    }

    .sync-button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    .dropdown-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        text-align: left;
        margin-bottom: 2rem;
    }

    label {
        font-size: 0.875rem;
        color: #94a3b8;
        font-weight: 500;
    }

    select {
        appearance: none;
        background: #0f172a;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 0.75rem;
        padding: 0.75rem 1rem;
        color: #f8fafc;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.2s ease;
        outline: none;
        width: 100%;
    }

    select option {
        background: #0f172a;
        color: #f8fafc;
    }

    select:hover {
        border-color: #60a5fa;
        background: #1e293b;
    }

    select:focus {
        border-color: #60a5fa;
        box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.3);
    }

    .header-inputs {
        display: grid;
        grid-template-columns: 1fr 1.5fr;
        gap: 1.5rem;
        margin-bottom: 2rem;
    }

    .date-input {
        background: #0f172a;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 0.75rem;
        padding: 0.75rem 1rem;
        color: #f8fafc;
        font-size: 1rem;
        cursor: pointer;
        width: 100%;
        color-scheme: dark;
        transition: all 0.2s ease;
    }

    .date-input:hover {
        border-color: #60a5fa;
        background: #1e293b;
    }

    .date-input:focus {
        border-color: #60a5fa;
        outline: none;
        box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.3);
    }

    @media (max-width: 600px) {
        .header-inputs {
            grid-template-columns: 1fr;
            gap: 1rem;
        }
    }

    .config-wrapper {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .save-button {
        background: linear-gradient(to right, #60a5fa, #a78bfa);
        color: white;
        border: none;
        padding: 0.875rem;
        border-radius: 0.75rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s ease;
        margin-top: 1rem;
    }

    .save-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(96, 165, 250, 0.3);
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
</style>
