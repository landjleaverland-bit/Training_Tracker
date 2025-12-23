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
    import { addLog } from "$lib/stores/history";
    import { get } from "svelte/store";

    /** @type {any} */
    let activeComponent;
    let isSaving = false;
    let saveMessage = "";
    let saveSuccess = false;
    // Format current date for datetime-local input (YYYY-MM-DDTHH:mm)
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    let logDate = new Date(now - offset).toISOString().slice(0, 16);

    // REPLACE WITH YOUR ACTUAL DEPLOYED CLOUD FUNCTION URL
    const API_URL = "https://save-log-825153765638.europe-west1.run.app";

    $: selectedOption = options.find((o) => o.id === selectedId);

    // Clear message when switching tabs
    $: if (selectedId) {
        saveMessage = "";
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
            (data.exercises && data.exercises.length === 0)
        ) {
            saveMessage =
                "Please select a Location, Session, and add at least one exercise.";
            saveSuccess = false;
            return;
        }

        if (!currentToken) {
            saveMessage = "Authentication error. Please log in again.";
            saveSuccess = false;
            return;
        }

        isSaving = true;
        saveMessage = "";

        try {
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
            };

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
            addLog(selectedId, payload);

            // Optional: Data reset logic could go here
        } catch (error) {
            console.error("Save Error:", error);
            saveMessage = "Failed to save log. Check console for details.";
            saveSuccess = false;
        } finally {
            isSaving = false;
        }
    }
</script>

<div class="tab-content">
    <h2>Log Exercise</h2>
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
        margin-bottom: 1.5rem;
        color: #f8fafc;
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
