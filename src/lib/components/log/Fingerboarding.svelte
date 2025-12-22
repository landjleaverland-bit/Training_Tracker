<script>
    import { fade } from "svelte/transition";

    let session = "Training";
    let fingerLoad = 0;
    let shoulderLoad = 0;
    let forearmLoad = 0;

    export function getData() {
        return {
            location: "N/A",
            session,
            fingerLoad,
            shoulderLoad,
            forearmLoad,
        };
    }
</script>

<div class="fingerboard-config" in:fade>
    <div class="load-metrics">
        <div class="load-group">
            <label for="fb-finger-load">Finger Load (0-5)</label>
            <input
                id="fb-finger-load"
                type="number"
                min="0"
                max="5"
                step="0.5"
                bind:value={fingerLoad}
            />
        </div>

        <div class="load-group">
            <label for="fb-shoulder-load">Shoulder Load (0-5)</label>
            <input
                id="fb-shoulder-load"
                type="number"
                min="0"
                max="5"
                step="0.5"
                bind:value={shoulderLoad}
            />
        </div>

        <div class="load-group">
            <label for="fb-forearm-load">Forearm Load (0-5)</label>
            <input
                id="fb-forearm-load"
                type="number"
                min="0"
                max="5"
                step="0.5"
                bind:value={forearmLoad}
            />
        </div>
    </div>
</div>

<style>
    .fingerboard-config {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    label {
        font-size: 0.75rem;
        color: #94a3b8;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    input[type="number"] {
        background: #0f172a;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 0.75rem;
        padding: 0.8rem 1rem;
        color: #f8fafc;
        font-size: 1.1rem;
        width: 100%;
        box-sizing: border-box;
        transition: all 0.2s ease;
    }

    input:focus {
        border-color: #60a5fa;
        outline: none;
        box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.2);
    }

    .load-metrics {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        background: rgba(255, 255, 255, 0.03);
        padding: 1.5rem;
        border-radius: 1rem;
        border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .load-group {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
    }
</style>
