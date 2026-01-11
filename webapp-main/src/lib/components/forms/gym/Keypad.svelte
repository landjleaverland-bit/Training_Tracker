<script lang="ts">
    /**
     * @file Keypad.svelte
     * @component
     * @description A numeric keypad for easier data entry on mobile devices.
     * Includes quick-add buttons and basic arithmetic controls.
     */
    import { createEventDispatcher } from 'svelte';

    export let value: number | null = null;
    export let label: string = 'Value';

    const dispatch = createEventDispatcher();

    function handleNumber(num: number) {
        const currentStr = value?.toString() || '';
        if (currentStr.length >= 5) return; // Limit input length
        const newValue = parseFloat(currentStr + num.toString());
        dispatch('change', newValue);
    }

    function handleDecimal() {
        // Simple decimal logic for this simplified keypad:
        // For now, assuming integer inputs for weight mostly, or user types . using real keyboard if using input directly.
        // But for a custom keypad:
        // This is complex to handle without string processing.
        // Let's stick to standard buttons + increments for now as per "Quick Add" buttons mentioned in prompt.
    }

    function handleClear() {
        dispatch('change', 0);
    }

    function handleBackspace() {
        const currentStr = value?.toString() || '';
        if (currentStr.length <= 1) {
            dispatch('change', 0);
            return;
        }
        const newValue = parseFloat(currentStr.slice(0, -1));
        dispatch('change', newValue);
    }

    function add(amount: number) {
        dispatch('change', (value || 0) + amount);
    }
</script>

<div class="keypad">
    <div class="header">
        <span class="label">{label}</span>
        <div class="display" role="textbox" aria-readonly="true" aria-label={label}>{value || 0}</div>
    </div>
    <div class="quick-adds">
        <button on:click={() => add(2.5)}>+2.5</button>
        <button on:click={() => add(5)}>+5</button>
        <button on:click={() => add(10)}>+10</button>
    </div>
    <div class="grid">
        <button on:click={() => handleNumber(1)}>1</button>
        <button on:click={() => handleNumber(2)}>2</button>
        <button on:click={() => handleNumber(3)}>3</button>
        <button on:click={() => handleNumber(4)}>4</button>
        <button on:click={() => handleNumber(5)}>5</button>
        <button on:click={() => handleNumber(6)}>6</button>
        <button on:click={() => handleNumber(7)}>7</button>
        <button on:click={() => handleNumber(8)}>8</button>
        <button on:click={() => handleNumber(9)}>9</button>
        <button class="action" on:click={handleClear}>C</button>
        <button on:click={() => handleNumber(0)}>0</button>
        <button class="action" on:click={handleBackspace}>⌫</button>
    </div>
</div>

<style>
    .keypad {
        background: var(--bg-secondary);
        padding: 1rem;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        width: 100%;
        max-width: 300px;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    .label {
        color: var(--text-secondary);
        font-weight: bold;
    }
    
    .display {
        font-size: 1.5rem;
        font-weight: bold;
        color: var(--teal-primary);
    }

    .quick-adds {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1rem;
    }

    .quick-adds button {
        flex: 1;
        padding: 0.5rem;
        border-radius: 6px;
        background: var(--bg-tertiary);
        color: var(--text-primary);
        border: 1px solid var(--border-primary);
        font-size: 0.9rem;
    }

    .grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.5rem;
    }

    .grid button {
        padding: 1rem;
        border-radius: 8px;
        background: var(--bg-tertiary);
        color: var(--text-primary);
        border: none;
        font-size: 1.25rem;
        cursor: pointer;
    }

    .grid button:active {
        background: var(--teal-secondary);
    }

    .grid button.action {
        color: var(--teal-primary);
    }
</style>
