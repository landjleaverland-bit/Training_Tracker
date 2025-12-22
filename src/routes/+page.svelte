<script>
    import { apiKey, logout } from "$lib/stores/auth";
    import Login from "$lib/components/Login.svelte";
    import LogExercise from "$lib/components/LogExercise.svelte";
    import ViewData from "$lib/components/ViewData.svelte";
    import GraphData from "$lib/components/GraphData.svelte";

    const tabs = [
        { id: "log", label: "Log Exercise", component: LogExercise },
        { id: "view", label: "View Data", component: ViewData },
        { id: "graph", label: "Graph Data", component: GraphData },
    ];

    let activeTabId = "log";

    $: activeTab = tabs.find((t) => t.id === activeTabId);
</script>

<svelte:head>
    <title
        >Training Tracker {$apiKey ? "- " + activeTab.label : "(Locked)"}</title
    >
    <meta
        name="description"
        content="A simple Svelte webapp for tracking training"
    />
</svelte:head>

<main>
    <div class="app-container">
        <header>
            <h1>Training Tracker</h1>
            {#if $apiKey}
                <button class="logout-button" on:click={logout} title="Logout">
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
                            d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
                        /><polyline points="16 17 21 12 16 7" /><line
                            x1="21"
                            x2="9"
                            y1="12"
                            y2="12"
                        /></svg
                    >
                </button>
            {/if}
        </header>

        {#if $apiKey}
            <nav class="tabs-nav">
                {#each tabs as tab}
                    <button
                        class="tab-button"
                        class:active={activeTabId === tab.id}
                        on:click={() => (activeTabId = tab.id)}
                    >
                        {tab.label}
                    </button>
                {/each}
            </nav>

            <div class="content-container">
                <svelte:component this={activeTab.component} />
            </div>
        {:else}
            <div class="content-container">
                <Login />
            </div>
        {/if}
    </div>
</main>

<style>
    :global(body) {
        margin: 0;
        font-family:
            "Inter",
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            Oxygen,
            Ubuntu,
            Cantarell,
            "Open Sans",
            "Helvetica Neue",
            sans-serif;
        background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
        color: #f8fafc;
        min-height: 100vh;
        display: flex;
        justify-content: center;
        align-items: flex-start; /* Start from top on mobile */
        padding: 1rem;
    }

    @media (min-width: 640px) {
        :global(body) {
            align-items: center; /* Center on larger screens */
            padding: 2rem;
        }
    }

    .app-container {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 1.5rem;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        width: 100%;
        max-width: 500px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    header {
        padding: 2rem 2rem 1rem;
        text-align: center;
    }

    h1 {
        margin: 0;
        font-size: 2rem;
        font-weight: 700;
        background: linear-gradient(to right, #60a5fa, #a78bfa);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
    }

    .logout-button {
        position: absolute;
        top: 2rem;
        right: 1.5rem;
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.2);
        color: #ef4444;
        padding: 0.5rem;
        border-radius: 0.5rem;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .logout-button:hover {
        background: rgba(239, 68, 68, 0.2);
        transform: scale(1.05);
    }

    .tabs-nav {
        display: flex;
        background: rgba(15, 23, 42, 0.4);
        padding: 0.5rem;
        margin: 0 1.5rem 1.5rem;
        border-radius: 1rem;
        gap: 0.25rem;
    }

    .tab-button {
        flex: 1;
        background: transparent;
        border: none;
        color: #94a3b8;
        padding: 0.75rem 0.5rem;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        border-radius: 0.75rem;
        transition: all 0.2s ease;
        white-space: nowrap;
    }

    .tab-button:hover {
        color: #f8fafc;
        background: rgba(255, 255, 255, 0.05);
    }

    .tab-button.active {
        color: #f8fafc;
        background: rgba(96, 165, 250, 0.2);
        box-shadow:
            0 4px 6px -1px rgba(0, 0, 0, 0.1),
            0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }

    .content-container {
        padding: 0 2rem 2.5rem;
        min-height: 300px;
    }

    /* Mobile adjustments */
    @media (max-width: 480px) {
        header {
            padding: 1.5rem 1.5rem 0.75rem;
        }
        .tabs-nav {
            margin: 0 1rem 1rem;
        }
        .content-container {
            padding: 0 1.5rem 2rem;
        }
        .tab-button {
            font-size: 0.75rem;
            padding: 0.6rem 0.25rem;
        }
        h1 {
            font-size: 1.5rem;
        }
    }
</style>
