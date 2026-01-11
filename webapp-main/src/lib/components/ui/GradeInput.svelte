<script lang="ts">
    import { VALID_GRADES_LOWER } from '$lib/constants';

    interface Props {
        value: string;
        placeholder?: string;
        required?: boolean;
    }

    let { value = $bindable(), placeholder = 'V3' }: Props = $props();

    function isValidGrade(g: string): boolean {
        if (!g.trim()) return true; // Allow empty
        return VALID_GRADES_LOWER.includes(g.trim().toLowerCase());
    }

    let valid = $derived(isValidGrade(value));
</script>

<div class="grade-input-container">
    <input 
        type="text" 
        bind:value={value} 
        {placeholder}
        class="grade-input" 
        class:invalid={!valid}
    />
    {#if !valid}
        <span class="grade-error">Invalid</span>
    {/if}
</div>

<style>
    .grade-input-container {
        position: relative;
        width: 100%;
    }

    .grade-input {
        width: 100%;
        padding: 0.5rem;
        border-radius: 6px;
        border: 2px solid rgba(74, 155, 155, 0.2);
        font-family: monospace;
        font-size: 0.95rem;
        text-transform: uppercase;
        transition: border-color 0.2s;
    }

    .grade-input:focus {
        outline: none;
        border-color: var(--teal-primary, #4a9b9b);
    }

    .grade-input.invalid {
        border-color: #ef4444;
        background-color: #fef2f2;
    }

    .grade-error {
        position: absolute;
        top: 100%;
        left: 0;
        font-size: 0.7rem;
        color: #ef4444;
        margin-top: 2px;
        white-space: nowrap;
        pointer-events: none;
    }
</style>
