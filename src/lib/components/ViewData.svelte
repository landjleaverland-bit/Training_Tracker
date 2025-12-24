<script>
    import { fade, slide } from "svelte/transition";
    import { apiKey } from "$lib/stores/auth";
    import {
        historyStore,
        syncLogs,
        removeLog,
        removeSession,
    } from "$lib/stores/history";
    import { get } from "svelte/store";
    import { onMount } from "svelte";
    import { areaOptions, areaCragMap } from "$lib/data/climbingAreas.js";
    import { normalizeLocation, formatDate } from "$lib/utils/formatters";

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

    let expandedRounds = new Set();
    /** @param {string} key */
    function toggleRound(key) {
        if (expandedRounds.has(key)) {
            expandedRounds.delete(key);
        } else {
            expandedRounds.add(key);
        }
        expandedRounds = expandedRounds;
    }

    let expandedItems = new Set();
    /** @param {any} item */
    function toggleItem(item) {
        if (expandedItems.has(item)) {
            expandedItems.delete(item);
        } else {
            expandedItems.add(item);
        }
        expandedItems = expandedItems;
    }

    /**
     * @param {any[]} data
     * @param {string} start
     * @param {string} end
     * @param {string} loc
     * @param {string} sType
     * @param {string} grd
     */
    function filterAndGroupData(data, start, end, loc, sType, grd) {
        if (!data) return [];

        // 1. Filter locally
        const filtered = data.filter((row) => {
            if (
                start &&
                new Date(row.date?.value || row.date) < new Date(start)
            )
                return false;
            // Add one day to endDate to make it inclusive
            if (end) {
                const limit = new Date(end);
                limit.setHours(23, 59, 59, 999);
                if (new Date(row.date?.value || row.date) > limit) return false;
            }
            if (loc) {
                const rowLoc =
                    typeof row.location === "string" ? row.location : "";
                if (!rowLoc.toLowerCase().includes(loc.toLowerCase()))
                    return false;
            }
            if (sType && row.session_type !== sType) return false;
            if (grd) {
                const itemGrade = (row.climbs?.grade || "").toLowerCase();
                if (itemGrade !== grd.toLowerCase()) return false;
            }
            return true;
        });

        // 2. Group by session
        /** @type {Object.<string, any>} */
        const groups = {};
        const seenRows = new Set(); // For deduplication

        filtered.forEach((row) => {
            const d = row.date?.value || row.date;
            const dateStr = new Date(d).toISOString().split("T")[0];

            // Normalize session_type labels for consistent grouping across local/remote data
            let sType = row.session_type || row.climbing_type || "-";
            if (selectedType === "fingerboard") sType = "Fingerboard";
            if (selectedType === "outdoor") sType = "Outdoor";

            // Normalize location: remote outdoor is a string, local is an object
            const loc = normalizeLocation(row.location);

            const key = `${dateStr}|${loc}|${sType}`;

            if (!groups[key]) {
                groups[key] = {
                    key,
                    date: row.date,
                    location: loc,
                    session: sType,
                    fingerLoad: row.finger_load || 0,
                    shoulderLoad: row.shoulder_load || 0,
                    forearmLoad: row.forearm_load || 0,
                    training: row.training || null,
                    position: row.position || null,
                    items: [],
                };
            } else if (row.position && !groups[key].position) {
                groups[key].position = row.position;
            }

            // Normalize: local data has row.climbs as an array, remote is flat rows
            const climbsToProcess = Array.isArray(row.climbs)
                ? row.climbs
                : [row];

            climbsToProcess.forEach((/** @type {any} */ climb) => {
                const exerciseId =
                    climb.exercise_id || climb.id || row.exercise_id;

                const itemData = {
                    ...(climb.climbs || climb), // Handle nested or flat
                    attempts: climb.attempts || row.attempts,
                    type:
                        climb.type || climb.climbing_type || row.climbing_type,
                    name:
                        climb.route ||
                        climb.exercise ||
                        climb.name ||
                        row.exercise ||
                        "-",
                    grade:
                        climb.grade ||
                        row.grade ||
                        (climb.climbs && climb.climbs.grade),
                    grip: climb.grip || climb.grip_type || row.grip,
                    weight: climb.weight ?? row.weight,
                    sets: climb.sets || row.sets,
                    reps: climb.reps || row.reps,
                    attempts_no: climb.attempts_no || row.attempts_no || null,
                    notes: climb.notes || row.notes,
                    exercise_id: exerciseId,
                    details: climb.details || null,
                    rawLocation: row.raw_location || row.location,
                    rowDate: row.date,
                    round:
                        climb.round ||
                        row.round ||
                        (climb.climbs && climb.climbs.round),
                };

                // Deduplication key: Use entire data object + date to ensure any difference is shown
                const dedupKey = `${dateStr}|${JSON.stringify({
                    n: itemData.name,
                    g: itemData.grade,
                    a: itemData.attempts,
                    gr: itemData.grip,
                    w: itemData.weight,
                    no: itemData.notes,
                    l: itemData.rawLocation,
                    r: itemData.round,
                    s: itemData.sets,
                    rp: itemData.reps,
                    an: itemData.attempts_no,
                })}`;

                if (selectedType === "fingerboard" && exerciseId) {
                    // Register this item in seenRows so that any fallback/duplicate generic items are skipped
                    seenRows.add(dedupKey);

                    // Fingerboard Logic: Group by Exercise + Grip
                    const existing = groups[key].items.find(
                        (/** @type {any} */ it) =>
                            String(it.exercise_id) === String(exerciseId) &&
                            (it.grip || it.grip_type) ===
                                (itemData.grip || itemData.grip_type),
                    );

                    if (existing) {
                        if (!existing.details) {
                            existing.details = [
                                {
                                    weight: existing.weight,
                                    reps: existing.reps,
                                },
                            ];
                        }
                        // Only add if it's a new weight/rep combo from a flat server row
                        if (!Array.isArray(climb.details)) {
                            const isNewDetail = !existing.details.find(
                                (/** @type {any} */ d) =>
                                    d.weight === itemData.weight &&
                                    d.reps === itemData.reps,
                            );
                            if (isNewDetail) {
                                existing.details.push({
                                    weight: itemData.weight,
                                    reps: itemData.reps,
                                });
                            }
                        }
                    } else {
                        // New grip variation, add as separate item
                        groups[key].items.push(itemData);
                    }
                } else {
                    // General & Competition Logic: Strict Deduplication
                    if (seenRows.has(dedupKey)) return;
                    seenRows.add(dedupKey);

                    if (selectedType === "competition") {
                        if (!groups[key].rounds) groups[key].rounds = {};

                        const roundName = itemData.round || "Unknown";
                        if (!groups[key].rounds[roundName]) {
                            groups[key].rounds[roundName] = [];
                        }
                        groups[key].rounds[roundName].push(itemData);
                    }

                    groups[key].items.push(itemData);
                }
            });
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
        { id: "outdoor", label: "Outdoor Climb" },
        { id: "competition", label: "Competition" },
    ];

    const locationOptions = [
        "Flashpoint Bristol",
        "Rockstar Techno",
        "Rockstar Unit 3",
        "Rockstar Unit 5",
    ];
    const sessionOptions = ["Strength", "Endurance", "Power", "Recovery"];

    // REPLACE WITH YOUR ACTUAL DEPLOYED CLOUD FUNCTION URL
    // Make sure this matches your saveLog base URL but ends in /getLogs
    const API_BASE_URL = "https://get-log-825153765638.europe-west1.run.app";
    const DELETE_URL = "https://delete-log-825153765638.europe-west1.run.app";

    // Delete Modal State
    let showDeleteModal = false;
    let deleteConfirmText = "";
    /** @type {{ type: 'entry'|'session', data: any } | null} */
    let itemToDelete = null;
    let isDeleting = false;

    /**
     * @param {'entry'|'session'} type
     * @param {any} data
     */
    function openDeleteModal(type, data) {
        itemToDelete = { type, data };
        deleteConfirmText = "";
        showDeleteModal = true;
    }

    async function confirmDelete() {
        const item = itemToDelete;
        if (!item || deleteConfirmText.toLowerCase() !== "delete") return;

        isDeleting = true;
        const currentToken = get(apiKey);

        try {
            /** @type {any} */
            const payload = {
                activity_type: selectedType,
                delete_type: item.type,
            };

            if (item.type === "entry") {
                const dateVal =
                    item.data.date?.value ||
                    item.data.date ||
                    item.data.rowDate?.value ||
                    item.data.rowDate;
                payload.exercise_id = item.data.exercise_id;
                payload.entry_criteria = {
                    date: dateVal,
                    name: item.data.name,
                    weight: item.data.weight,
                    location: item.data.rawLocation || null,
                };
            } else {
                const dateVal = item.data.date?.value || item.data.date;
                payload.session_criteria = {
                    date: dateVal,
                    location: item.data.location,
                    session_type: item.data.session,
                };
            }

            const response = await fetch(DELETE_URL, {
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
                    errorText || "Failed to delete log from server",
                );
            }

            // Remove from local store
            if (item.type === "entry") {
                removeLog(
                    selectedType,
                    item.data.exercise_id,
                    payload.entry_criteria,
                );
            } else {
                removeSession(selectedType, item.data);
            }

            showDeleteModal = false;
        } catch (/** @type {any} */ err) {
            console.error("Delete error:", err);
            alert("Error deleting log: " + (err.message || String(err)));
        } finally {
            isDeleting = false;
        }
    }

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
                    cache: "no-store",
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

    /** @param {string} type */
    function getColumns(type) {
        // Define columns based on activity type
        switch (type) {
            case "indoor":
                return [
                    { key: "date", label: "Date" },
                    { key: "location", label: "Location" },
                    { key: "session_type", label: "Type" },
                    { key: "name", label: "Climb" },
                    { key: "attempts_no", label: "Attempts No." },
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
                    { key: "name", label: "Climb" },
                    { key: "attempts_no", label: "Attempts No." },
                    { key: "climbs", label: "Routes", isObject: true },
                ];
            case "competition":
                return [
                    { key: "date", label: "Date" },
                    { key: "location", label: "Venue" },
                    { key: "round", label: "Round" },
                    { key: "climbs", label: "Problems", isObject: true },
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
                    {:else if selectedType !== "indoor"}
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
                        list="grade-suggestions"
                        bind:value={filterGrade}
                        placeholder="V4, 6a+..."
                    />
                    <datalist id="grade-suggestions">
                        <!-- V-Grades -->
                        {#each Array(17) as _, i}
                            <option value="V{i}">V{i}</option>
                        {/each}
                        <!-- Font Grades -->
                        {#each [4, 5, 6, 7, 8] as num}
                            <option value={num}>{num}</option>
                            <option value="{num}+">{num}+</option>
                            {#if num >= 6}
                                <option value="{num}a">{num}a</option>
                                <option value="{num}a+">{num}a+</option>
                                <option value="{num}b">{num}b</option>
                                <option value="{num}b+">{num}b+</option>
                                <option value="{num}c">{num}c</option>
                                <option value="{num}c+">{num}c+</option>
                            {/if}
                        {/each}
                    </datalist>
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
                        class:competition-header={selectedType ===
                            "competition"}
                    >
                        {#if selectedType === "competition"}
                            <div class="comp-header-grid">
                                <div class="comp-main-info">
                                    <span class="comp-date"
                                        >{formatDate(session.date)}</span
                                    >
                                    <span class="comp-venue"
                                        >{session.location}</span
                                    >
                                </div>
                                <div class="comp-meta-info">
                                    <span class="comp-discipline"
                                        >{session.items[0]?.type ||
                                            "Bouldering"}</span
                                    >
                                    {#if session.position}
                                        <span class="comp-position"
                                            >#{session.position}</span
                                        >
                                    {/if}
                                </div>
                            </div>
                        {:else}
                            <div class="session-info">
                                <span class="date"
                                    >{formatDate(session.date)}</span
                                >
                                <span class="location">{session.location}</span>
                                <span class="tag">{session.session}</span>
                                {#if session.position}
                                    <span class="tag position-tag"
                                        >Pos: {session.position}</span
                                    >
                                {/if}
                            </div>
                        {/if}

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
                            <button
                                class="delete-session-btn"
                                on:click|stopPropagation={() =>
                                    openDeleteModal("session", session)}
                                title="Delete entire session"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    ><path d="M3 6h18" /><path
                                        d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"
                                    /><path
                                        d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"
                                    /><line
                                        x1="10"
                                        y1="11"
                                        x2="10"
                                        y2="17"
                                    /><line
                                        x1="14"
                                        y1="11"
                                        x2="14"
                                        y2="17"
                                    /></svg
                                >
                            </button>
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
                            {#if selectedType === "competition"}
                                {@const standardRounds = [
                                    "Result",
                                    "Finals",
                                    "Semi-Finals",
                                    "Qualifiers",
                                ]}
                                {@const allRounds = [
                                    ...standardRounds,
                                    ...Object.keys(session.rounds || {})
                                        .filter(
                                            (r) => !standardRounds.includes(r),
                                        )
                                        .sort(),
                                ]}
                                <div class="rounds-container">
                                    {#each allRounds as roundName}
                                        {#if session.rounds && session.rounds[roundName]}
                                            {@const roundItems =
                                                session.rounds[roundName]}
                                            <!-- Defensive filter: Ensure items strictly belong to this round -->
                                            {@const filteredItems =
                                                roundItems.filter(
                                                    (/** @type {any} */ i) =>
                                                        i.round === roundName,
                                                )}

                                            {#if filteredItems.length > 0}
                                                <div class="round-section">
                                                    <button
                                                        class="round-header"
                                                        on:click={() =>
                                                            toggleRound(
                                                                `${session.key}-${roundName}`,
                                                            )}
                                                    >
                                                        <div
                                                            class="round-header-left"
                                                        >
                                                            <svg
                                                                class="chevron"
                                                                class:expanded={expandedRounds.has(
                                                                    `${session.key}-${roundName}`,
                                                                )}
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
                                                                    d="m9 18 6-6-6-6"
                                                                /></svg
                                                            >
                                                            <span
                                                                class="round-title"
                                                                >{roundName}</span
                                                            >
                                                        </div>
                                                        <span
                                                            class="round-count"
                                                            >{filteredItems.length}
                                                            problems</span
                                                        >
                                                    </button>
                                                    {#if expandedRounds.has(`${session.key}-${roundName}`)}
                                                        <div
                                                            class="round-content"
                                                            transition:slide|local
                                                        >
                                                            <table
                                                                class="details-table"
                                                            >
                                                                <thead>
                                                                    <tr>
                                                                        {#each columns.filter((c) => c.key !== "date" && c.key !== "location" && c.key !== "round") as col}
                                                                            <th
                                                                                >{col.label}</th
                                                                            >
                                                                        {/each}
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {#each filteredItems as item}
                                                                        <tr>
                                                                            {#each columns.filter((c) => c.key !== "date" && c.key !== "location" && c.key !== "round") as col}
                                                                                <td
                                                                                >
                                                                                    {#if col.key === "climbs"}
                                                                                        <div
                                                                                            class="climb-cell"
                                                                                        >
                                                                                            <span
                                                                                                class="climb-name"
                                                                                                >{item.name}</span
                                                                                            >
                                                                                            {#if item.attempts}
                                                                                                <span
                                                                                                    class="climb-result {item.attempts.toLowerCase()}"
                                                                                                >
                                                                                                    {item.attempts}
                                                                                                    {#if (item.attempts === "Top" || item.attempts === "Zone") && item.attempt_count > 1}
                                                                                                        <span
                                                                                                            class="attempt-number"
                                                                                                            >({item.attempt_count})</span
                                                                                                        >
                                                                                                    {/if}
                                                                                                </span>
                                                                                            {/if}
                                                                                        </div>
                                                                                        {#if item.notes}
                                                                                            <div
                                                                                                class="climb-notes"
                                                                                            >
                                                                                                {item.notes}
                                                                                            </div>
                                                                                        {/if}
                                                                                    {:else}
                                                                                        {item[
                                                                                            col
                                                                                                .key
                                                                                        ] ||
                                                                                            "-"}
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
                                            {/if}
                                        {/if}
                                    {/each}
                                </div>
                            {:else}
                                {#if session.training}
                                    <div class="training-summary">
                                        <div class="summary-item">
                                            <span class="label">Focus</span>
                                            <span class="value"
                                                >{session.training
                                                    .training_type || "-"}</span
                                            >
                                        </div>
                                        <div class="summary-item">
                                            <span class="label">Difficulty</span
                                            >
                                            <span class="value"
                                                >{session.training.difficulty ||
                                                    "-"}</span
                                            >
                                        </div>
                                        <div class="summary-item">
                                            <span class="label">Category</span>
                                            <span class="value"
                                                >{session.training.category ||
                                                    "-"}</span
                                            >
                                        </div>
                                        <div class="summary-item">
                                            <span class="label"
                                                >Energy System</span
                                            >
                                            <span class="value"
                                                >{session.training
                                                    .energy_system || "-"}</span
                                            >
                                        </div>
                                        <div class="summary-item">
                                            <span class="label">Focus Area</span
                                            >
                                            <span class="value"
                                                >{session.training
                                                    .technique_focus ||
                                                    "-"}</span
                                            >
                                        </div>
                                        <div class="summary-item">
                                            <span class="label">Wall Angle</span
                                            >
                                            <span class="value"
                                                >{session.training.wall_angle ||
                                                    "-"}</span
                                            >
                                        </div>
                                    </div>
                                {/if}
                                {#if selectedType === "indoor" || selectedType === "outdoor" || selectedType === "fingerboard"}
                                    <div class="cards-list">
                                        {#each session.items as item}
                                            <div class="climb-card-container">
                                                <button
                                                    class="climb-card-header"
                                                    on:click={() =>
                                                        toggleItem(item)}
                                                    type="button"
                                                >
                                                    <div class="header-left">
                                                        <span
                                                            class="climb-name-title"
                                                        >
                                                            {item.name ||
                                                                "Unnamed Climb"}
                                                        </span>
                                                        {#if item.grade}
                                                            <span
                                                                class="ex-meta grade"
                                                                class:v-grade={item.grade
                                                                    ?.toUpperCase()
                                                                    .startsWith(
                                                                        "V",
                                                                    )}
                                                            >
                                                                {item.grade}
                                                            </span>
                                                        {/if}
                                                        {#if selectedType === "fingerboard" && item.grip}
                                                            <span
                                                                class="ex-meta type"
                                                            >
                                                                {item.grip}
                                                            </span>
                                                        {/if}
                                                    </div>
                                                    <div class="header-right">
                                                        {#if item.attempts && selectedType !== "fingerboard"}
                                                            <span
                                                                class="mini-status {item.attempts.toLowerCase()}"
                                                            >
                                                                {item.attempts}
                                                            </span>
                                                        {/if}
                                                        <!-- For Fingerboard, show summary of sets if collapsed, or just chevron -->
                                                        {#if selectedType === "fingerboard"}
                                                            <span
                                                                class="mini-status type"
                                                            >
                                                                {item.details
                                                                    ?.length ||
                                                                    1} Sets
                                                            </span>
                                                        {/if}

                                                        <div
                                                            class="chevron"
                                                            class:expanded={expandedItems.has(
                                                                item,
                                                            )}
                                                        >
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                width="20"
                                                                height="20"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                stroke-width="2"
                                                                stroke-linecap="round"
                                                                stroke-linejoin="round"
                                                                ><polyline
                                                                    points="6 9 12 15 18 9"

                                                                ></polyline></svg
                                                            >
                                                        </div>
                                                    </div>
                                                </button>

                                                {#if expandedItems.has(item)}
                                                    <div
                                                        class="climb-card-body"
                                                        transition:slide|local
                                                    >
                                                        {#if selectedType === "fingerboard"}
                                                            <!-- Fingerboard Specific Body: Weight/Reps Table -->
                                                            <div
                                                                class="fb-sets-container"
                                                            >
                                                                <div
                                                                    class="fb-sets-header"
                                                                >
                                                                    <span
                                                                        >Weight</span
                                                                    >
                                                                    <span
                                                                        >Reps</span
                                                                    >
                                                                </div>
                                                                <div
                                                                    class="fb-sets-list"
                                                                >
                                                                    {#if item.details && item.details.length > 0}
                                                                        {#each item.details as set}
                                                                            <div
                                                                                class="fb-set-row"
                                                                            >
                                                                                <span
                                                                                    class="set-weight"
                                                                                    >{set.weight}
                                                                                    kg</span
                                                                                >
                                                                                <span
                                                                                    class="set-reps"
                                                                                    >{set.reps}</span
                                                                                >
                                                                            </div>
                                                                        {/each}
                                                                    {:else}
                                                                        <!-- Fallback for single/legacy items -->
                                                                        <div
                                                                            class="fb-set-row"
                                                                        >
                                                                            <span
                                                                                class="set-weight"
                                                                                >{item.weight ||
                                                                                    0}
                                                                                kg</span
                                                                            >
                                                                            <span
                                                                                class="set-reps"
                                                                                >{item.reps ||
                                                                                    0}</span
                                                                            >
                                                                        </div>
                                                                    {/if}
                                                                </div>
                                                            </div>
                                                        {:else}
                                                            <!-- Standard Climb Body -->
                                                            <div
                                                                class="climb-meta-grid"
                                                            >
                                                                {#if item.attempts}
                                                                    <div
                                                                        class="meta-item"
                                                                    >
                                                                        <span
                                                                            class="meta-label"
                                                                            >Attempts</span
                                                                        >
                                                                        <span
                                                                            class="meta-value"
                                                                        >
                                                                            {item.attempts}
                                                                            {#if item.attempt_count && item.attempt_count > 1}
                                                                                ({item.attempt_count})
                                                                            {/if}
                                                                        </span>
                                                                    </div>
                                                                {/if}
                                                                {#if item.type || item.isRopes !== undefined}
                                                                    <div
                                                                        class="meta-item"
                                                                    >
                                                                        <span
                                                                            class="meta-label"
                                                                            >Type</span
                                                                        >
                                                                        <span
                                                                            class="meta-value"
                                                                        >
                                                                            {item.type ||
                                                                                (item.isRopes
                                                                                    ? "Sport"
                                                                                    : "Bouldering")}
                                                                        </span>
                                                                    </div>
                                                                {/if}

                                                                <div
                                                                    class="meta-item action"
                                                                >
                                                                    <button
                                                                        class="delete-session-btn"
                                                                        on:click|stopPropagation={() =>
                                                                            openDeleteModal(
                                                                                "entry",
                                                                                {
                                                                                    ...item,
                                                                                    rowDate:
                                                                                        session.date,
                                                                                },
                                                                            )}
                                                                        title="Delete this entry"
                                                                        style="width: 28px; height: 28px; margin-left: auto;"
                                                                    >
                                                                        <svg
                                                                            xmlns="http://www.w3.org/2000/svg"
                                                                            width="14"
                                                                            height="14"
                                                                            viewBox="0 0 24 24"
                                                                            fill="none"
                                                                            stroke="currentColor"
                                                                            stroke-width="2"
                                                                            stroke-linecap="round"
                                                                            stroke-linejoin="round"
                                                                            ><path
                                                                                d="M3 6h18"
                                                                            /><path
                                                                                d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"
                                                                            /><path
                                                                                d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"
                                                                            /><line
                                                                                x1="10"
                                                                                y1="11"
                                                                                x2="10"
                                                                                y2="17"
                                                                            /><line
                                                                                x1="14"
                                                                                y1="11"
                                                                                x2="14"
                                                                                y2="17"
                                                                            /></svg
                                                                        >
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        {/if}

                                                        {#if item.notes}
                                                            <div
                                                                class="climb-notes-section"
                                                            >
                                                                <span
                                                                    class="meta-label"
                                                                    >Notes</span
                                                                >
                                                                <p
                                                                    class="notes-text"
                                                                >
                                                                    {item.notes}
                                                                </p>
                                                            </div>
                                                        {/if}
                                                    </div>
                                                {/if}
                                            </div>
                                        {/each}
                                    </div>
                                {:else}
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
                                                            {#if col.key === "climbs"}
                                                                <div
                                                                    class="climb-cell"
                                                                >
                                                                    <span
                                                                        class="climb-name"
                                                                        >{item.name}</span
                                                                    >
                                                                    {#if item.grip}
                                                                        <span
                                                                            class="meta-fb"
                                                                            >{item.grip}</span
                                                                        >
                                                                    {/if}
                                                                    {#if item.weight}
                                                                        <span
                                                                            class="meta-fb"
                                                                            >{item.weight}</span
                                                                        >
                                                                    {/if}
                                                                    {#if item.sets || item.reps}
                                                                        <span
                                                                            class="meta-fb"
                                                                        >
                                                                            {item.sets ||
                                                                                0}
                                                                            x {item.reps ||
                                                                                0}
                                                                        </span>
                                                                    {/if}
                                                                    {#if item.attempts}
                                                                        <span
                                                                            class="climb-result {item.attempts.toLowerCase()}"
                                                                        >
                                                                            {item.attempts}
                                                                            {#if (item.attempts === "Top" || item.attempts === "Zone") && item.attempt_count > 1}
                                                                                <span
                                                                                    class="attempt-number"
                                                                                    >({item.attempt_count})</span
                                                                                >
                                                                            {/if}
                                                                        </span>
                                                                    {/if}
                                                                </div>
                                                                {#if item.notes}
                                                                    <div
                                                                        class="climb-notes"
                                                                    >
                                                                        {item.notes}
                                                                    </div>
                                                                {/if}
                                                            {:else}
                                                                ? item[ col .key
                                                                ] : "-"}
                                                            {/if}
                                                        </td>
                                                    {/each}
                                                </tr>
                                            {/each}
                                        </tbody>
                                    </table>
                                {/if}
                            {/if}
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

{#if showDeleteModal}
    <div class="modal-overlay" transition:fade>
        <div class="modal-content" transition:slide>
            <h3>Confirm Deletion</h3>
            <p>
                Are you sure you want to delete this {itemToDelete?.type}? This
                action cannot be undone.
            </p>
            {#if itemToDelete?.type === "session"}
                <div class="delete-preview">
                    <strong>{formatDate(itemToDelete.data.date)}</strong> - {itemToDelete
                        .data.location} ({itemToDelete.data.session})
                </div>
            {:else if itemToDelete?.data}
                <div class="delete-preview">
                    <strong>{itemToDelete.data.name}</strong>
                    ({itemToDelete.data.grade || "-"}) on {formatDate(
                        itemToDelete.data.date || itemToDelete.data.rowDate,
                    )}
                </div>
            {/if}

            <p class="delete-prompt">
                Type <strong>delete</strong> to confirm:
            </p>
            <input
                type="text"
                bind:value={deleteConfirmText}
                placeholder="delete"
                class="delete-input"
            />

            <div class="modal-actions">
                <button
                    class="cancel-btn"
                    on:click={() => (showDeleteModal = false)}>Cancel</button
                >
                <button
                    class="confirm-delete-btn"
                    disabled={deleteConfirmText.toLowerCase() !== "delete" ||
                        isDeleting}
                    on:click={confirmDelete}
                >
                    {#if isDeleting}
                        Deleting...
                    {:else}
                        Delete
                    {/if}
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    .view-container {
        animation: fadeIn 0.3s ease-out;
    }

    .header-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
        gap: 1rem;
    }

    .header-actions {
        display: flex;
        gap: 0.75rem;
        align-items: center;
        flex-wrap: wrap;
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
        min-width: 140px;
        max-width: 100%;
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

    .ex-meta.attempts {
        background: rgba(167, 139, 250, 0.1);
        color: #a78bfa;
        border: 1px solid rgba(167, 139, 250, 0.2);
    }

    .ex-meta.grip {
        background: rgba(234, 179, 8, 0.1);
        color: #eab308;
        border: 1px solid rgba(234, 179, 8, 0.2);
    }

    .training-summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
        padding: 1rem;
        background: rgba(255, 255, 255, 0.02);
        border-radius: 0.75rem;
        border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .summary-item {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .summary-item .label {
        font-size: 0.7rem;
        color: #64748b;
        text-transform: uppercase;
        font-weight: 600;
        letter-spacing: 0.025em;
    }

    .summary-item .value {
        font-size: 0.85rem;
        color: #f8fafc;
        font-weight: 500;
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

    .tag.position-tag {
        background: rgba(245, 158, 11, 0.15);
        color: #f59e0b;
        border: 1px solid rgba(245, 158, 11, 0.3);
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
    .ex-meta.grade.v-grade {
        color: #38bdf8;
        border: 1px solid rgba(56, 189, 248, 0.2);
    }
    .ex-meta.type {
        color: #f59e0b;
        border: 1px solid rgba(245, 158, 11, 0.2);
    }
    .ex-meta.attempts {
        color: #34d399;
        border: 1px solid rgba(52, 211, 153, 0.2);
    }
    .ex-meta.weight {
        color: #fbbf24;
        border: 1px solid rgba(251, 191, 36, 0.2);
    }
    .ex-meta.sets-reps {
        color: #a78bfa;
        border: 1px solid rgba(167, 139, 250, 0.2);
    }
    .meta-fb {
        font-size: 0.75rem;
        color: #94a3b8;
        background: rgba(255, 255, 255, 0.05);
        padding: 0.1rem 0.3rem;
        border-radius: 0.25rem;
        width: fit-content;
    }

    /* Fingerboard Sets Sub-layout inside Card */
    .fb-sets-container {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 1rem;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 0.5rem;
        padding: 0.75rem;
        border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .fb-sets-header {
        display: flex;
        justify-content: space-between;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        font-size: 0.75rem;
        text-transform: uppercase;
        color: #64748b;
        font-weight: 600;
    }

    .fb-sets-list {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .fb-set-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.4rem 0.25rem;
        font-size: 0.9rem;
        color: #e2e8f0;
        border-radius: 0.25rem;
    }

    .fb-set-row:hover {
        background: rgba(255, 255, 255, 0.03);
    }

    .set-weight {
        font-weight: 600;
        color: #f8fafc;
    }

    .set-reps {
        color: #94a3b8;
    }

    .complex-details {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        align-items: center;
    }

    .ex-meta.multi-load {
        color: #fbbf24;
        background: rgba(251, 191, 36, 0.1);
        border: 1px solid rgba(251, 191, 36, 0.3);
        font-weight: 600;
    }

    .ex-meta.sets-count {
        color: #94a3b8;
        font-weight: 600;
        background: transparent;
        border: none;
        font-size: 0.75rem;
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

    /* Modal Styles */
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(4px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .modal-content {
        background: #1e293b;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 1.5rem;
        padding: 2rem;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }

    .modal-content h3 {
        margin-top: 0;
        color: #f87171;
    }

    .delete-preview {
        background: rgba(0, 0, 0, 0.2);
        padding: 1rem;
        border-radius: 0.75rem;
        margin: 1rem 0;
        font-size: 0.9rem;
        color: #cbd5e1;
        border-left: 4px solid #f87171;
    }

    .delete-prompt {
        font-size: 0.85rem;
        color: #94a3b8;
        margin-top: 1.5rem;
    }

    .delete-input {
        width: 100%;
        background: #0f172a;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 0.75rem;
        padding: 0.75rem 1rem;
        color: #f8fafc;
        margin-bottom: 2rem;
    }

    .modal-actions {
        display: flex;
        gap: 1rem;
    }

    .modal-actions button {
        flex: 1;
        padding: 0.75rem;
        border-radius: 0.75rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
    }

    .cancel-btn {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #94a3b8;
    }

    .confirm-delete-btn {
        background: #ef4444;
        border: none;
        color: white;
    }

    .confirm-delete-btn:hover:not(:disabled) {
        background: #dc2626;
    }

    .confirm-delete-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .delete-session-btn {
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.2);
        color: #f87171;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        transition: all 0.2s;
        margin-left: 0.5rem;
    }

    .delete-session-btn:hover {
        background: #ef4444;
        color: white;
    }

    .delete-entry-btn {
        background: transparent;
        border: none;
        color: #475569;
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 0.4rem;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .delete-entry-btn:hover {
        color: #ef4444;
        background: rgba(239, 68, 68, 0.1);
    }
    /* Competition Styles */
    .competition-header {
        padding: 1rem;
        border: 1px solid rgba(167, 139, 250, 0.1);
        background: rgba(167, 139, 250, 0.03);
    }

    .comp-header-grid {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
    }

    .comp-main-info {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .comp-date {
        font-size: 0.8rem;
        color: #94a3b8;
    }

    .comp-venue {
        font-weight: 600;
        color: #f8fafc;
        font-size: 1.1rem;
    }

    .comp-meta-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .comp-discipline {
        background: rgba(99, 102, 241, 0.1);
        color: #818cf8;
        padding: 0.2rem 0.6rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        border: 1px solid rgba(99, 102, 241, 0.2);
    }

    .comp-position {
        background: rgba(251, 191, 36, 0.1);
        color: #fbbf24;
        padding: 0.2rem 0.6rem;
        border-radius: 9999px;
        font-size: 0.85rem;
        font-weight: 700;
        border: 1px solid rgba(251, 191, 36, 0.2);
    }

    /* Sticky Header for Tables (existing) */
    .details-table th {
        position: sticky;
        top: 0;
        z-index: 10;
        background: #1e1b4b; /* Match page background or table header bg */
    }

    /* Collapsible Climb Cards */
    .cards-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        width: 100%; /* Fix: ensure it takes full width of parent */
    }

    .climb-card-container {
        /* Fix: darker background to match app theme (Deep Blue/Dark) */
        background: rgba(0, 0, 0, 0.25);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 0.5rem;
        overflow: hidden;
        width: 100%; /* Fix: ensure card is full width */
    }

    .climb-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        background: transparent;
        border: none;
        padding: 0.85rem 1rem;
        color: inherit;
        cursor: pointer;
        text-align: left;
        transition: background 0.2s ease;
    }

    .climb-card-header:hover {
        background: rgba(255, 255, 255, 0.05);
    }

    .header-left {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
    }

    .climb-name-title {
        font-weight: 600;
        font-size: 0.95rem;
        color: #f8fafc;
    }

    .header-right {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .mini-status {
        font-size: 0.75rem;
        padding: 0.15rem 0.5rem;
        border-radius: 0.25rem;
        background: rgba(255, 255, 255, 0.1);
        color: #cbd5e1;
    }

    .mini-status.flash {
        color: #facc15;
        background: rgba(250, 204, 21, 0.15);
    }

    .mini-status.redpoint {
        color: #f87171;
        background: rgba(248, 113, 113, 0.15);
    }

    .chevron {
        transition: transform 0.2s ease;
        line-height: 0;
        opacity: 0.7;
    }

    .chevron.expanded {
        transform: rotate(180deg);
    }

    .climb-card-body {
        padding: 1rem;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(0, 0, 0, 0.15);
    }

    .climb-meta-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .meta-item {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .meta-label {
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #94a3b8;
    }

    .meta-value {
        font-size: 0.9rem;
        color: #e2e8f0;
    }

    .climb-notes-section {
        margin-top: 0.5rem;
        padding-top: 0.75rem;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    .notes-text {
        font-size: 0.9rem;
        color: #cbd5e1;
        margin: 0;
        white-space: pre-wrap;
        line-height: 1.5;
    }

    .delete-text-btn {
        background: none;
        border: none;
        color: #ef4444;
        font-size: 0.8rem;
        cursor: pointer;
        padding: 0;
        text-align: left;
        margin-top: auto;
        opacity: 0.8;
        transition: opacity 0.2s;
    }

    .delete-text-btn:hover {
        text-decoration: underline;
        opacity: 1;
    }

    .rounds-container {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 0.5rem 0;
    }

    .round-section {
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 0.5rem;
        background: rgba(0, 0, 0, 0.2);
        overflow: hidden;
    }

    .round-header {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 1rem;
        background: transparent;
        border: none;
        cursor: pointer;
        color: #f8fafc;
        transition: background 0.2s;
    }

    .round-header:hover {
        background: rgba(255, 255, 255, 0.03);
    }

    .round-header-left {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .round-title {
        font-weight: 600;
        font-size: 0.95rem;
    }

    .round-count {
        font-size: 0.8rem;
        color: #64748b;
    }

    .round-content {
        padding: 0;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    .climb-result {
        font-weight: 600;
        font-size: 0.9rem;
    }

    .climb-result.top {
        color: #4ade80;
    }
    .climb-result.zone {
        color: #60a5fa;
    }
    .climb-result.flash {
        color: #facc15;
    }
    .climb-result.attempt {
        color: #94a3b8;
    }

    .attempt-number {
        font-size: 0.8rem;
        color: #64748b;
        font-weight: normal;
        margin-left: 0.25rem;
    }

    /* Inner Cards in Data Column */
    .inner-card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 0.5rem;
        padding: 0.5rem;
        margin-bottom: 0.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .inner-card:last-child {
        margin-bottom: 0;
    }

    .inner-card-header {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        align-items: center;
    }

    .inner-card-body {
        font-size: 0.85rem;
        color: #94a3b8;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
        padding-top: 0.25rem;
        margin-top: -0.25rem;
    }

    .ex-meta {
        font-size: 0.75rem;
        padding: 0.1rem 0.4rem;
        border-radius: 0.25rem;
        white-space: nowrap;
    }

    .ex-meta.type {
        background: rgba(148, 163, 184, 0.1);
        color: #94a3b8;
        border: 1px solid rgba(148, 163, 184, 0.2);
    }

    .ex-meta.grade {
        background: rgba(59, 130, 246, 0.1);
        color: #60a5fa;
        font-weight: 600;
        border: 1px solid rgba(59, 130, 246, 0.2);
    }

    .ex-meta.grade.v-grade {
        background: rgba(236, 72, 153, 0.1);
        color: #f472b6;
        border: 1px solid rgba(236, 72, 153, 0.2);
    }
</style>
