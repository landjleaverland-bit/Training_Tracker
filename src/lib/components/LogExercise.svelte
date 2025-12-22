<script>
    import { fade } from "svelte/transition";
    let selected = "";
    const options = [
        { id: "1", text: "Option 1" },
        { id: "2", text: "Option 2" },
        { id: "3", text: "Option 3" },
    ];
</script>

<div class="tab-content">
    <h2>Log Exercise</h2>
    <div class="dropdown-wrapper">
        <label for="main-dropdown">Select an option:</label>
        <select id="main-dropdown" bind:value={selected}>
            <option value="" disabled selected>Choose wisely...</option>
            {#each options as option}
                <option value={option.id}>
                    {option.text}
                </option>
            {/each}
        </select>
    </div>

    {#if selected}
        <div class="result-card" in:fade>
            <p>
                You selected: <strong
                    >{options.find((o) => o.id === selected)?.text}</strong
                >
            </p>
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

    .result-card {
        background: rgba(96, 165, 250, 0.1);
        border-radius: 0.75rem;
        padding: 1rem;
        border: 1px solid rgba(96, 165, 250, 0.2);
        animation: slideUp 0.3s ease-out;
    }

    p {
        margin: 0;
        color: #e2e8f0;
    }

    strong {
        color: #60a5fa;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
</style>
