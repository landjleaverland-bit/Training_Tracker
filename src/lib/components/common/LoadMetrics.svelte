<script>
    export let fingerLoad = 3;
    export let shoulderLoad = 3;
    export let forearmLoad = 3;
</script>

<div class="load-metrics">
    <div class="load-group">
        <label for="finger-load">Finger Load (0-5)</label>
        <input
            id="finger-load"
            type="number"
            min="0"
            max="5"
            step="0.5"
            bind:value={fingerLoad}
        />
    </div>
    <div class="load-group">
        <label for="shoulder-load">Shoulder Load (0-5)</label>
        <input
            id="shoulder-load"
            type="number"
            min="0"
            max="5"
            step="0.5"
            bind:value={shoulderLoad}
        />
    </div>
    <div class="load-group">
        <label for="forearm-load">Forearm Load (0-5)</label>
        <input
            id="forearm-load"
            type="number"
            min="0"
            max="5"
            step="0.5"
            bind:value={forearmLoad}
        />
    </div>
</div>

<style>
    .load-metrics {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
        background: rgba(255, 255, 255, 0.03);
        padding: 1rem;
        border-radius: 0.75rem;
        border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .load-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    input {
        width: 100%;
        box-sizing: border-box;
        background: #0f172a;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 0.5rem;
        padding: 0.6rem 0.75rem;
        color: #f8fafc;
        font-size: 0.9rem;
        outline: none;
        transition: all 0.2s ease;
    }

    input:hover,
    input:focus {
        border-color: #60a5fa;
    }
</style>
