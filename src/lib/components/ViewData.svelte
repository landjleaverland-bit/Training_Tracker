<div class="tab-content">
    <h2>View Data</h2>
    <div class="placeholder">
        <p>Your logged exercises will appear here in a list or table view.</p>
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
                class="lucide lucide-clipboard-list"
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
        color: #60a5fa;
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
