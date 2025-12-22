<div class="tab-content">
    <h2>Graph Data</h2>
    <div class="placeholder">
        <p>Visual progress charts and graphs will be displayed here.</p>
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
                class="lucide lucide-line-chart"
                ><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg
            >
        </div>
    </div>
</div>

<style>
    .tab-content {
        animation: fadeIn 0.3s ease-out;
        text-align: center;
    }

    h2 {
        font-size: 1.5rem;
        margin-bottom: 1.5rem;
        color: #f8fafc;
    }

    .placeholder {
        background: rgba(15, 23, 42, 0.4);
        padding: 2rem;
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
</style>
