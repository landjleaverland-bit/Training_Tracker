<script>
    import { fade } from "svelte/transition";
    import IndoorClimb from "./log/IndoorClimb.svelte";
    import GymSession from "./log/GymSession.svelte";
    import OutdoorClimb from "./log/OutdoorClimb.svelte";
    import OtherLog from "./log/OtherLog.svelte";

    let selectedId = "";

    const options = [
        { id: "indoor", text: "Indoor Climb", component: IndoorClimb },
        { id: "gym", text: "Gym Session", component: GymSession },
        { id: "outdoor", text: "Outdoor Climb", component: OutdoorClimb },
        { id: "other", text: "Other", component: OtherLog },
    ];

    $: selectedOption = options.find((o) => o.id === selectedId);
</script>

<div class="tab-content">
    <h2>Log Exercise</h2>
    <div class="dropdown-wrapper">
        <label for="exercise-type">What did you do today?</label>
        <select id="exercise-type" bind:value={selectedId}>
            <option value="" disabled selected>Select activity type...</option>
            {#each options as option}
                <option value={option.id}>
                    {option.text}
                </option>
            {/each}
        </select>
    </div>

    {#if selectedOption}
        <div class="config-wrapper" in:fade>
            <svelte:component this={selectedOption.component} />

            <button
                class="save-button"
                on:click={() => alert("Log saved! (Coming soon)")}
            >
                Save Log
            </button>
        </div>
    {/if}
</div>

<style>
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
        background: rgba(15, 23, 42, 0.6);
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

    select:hover {
        border-color: #60a5fa;
        background: rgba(15, 23, 42, 0.8);
    }

    select:focus {
        border-color: #60a5fa;
        box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.3);
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
