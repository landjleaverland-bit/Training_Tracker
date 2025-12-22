<script>
    import { fade } from "svelte/transition";
    import { apiKey } from "$lib/stores/auth";
    import { get } from "svelte/store";

    let selectedType = "indoor";
    let isLoading = false;
    /** @type {any[]} */
    let data = [];
    let error = "";

    const activityTypes = [
        { id: "indoor", label: "Indoor Climb" },
        { id: "fingerboard", label: "Fingerboarding" },
        { id: "gym", label: "Gym Session" },
        { id: "outdoor", label: "Outdoor Climb" },
        { id: "other", label: "Other" },
    ];

    // REPLACE WITH YOUR ACTUAL DEPLOYED CLOUD FUNCTION URL
    // Make sure this matches your saveLog base URL but ends in /getLogs
    const API_BASE_URL = "https://get-log-825153765638.europe-west1.run.app";

    async function fetchData() {
        if (!selectedType) return;

        isLoading = true;
        error = "";
        data = [];

        try {
            const token = get(apiKey);
            const response = await fetch(
                `${API_BASE_URL}/getLogs?type=${selectedType}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Failed to fetch data");
            }

            data = await response.json();
        } catch (/** @type {any} */ err) {
            console.error("Fetch Error:", err);
            error = err.message || "An unknown error occurred";
        } finally {
            isLoading = false;
        }
    }

    // Fetch data when type changes
    $: if (selectedType) {
        fetchData();
    }

    function formatDate(/** @type {any} */ dateStr) {
        if (!dateStr) return "-";
        const date = new Date(dateStr.value || dateStr);
        return date.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "2-digit",
        });
    }

    function getColumns(/** @type {string} */ type) {
        // Define columns based on activity type
        switch (type) {
            case "indoor":
                return [
                    { key: "date", label: "Date" },
                    { key: "location", label: "Location" },
                    { key: "session_type", label: "Session" },
                    { key: "climbs", label: "Data", isObject: true },
                ];
            case "fingerboard":
                return [
                    { key: "date", label: "Date" },
                    { key: "location", label: "Location" },
                    { key: "session_type", label: "Type" },
                    { key: "climbs", label: "Hang", isObject: true },
                ];
            default:
                return [
                    { key: "date", label: "Date" },
                    { key: "location", label: "Location" },
                    { key: "session_type", label: "Type" },
                ];
        }
    }

    $: columns = getColumns(selectedType);
</script>

<div class="view-container">
    <div class="header-row">
        <h2>View Data</h2>
        <select bind:value={selectedType} class="type-select">
            {#each activityTypes as type}
                <option value={type.id}>{type.label}</option>
            {/each}
        </select>
    </div>

    {#if isLoading}
        <div class="status-msg" in:fade>
            <div class="spinner"></div>
            Loading your training history...
        </div>
    {:else if error}
        <div class="status-msg error" in:fade>
            <p>Error: {error}</p>
            <button on:click={fetchData} class="retry-btn">Retry</button>
        </div>
    {:else if data.length === 0}
        <div class="placeholder" in:fade>
            <p>No data found for this activity.</p>
            <div class="empty-state">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    ><path
                        d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
                    /><path
                        d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z"
                    /><path d="M12 11h4" /><path d="M12 16h4" /><path
                        d="M8 11h.01"
                    /><path d="M8 16h.01" /></svg
                >
            </div>
        </div>
    {:else}
        <div class="table-card" in:fade>
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            {#each columns as col}
                                <th>{col.label}</th>
                            {/each}
                        </tr>
                    </thead>
                    <tbody>
                        {#each data as row}
                            <tr>
                                {#each columns as col}
                                    <td>
                                        {#if col.key === "date"}
                                            {formatDate(row[col.key])}
                                        {:else if col.isObject}
                                            <!-- Simple summary of recursive data -->
                                            <span class="brief">
                                                {row[col.key].route ||
                                                    row[col.key].name ||
                                                    "-"}
                                                ({row[col.key].grade ||
                                                    row[col.key].weight +
                                                        "kg" ||
                                                    "-"})
                                            </span>
                                        {:else}
                                            {row[col.key] || "-"}
                                        {/if}
                                    </td>
                                {/each}
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>
    {/if}
</div>

<style>
    .view-container {
        animation: fadeIn 0.3s ease-out;
    }

    .header-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
    }

    h2 {
        font-size: 1.5rem;
        margin: 0;
        color: #f8fafc;
    }

    .type-select {
        background: rgba(15, 23, 42, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 0.75rem;
        padding: 0.5rem 1rem;
        color: #f8fafc;
        font-size: 0.9rem;
        cursor: pointer;
    }

    .status-msg {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        padding: 4rem 2rem;
        color: #94a3b8;
    }

    .status-msg.error {
        color: #f87171;
    }

    .retry-btn {
        background: rgba(96, 165, 250, 0.1);
        color: #60a5fa;
        border: 1px solid rgba(96, 165, 250, 0.2);
        padding: 0.5rem 1.5rem;
        border-radius: 0.5rem;
        cursor: pointer;
    }

    .placeholder {
        background: rgba(15, 23, 42, 0.4);
        padding: 3rem;
        border-radius: 1.5rem;
        border: 2px dashed rgba(255, 255, 255, 0.1);
        text-align: center;
    }

    .table-card {
        background: rgba(15, 23, 42, 0.4);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 1rem;
        overflow: hidden;
    }

    .table-wrapper {
        overflow-x: auto;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
    }

    th {
        padding: 1rem;
        background: rgba(255, 255, 255, 0.03);
        font-size: 0.75rem;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    td {
        padding: 1rem;
        font-size: 0.9rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .brief {
        color: #e2e8f0;
        font-size: 0.85rem;
    }

    .spinner {
        width: 32px;
        height: 32px;
        border: 3px solid rgba(96, 165, 250, 0.2);
        border-top-color: #60a5fa;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    @media (max-width: 640px) {
        th,
        td {
            padding: 0.75rem;
            font-size: 0.8rem;
        }
    }
</style>
