<script lang="ts">
    interface Props {
        id: string;
        label: string;
        value: number;
        min?: number;
        max?: number;
        step?: number;
    }

    let { id, label, value = $bindable(), min = 1, max = 5, step = 1 }: Props = $props();
</script>

<div class="load-item">
    <label for={id}>{label}</label>
    <div class="input-wrapper">
        <input 
            type="number" 
            {id} 
            bind:value={value} 
            {min} 
            {max} 
            {step}
        />
        <span class="load-scale">/ {max}</span>
    </div>
</div>

<style>
    .load-item {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    label {
        font-size: 0.9rem;
        font-weight: 500;
        color: var(--text-primary, #2d3748);
    }

    .input-wrapper {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    input {
        width: 100%;
        padding: 0.5rem;
        border-radius: 6px;
        border: 2px solid rgba(74, 155, 155, 0.2);
        font-size: 1rem;
        text-align: center;
    }

    input:focus {
        outline: none;
        border-color: var(--teal-primary, #4a9b9b);
    }

    .load-scale {
        font-size: 0.9rem;
        color: var(--text-secondary, #718096);
        white-space: nowrap;
    }
</style>
