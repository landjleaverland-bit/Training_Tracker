<script lang="ts">
    /**
     * @file PlateCalculator.svelte
     * @component
     * @description Visual utility to calculate required barbell plates for a target weight.
     * Assumes a standard 20kg bar and metric plates.
     */
    export let targetWeight: number = 0;
    export let barWeight: number = 20; // kg

    const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
    
    $: plateLoad = calculatePlates(targetWeight, barWeight);

    function calculatePlates(target: number, bar: number) {
        if (target <= bar) return [];

        let weightToLoad = (target - bar) / 2; // Per side
        const counts: { weight: number, count: number }[] = [];

        for (const plate of PLATES) {
            const count = Math.floor(weightToLoad / plate);
            if (count > 0) {
                counts.push({ weight: plate, count });
                weightToLoad -= count * plate;
            }
        }
        return counts;
    }
</script>

<div class="plate-calc">
    <h4>Plate Calculator</h4>
    <div class="result">
        {#each plateLoad as p}
            <div class="plate-stack">
                <div class="plate-visual" style="height: {p.weight * 2 + 20}px">
                    {p.weight}
                </div>
                <span class="count">x{p.count}</span>
            </div>
        {/each}
        {#if plateLoad.length === 0}
            <span class="empty">Just the bar!</span>
        {/if}
    </div>
</div>

<style>
    .plate-calc {
        padding: 1rem;
        background: var(--bg-tertiary);
        border-radius: 8px;
    }

    .result {
        display: flex;
        gap: 1rem;
        justify-content: center;
        align-items: flex-end;
        height: 100px;
    }

    .plate-stack {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .plate-visual {
        width: 20px;
        background: var(--teal-primary);
        border-radius: 4px;
        color: black;
        font-size: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        writing-mode: vertical-lr;
    }
    
    .count {
        font-size: 0.8rem;
        color: var(--text-secondary);
        margin-top: 4px;
    }
</style>
