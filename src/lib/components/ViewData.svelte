<script>
    import { fade } from "svelte/transition";
    import { apiKey } from "$lib/stores/auth";
    import { get } from "svelte/store";
    import { onMount } from "svelte";

    let selectedType = "indoor";
    let isLoading = false;
    /** @type {any[]} */
    let data = [];
    let error = "";

    // Filter states
    let showFilters = false;
    let startDate = "";
    let endDate = "";
    let filterLocation = "";
    let filterSession = "";
    let filterGrade = "";

    const activityTypes = [
        { id: "indoor", label: "Indoor Climb" },
        { id: "fingerboard", label: "Fingerboarding" },
        { id: "gym", label: "Gym Session" },
        { id: "outdoor", label: "Outdoor Climb" },
        { id: "other", label: "Other" },
    ];

    const locationOptions = [
        "Flashpoint Swindon",
        "Rockstar",
        "Flashpoint Bristol",
    ];
    const sessionOptions = ["Strength", "Endurance", "Power", "Recovery"];

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

            // Build query parameters
            const params = new URLSearchParams({
                type: selectedType,
            });

            if (startDate) params.append("startDate", startDate);
            if (endDate) params.append("endDate", endDate);
            if (filterLocation) params.append("location", filterLocation);
            if (filterSession) params.append("session", filterSession);
            if (filterGrade) params.append("grade", filterGrade);

            const response = await fetch(
                `${API_BASE_URL}?${params.toString()}`,
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

    function clearFilters() {
        startDate = "";
        endDate = "";
        filterLocation = "";
        filterSession = "";
        filterGrade = "";
        fetchData();
    }

    // Initial fetch
    onMount(() => {
        fetchData();
    });

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
        <div class="header-actions">
            <button
                class="fetch-btn"
                on:click={fetchData}
                disabled={isLoading}
                title="Fetch latest data"
            >
                {#if isLoading}
                    <div class="spinner-small"></div>
                {:else}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        ><path
                            d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"
                        /><path d="M21 3v5h-5" /></svg
                    >
                {/if}
                Fetch Data
            </button>
            <button
                class="filter-toggle"
                on:click={() => (showFilters = !showFilters)}
                class:active={showFilters}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    ><polygon
                        points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"
                    ></polygon></svg
                >
                Filters
            </button>
            <select bind:value={selectedType} class="type-select">
                {#each activityTypes as type}
                    <option value={type.id}>{type.label}</option>
                {/each}
            </select>
        </div>
    </div>

    {#if showFilters}
        <div class="filters-panel" transition:fade>
            <div class="filter-row">
                <div class="filter-group">
                    <label for="startDate">Start Date</label>
                    <input id="startDate" type="date" bind:value={startDate} />
                </div>
                <div class="filter-group">
                    <label for="endDate">End Date</label>
                    <input id="endDate" type="date" bind:value={endDate} />
                </div>
                <div class="filter-group">
                    <label for="filterLocation">Location</label>
                    <select id="filterLocation" bind:value={filterLocation}>
                        <option value="">Any Location</option>
                        {#each locationOptions as loc}
                            <option value={loc}>{loc}</option>
                        {/each}
                    </select>
                </div>
            </div>
            <div class="filter-row">
                <div class="filter-group">
                    <label for="filterSession">Session</label>
                    <select id="filterSession" bind:value={filterSession}>
                        <option value="">Any Session</option>
                        {#each sessionOptions as sess}
                            <option value={sess}>{sess}</option>
                        {/each}
                    </select>
                </div>
                <div class="filter-group">
                    <label for="filterGrade">Grade (Exact)</label>
                    <input
                        id="filterGrade"
                        type="text"
                        bind:value={filterGrade}
                        placeholder="e.g. 7a+"
                    />
                </div>
                <div class="filter-actions">
                    <button class="clear-btn" on:click={clearFilters}
                        >Clear</button
                    >
                    <button class="apply-btn" on:click={fetchData}>Apply</button
                    >
                </div>
            </div>
        </div>
    {/if}

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
        margin-bottom: 1.5rem;
    }

    .header-actions {
        display: flex;
        gap: 0.75rem;
        align-items: center;
    }

    .fetch-btn {
        background: #60a5fa;
        color: #0f172a;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 0.75rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9rem;
        font-weight: 600;
        transition: all 0.2s ease;
    }

    .fetch-btn:hover:not(:disabled) {
        background: #93c5fd;
        transform: translateY(-1px);
    }

    .fetch-btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    .spinner-small {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(15, 23, 42, 0.2);
        border-top-color: #0f172a;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    .filter-toggle {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #94a3b8;
        padding: 0.5rem 1rem;
        border-radius: 0.75rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9rem;
        transition: all 0.2s ease;
    }

    .filter-toggle:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #f8fafc;
    }

    .filter-toggle.active {
        background: rgba(96, 165, 250, 0.2);
        border-color: rgba(96, 165, 250, 0.4);
        color: #60a5fa;
    }

    .filters-panel {
        background: rgba(15, 23, 42, 0.4);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 1rem;
        padding: 1.5rem;
        margin-bottom: 2rem;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
    }

    .filter-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1.5rem;
        align-items: flex-end;
    }

    .filter-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .filter-group label {
        font-size: 0.75rem;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-weight: 600;
    }

    .filter-group input,
    .filter-group select {
        background: rgba(15, 23, 42, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 0.5rem;
        padding: 0.5rem 0.75rem;
        color: #f8fafc;
        font-size: 0.9rem;
    }

    .filter-group select option {
        background: #1e293b;
        color: #f8fafc;
    }

    .filter-actions {
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
    }

    .clear-btn {
        background: transparent;
        border: 1px solid rgba(239, 68, 68, 0.2);
        color: #f87171;
        padding: 0.5rem 1.25rem;
        border-radius: 0.5rem;
        cursor: pointer;
        font-size: 0.9rem;
    }

    .apply-btn {
        background: #60a5fa;
        color: #0f172a;
        border: none;
        padding: 0.5rem 1.25rem;
        border-radius: 0.5rem;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: 600;
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
