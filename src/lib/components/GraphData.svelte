<script>
    let selectedType = "load";
    const activityTypes = [
        { id: "load", label: "Load graphs" },
        { id: "outdoor", label: "Outdoor stats" },
        { id: "indoor", label: "Indoor stats" },
        { id: "all", label: "All stats" },
    ];

    function fetchData() {
        // Placeholder for future logic
        console.log("Fetch data clicked for:", selectedType);
    }
</script>

<div class="tab-content">
    <div class="header-row">
        <h2>Graph Data</h2>
        <div class="header-actions">
            <button
                class="fetch-btn"
                on:click={fetchData}
                title="Fetch latest data"
            >
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
                Fetch Data
            </button>
            <select bind:value={selectedType} class="type-select">
                {#each activityTypes as type}
                    <option value={type.id}>{type.label}</option>
                {/each}
            </select>
        </div>
    </div>

    {#if selectedType === "load"}
        <div class="placeholder">
            <p>
                Load Graphs (Finger, Shoulder, Forearm) will be displayed here.
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
                    class="lucide lucide-activity"
                    ><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg
                >
            </div>
        </div>
    {:else if selectedType === "outdoor"}
        <div class="placeholder">
            <p>Outdoor Stats (Grades, Areas, Ticks) will be displayed here.</p>
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
                    class="lucide lucide-mountain"
                    ><path d="m8 3 4 8 5-5 5 15H2L8 3z" /></svg
                >
            </div>
        </div>
    {:else if selectedType === "indoor"}
        <div class="placeholder">
            <p>
                Indoor Stats (Sessions, Volumes, Types) will be displayed here.
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
                    class="lucide lucide-building"
                    ><rect
                        width="16"
                        height="20"
                        x="4"
                        y="2"
                        rx="2"
                        ry="2"
                    /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path
                        d="M16 6h.01"
                    /><path d="M12 6h.01" /><path d="M12 10h.01" /><path
                        d="M12 14h.01"
                    /><path d="M16 10h.01" /><path d="M16 14h.01" /><path
                        d="M8 10h.01"
                    /><path d="M8 14h.01" /></svg
                >
            </div>
        </div>
    {:else if selectedType === "all"}
        <div class="placeholder">
            <p>All Stats (Global Summary) will be displayed here.</p>
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
                    class="lucide lucide-pie-chart"
                    ><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path
                        d="M22 12A10 10 0 0 0 12 2v10z"
                    /></svg
                >
            </div>
        </div>
    {:else}
        <div class="placeholder">
            <p>Select a graph type to view.</p>
        </div>
    {/if}
</div>

<style>
    .tab-content {
        animation: fadeIn 0.3s ease-out;
        text-align: center;
    }

    .header-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        flex-wrap: wrap;
        gap: 1rem;
    }

    .header-actions {
        display: flex;
        gap: 0.75rem;
        align-items: center;
    }

    h2 {
        font-size: 1.5rem;
        margin: 0;
        color: #f8fafc;
    }

    .fetch-btn {
        background: rgba(96, 165, 250, 0.1);
        color: #60a5fa;
        border: 1px solid rgba(96, 165, 250, 0.2);
        padding: 0.6rem 1.25rem;
        border-radius: 0.75rem;
        font-size: 0.85rem;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.6rem;
        transition: all 0.2s ease;
    }

    .fetch-btn:hover {
        background: rgba(96, 165, 250, 0.2);
        transform: translateY(-1px);
    }

    .type-select {
        background: #0f172a;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 0.75rem;
        padding: 0.6rem 1rem;
        color: #f8fafc;
        font-size: 0.85rem;
        cursor: pointer;
        outline: none;
        transition: all 0.2s;
    }

    .type-select:hover {
        border-color: #60a5fa;
    }

    .placeholder {
        background: rgba(15, 23, 42, 0.4);
        padding: 4rem 2rem;
        border-radius: 1rem;
        border: 1px dashed rgba(255, 255, 255, 0.1);
    }

    p {
        color: #94a3b8;
        margin-bottom: 2rem;
    }

    .empty-state {
        color: #a78bfa;
        opacity: 0.5;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    @media (max-width: 600px) {
        .header-row {
            flex-direction: column;
            align-items: flex-start;
        }
        .header-actions {
            width: 100%;
        }
        .fetch-btn,
        .type-select {
            flex: 1;
        }
    }
</style>
