<script>
    import { fade, slide } from "svelte/transition";
    import { apiKey } from "$lib/stores/auth";
    import { historyStore, syncLogs } from "$lib/stores/history";
    import { get } from "svelte/store";
    import { onMount } from "svelte";
    import { areaOptions, areaCragMap } from "$lib/data/climbingAreas.js";

    let selectedType = "indoor";
    let isLoading = false;
    let error = "";

    // Reactively get data from store
    $: allDataForType = $historyStore[selectedType] || [];
    let expandedSessions = new Set();

    /** @param {string} key */
    function toggleSession(key) {
        if (expandedSessions.has(key)) {
            expandedSessions.delete(key);
        } else {
            expandedSessions.add(key);
        }
        expandedSessions = expandedSessions; // trigger reactivity
    }

    /**
     * @param {any[]} rows
     * @param {string} sDate
     * @param {string} eDate
     * @param {string} loc
     * @param {string} sess
     * @param {string} grd
     */
    function filterAndGroupData(rows, sDate, eDate, loc, sess, grd) {
        // 1. Filter locally
        const filtered = rows.filter((row) => {
            if (
                sDate &&
                new Date(row.date?.value || row.date) < new Date(sDate)
            )
                return false;
            // Add one day to endDate to make it inclusive
            if (eDate) {
                const end = new Date(eDate);
                end.setHours(23, 59, 59, 999);
                if (new Date(row.date?.value || row.date) > end) return false;
            }
            if (loc) {
                const rowLoc =
                    typeof row.location === "string" ? row.location : "";
                if (!rowLoc.toLowerCase().includes(loc.toLowerCase()))
                    return false;
            }
            if (sess && row.session_type !== sess) return false;
            if (grd && row.climbs?.grade !== grd) return false;
            return true;
        });

        // 2. Group by session
        /** @type {Object.<string, any>} */
        const groups = {};
        filtered.forEach((row) => {
            const d = row.date?.value || row.date;
            const dateStr = new Date(d).toISOString().split("T")[0];
            const key = `${dateStr}|${row.location}|${row.session_type}`;

            if (!groups[key]) {
                groups[key] = {
                    key,
                    date: row.date,
                    location: row.location,
                    session: row.session_type,
                    fingerLoad: 0,
                    shoulderLoad: 0,
                    forearmLoad: 0,
                    items: [],
                };
            }

            // Take max load for the session
            groups[key].fingerLoad = Math.max(
                groups[key].fingerLoad,
                row.finger_load || 0,
            );
            groups[key].shoulderLoad = Math.max(
                groups[key].shoulderLoad,
                row.shoulder_load || 0,
            );
            groups[key].forearmLoad = Math.max(
                groups[key].forearmLoad,
                row.forearm_load || 0,
            );
            groups[key].items.push(row.climbs);
        });

        return Object.values(groups).sort((a, b) => {
            const dA = new Date(a.date.value || a.date);
            const dB = new Date(b.date.value || b.date);
            return dB.getTime() - dA.getTime();
        });
    }

    $: groupedSessions = filterAndGroupData(
        allDataForType,
        appliedFilters.startDate,
        appliedFilters.endDate,
        appliedFilters.location,
        appliedFilters.session,
        appliedFilters.grade,
    );

    // Filter states
    let showFilters = false;
    let startDate = "";
    let endDate = "";
    let filterLocation = "";
    let filterArea = "";
    let customFilterArea = "";
    let filterCrag = "";
    let customFilterCrag = "";
    let filterSession = "";
    let filterGrade = "";

    // Filters that are actually applied to the view
    let appliedFilters = {
        startDate: "",
        endDate: "",
        location: "",
        session: "",
        grade: "",
    };

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

    $: cragsForFilter = areaCragMap[filterArea] || [];

    $: {
        if (selectedType === "outdoor") {
            let locParts = [];
            const areaToUse =
                filterArea === "Other" ? customFilterArea : filterArea;
            const cragToUse =
                filterCrag === "Other" ? customFilterCrag : filterCrag;

            if (cragToUse) {
                filterLocation = cragToUse;
            } else if (areaToUse) {
                filterLocation = areaToUse;
            } else {
                filterLocation = "";
            }
        }
    }

    async function fetchData() {
        if (!selectedType) return;

        isLoading = true;
        error = "";

        try {
            const token = get(apiKey);

            // Fetch the latest 100 entries (unfiltered on server to allow local persistence)
            const params = new URLSearchParams({
                type: selectedType,
            });

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

            const freshData = await response.json();

            // Sync with local store (merges and avoids duplicates)
            syncLogs(selectedType, freshData);
        } catch (/** @type {any} */ err) {
            console.error("Fetch Error:", err);
            error = err.message || "An unknown error occurred";
        } finally {
            isLoading = false;
        }
    }

    function applyFilters() {
        appliedFilters = {
            startDate,
            endDate,
            location: filterLocation,
            session: filterSession,
            grade: filterGrade,
        };
        showFilters = false;
    }

    function clearFilters() {
        startDate = "";
        endDate = "";
        filterLocation = "";
        filterSession = "";
        filterGrade = "";
        applyFilters(); // Apply the cleared state
    }

    function exportToCSV() {
        if (!allDataForType || allDataForType.length === 0) return;

        // Base keys that are common to all rows
        const baseKeys = [
            "date",
            "location",
            "session_type",
            "finger_load",
            "shoulder_load",
            "forearm_load",
        ];

        // Find all unique keys within the 'climbs' struct across all data rows
        const climbKeys = new Set();
        allDataForType.forEach((/** @type {any} */ row) => {
            if (row.climbs) {
                Object.keys(row.climbs).forEach((k) => climbKeys.add(k));
            }
        });
        const climbKeyList = Array.from(climbKeys);

        // Combine for full header list
        const headers = [...baseKeys, ...climbKeyList];
        const csvRows = [];

        // Add headers
        csvRows.push(headers.join(","));

        // Add data rows
        allDataForType.forEach((/** @type {any} */ row) => {
            const values = headers.map((header) => {
                let val;
                if (baseKeys.includes(header)) {
                    val = row[header];
                } else {
                    val = row.climbs ? row.climbs[header] : "";
                }

                // Handle BigQuery date objects/values
                if (val && typeof val === "object" && val.value)
                    val = val.value;

                // Escape for CSV (quotes and commas)
                const stringVal =
                    val === undefined || val === null ? "" : String(val);
                return `"${stringVal.replace(/"/g, '""')}"`;
            });
            csvRows.push(values.join(","));
        });

        // Create and trigger download
        const csvString = csvRows.join("\n");
        const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute(
            "download",
            `training_data_${selectedType}_${new Date().toISOString().split("T")[0]}.csv`,
        );
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Initial fetch
    onMount(() => {
        // Only fetch on explicit user action (Fetch Data button)
        // as per user request to use cached data by default.
    });

    /** @param {any} dateStr */
    function formatDate(dateStr) {
        if (!dateStr) return "-";
        const date = new Date(dateStr.value || dateStr);
        return date.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "2-digit",
        });
    }

    /** @param {string} type */
    function getColumns(type) {
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
            case "outdoor":
                return [
                    { key: "date", label: "Date" },
                    { key: "location", label: "Location" },
                    { key: "session_type", label: "Type" },
                    { key: "climbs", label: "Routes", isObject: true },
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
                    {#if selectedType === "outdoor"}
                        <div class="outdoor-filters">
                            <select
                                id="filterArea"
                                bind:value={filterArea}
                                on:change={() => {
                                    filterCrag = "";
                                    customFilterArea = "";
                                }}
                            >
                                <option value="">Any Area</option>
                                {#each areaOptions as area}
                                    <option value={area}>{area}</option>
                                {/each}
                            </select>

                            {#if filterArea === "Other"}
                                <div transition:slide|local>
                                    <input
                                        type="text"
                                        placeholder="Enter Area..."
                                        bind:value={customFilterArea}
                                        class="custom-filter-input"
                                    />
                                </div>
                            {/if}

                            <select
                                id="filterCrag"
                                bind:value={filterCrag}
                                disabled={!filterArea}
                                on:change={() => (customFilterCrag = "")}
                            >
                                <option value="">Any Crag</option>
                                {#each cragsForFilter as crag}
                                    <option value={crag}>{crag}</option>
                                {/each}
                                <option value="Other">Other (Custom)</option>
                            </select>

                            {#if filterCrag === "Other"}
                                <div transition:slide|local>
                                    <input
                                        type="text"
                                        placeholder="Enter Crag..."
                                        bind:value={customFilterCrag}
                                        class="custom-filter-input"
                                    />
                                </div>
                            {/if}
                        </div>
                    {:else}
                        <select id="filterLocation" bind:value={filterLocation}>
                            <option value="">Any Location</option>
                            {#each locationOptions as loc}
                                <option value={loc}>{loc}</option>
                            {/each}
                        </select>
                    {/if}
                </div>
            </div>
            <div class="filter-row">
                <div class="filter-group">
                    <label for="filterSession">Session / Type</label>
                    {#if selectedType === "outdoor"}
                        <select id="filterSession" bind:value={filterSession}>
                            <option value="">Any Type</option>
                            <option value="Bouldering">Bouldering</option>
                            <option value="Ropes">Ropes</option>
                        </select>
                    {:else}
                        <select id="filterSession" bind:value={filterSession}>
                            <option value="">Any Session</option>
                            {#each sessionOptions as sess}
                                <option value={sess}>{sess}</option>
                            {/each}
                        </select>
                    {/if}
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
                    <button class="apply-btn" on:click={applyFilters}
                        >Apply</button
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
    {:else if allDataForType.length === 0}
        <div class="placeholder" in:fade>
            <p>
                No data cached for this activity. Click "Fetch Data" to sync
                from the server.
            </p>
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
        {#if groupedSessions.length > 0}
            <div class="legend-row" transition:fade>
                <div class="legend-item finger">
                    <span class="dot"></span> Finger
                </div>
                <div class="legend-item shoulder">
                    <span class="dot"></span> Shoulder
                </div>
                <div class="legend-item forearm">
                    <span class="dot"></span> Forearm
                </div>
                <span class="legend-note">(0-5 Scale)</span>
            </div>
        {/if}

        <div class="sessions-list" in:fade>
            {#if groupedSessions.length === 0 && allDataForType.length > 0}
                <div class="no-results">No results match your filters.</div>
            {/if}
            {#each groupedSessions as session (session.key)}
                <div
                    class="session-card"
                    class:expanded={expandedSessions.has(session.key)}
                >
                    <button
                        class="session-header"
                        on:click={() => toggleSession(session.key)}
                    >
                        <div class="session-info">
                            <span class="date">{formatDate(session.date)}</span>
                            <span class="location">{session.location}</span>
                            <span class="tag">{session.session}</span>
                        </div>

                        <div class="load-summary">
                            <div class="load-pill finger">
                                <span class="label">FI</span>
                                <span class="val">{session.fingerLoad}</span>
                            </div>
                            <div class="load-pill shoulder">
                                <span class="label">SH</span>
                                <span class="val">{session.shoulderLoad}</span>
                            </div>
                            <div class="load-pill forearm">
                                <span class="label">FO</span>
                                <span class="val">{session.forearmLoad}</span>
                            </div>
                            <svg
                                class="chevron"
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                ><path d="m6 9 6 6 6-6" /></svg
                            >
                        </div>
                    </button>

                    {#if expandedSessions.has(session.key)}
                        <div class="session-details" transition:slide>
                            <table class="details-table">
                                <thead>
                                    <tr>
                                        {#each columns.filter((c) => c.key !== "date" && c.key !== "location" && c.key !== "session_type") as col}
                                            <th>{col.label}</th>
                                        {/each}
                                    </tr>
                                </thead>
                                <tbody>
                                    {#each session.items as item}
                                        <tr>
                                            {#each columns.filter((c) => c.key !== "date" && c.key !== "location" && c.key !== "session_type") as col}
                                                <td>
                                                    {#if col.isObject}
                                                        <div
                                                            class="exercise-row"
                                                        >
                                                            <span
                                                                class="ex-name"
                                                                >{item.route ||
                                                                    item.name ||
                                                                    "-"}</span
                                                            >
                                                            {#if item.type || item.isRopes !== undefined}
                                                                <span
                                                                    class="ex-meta type"
                                                                >
                                                                    {item.type ||
                                                                        (item.isRopes
                                                                            ? "Sport"
                                                                            : "Bouldering")}
                                                                </span>
                                                            {/if}
                                                            {#if item.grade}
                                                                <span
                                                                    class="ex-meta grade"
                                                                    >{item.grade}</span
                                                                >
                                                            {/if}
                                                            {#if item.attempts}
                                                                <span
                                                                    class="ex-meta attempts"
                                                                    >{item.attempts}</span
                                                                >
                                                            {/if}
                                                            {#if item.weight}
                                                                <span
                                                                    class="ex-meta weight"
                                                                    >{item.weight}kg</span
                                                                >
                                                            {/if}
                                                            {#if item.sets || item.reps}
                                                                <span
                                                                    class="ex-meta sets"
                                                                    >{item.sets}x{item.reps}</span
                                                                >
                                                            {/if}
                                                            {#if item.notes}
                                                                <span
                                                                    class="ex-notes"
                                                                    >{item.notes}</span
                                                                >
                                                            {/if}
                                                        </div>
                                                    {:else}
                                                        {item[col.key] || "-"}
                                                    {/if}
                                                </td>
                                            {/each}
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        </div>
                    {/if}
                </div>
            {/each}
        </div>

        {#if groupedSessions.length > 0}
            <div class="footer-actions" in:fade>
                <button class="export-btn" on:click={exportToCSV}>
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
                        ><path
                            d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                        /><polyline points="7 10 12 15 17 10" /><line
                            x1="12"
                            y1="15"
                            x2="12"
                            y2="3"
                        /></svg
                    >
                    Export to CSV
                </button>
            </div>
        {/if}
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
        background: #0f172a;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 0.5rem;
        padding: 0.5rem 0.75rem;
        color: #f8fafc;
        font-size: 0.9rem;
    }

    .filter-group select option {
        background: #0f172a;
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

    .type-select {
        background: #0f172a;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 0.75rem;
        padding: 0.5rem 1rem;
        color: #f8fafc;
        font-size: 0.9rem;
        cursor: pointer;
    }

    .type-select option {
        background: #0f172a;
        color: #f8fafc;
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

    .sessions-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding-bottom: 2rem;
    }

    .no-results {
        text-align: center;
        padding: 4rem;
        color: #94a3b8;
        background: rgba(15, 23, 42, 0.4);
        border-radius: 1rem;
        border: 1px dashed rgba(255, 255, 255, 0.1);
    }

    .session-card {
        background: rgba(15, 23, 42, 0.4);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 1rem;
        overflow: hidden;
        transition: all 0.2s ease;
    }

    .session-card:hover {
        border-color: rgba(255, 255, 255, 0.2);
        background: rgba(15, 23, 42, 0.6);
    }

    .session-card.expanded {
        border-color: rgba(96, 165, 250, 0.3);
        background: rgba(15, 23, 42, 0.8);
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
    }

    .session-header {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.25rem 1.5rem;
        background: none;
        border: none;
        color: inherit;
        cursor: pointer;
        text-align: left;
        flex-wrap: wrap;
        gap: 1rem;
    }

    .session-info {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        flex: 1; /* Allow it to take up space but not push chevron off */
        min-width: 0; /* Enable truncation for children */
        flex-wrap: wrap; /* allow wrapping on smaller screens */
    }

    .date {
        font-weight: 700;
        color: #f8fafc;
        font-size: 1rem;
        min-width: 80px;
    }

    .location {
        color: #94a3b8;
        font-size: 0.9rem;
    }

    .tag {
        background: rgba(96, 165, 250, 0.1);
        color: #60a5fa;
        padding: 0.25rem 0.75rem;
        border-radius: 2rem;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.025em;
    }

    .load-summary {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .load-pill {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.35rem 0.6rem;
        border-radius: 0.5rem;
        font-size: 0.75rem;
        font-weight: 700;
    }

    .load-pill .label {
        opacity: 0.7;
        font-size: 0.65rem;
    }

    .load-pill.finger {
        background: rgba(239, 68, 68, 0.15);
        color: #f87171;
    }
    .load-pill.shoulder {
        background: rgba(59, 130, 246, 0.15);
        color: #60a5fa;
    }
    .load-pill.forearm {
        background: rgba(34, 197, 94, 0.15);
        color: #4ade80;
    }

    .chevron {
        color: #475569;
        transition: transform 0.3s ease;
        margin-left: 0.5rem;
    }

    .expanded .chevron {
        transform: rotate(180deg);
        color: #60a5fa;
    }

    .session-details {
        border-top: 1px solid rgba(255, 255, 255, 0.05);
        background: rgba(0, 0, 0, 0.2);
        padding: 0.5rem 1.5rem 1.5rem;
    }

    .details-table {
        width: 100%;
        border-collapse: collapse;
    }

    .details-table th {
        text-align: left;
        font-size: 0.75rem;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding: 1rem 0.75rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .details-table td {
        padding: 1rem 0.75rem;
        font-size: 0.9rem;
        color: #cbd5e1;
        border-bottom: 1px solid rgba(255, 255, 255, 0.03);
    }

    .exercise-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.75rem;
    }

    .ex-name {
        font-weight: 500;
        color: #f1f5f9;
        min-width: 120px;
    }

    .ex-meta {
        font-size: 0.8rem;
        padding: 0.2rem 0.5rem;
        border-radius: 0.4rem;
        background: rgba(255, 255, 255, 0.05);
    }

    .ex-meta.grade {
        color: #f472b6;
        border: 1px solid rgba(244, 114, 182, 0.2);
    }
    .ex-meta.weight {
        color: #fbbf24;
        border: 1px solid rgba(251, 191, 36, 0.2);
    }
    .ex-meta.sets {
        color: #a78bfa;
        border: 1px solid rgba(167, 139, 250, 0.2);
    }
    .ex-meta.type {
        color: #f59e0b;
        border: 1px solid rgba(245, 158, 11, 0.2);
    }
    .ex-meta.attempts {
        color: #34d399;
        border: 1px solid rgba(52, 211, 153, 0.2);
    }

    .ex-notes {
        font-size: 0.85rem;
        color: #94a3b8;
        font-style: italic;
        width: 100%;
        margin-top: 0.25rem;
    }

    .footer-actions {
        display: flex;
        justify-content: center;
        margin-top: 2rem;
        padding-bottom: 3rem;
    }

    .export-btn {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #94a3b8;
        padding: 0.75rem 1.5rem;
        border-radius: 0.75rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-size: 0.9rem;
        font-weight: 600;
        transition: all 0.2s ease;
    }

    .export-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #f8fafc;
        transform: translateY(-1px);
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    @media (max-width: 768px) {
        .session-info {
            gap: 0.75rem;
            flex-wrap: wrap;
        }
        .load-summary {
            gap: 0.4rem;
        }
        .load-pill {
            padding: 0.25rem 0.4rem;
        }
        .load-pill .label {
            display: none;
        }
        .session-header {
            padding: 1rem;
        }
    }
    .outdoor-filters {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .custom-filter-input {
        margin-top: 0.25rem;
        font-size: 0.85rem !important;
        background: rgba(255, 255, 255, 0.05) !important;
        border-style: dashed !important;
    }

    .legend-row {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
        padding: 0 0.5rem;
        font-size: 0.8rem;
        color: #94a3b8;
    }

    .legend-item {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        text-transform: uppercase;
        font-weight: 600;
        letter-spacing: 0.05em;
    }

    .legend-item .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
    }

    .legend-item.finger {
        color: #f87171;
    }
    .legend-item.finger .dot {
        background: #f87171;
    }

    .legend-item.shoulder {
        color: #60a5fa;
    }
    .legend-item.shoulder .dot {
        background: #60a5fa;
    }

    .legend-item.forearm {
        color: #4ade80;
    }
    .legend-item.forearm .dot {
        background: #4ade80;
    }
</style>
