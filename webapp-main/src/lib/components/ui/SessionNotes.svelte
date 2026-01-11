<script lang="ts">
    interface Props {
        value: string;
        label?: string;
        placeholder?: string;
        rows?: number;
    }

    let { 
        value = $bindable(), 
        label = 'Session Notes', 
        placeholder = 'How did the session feel? Key takeaways...',
        rows = 3
    }: Props = $props();
</script>

<div class="notes-group">
    <label for="session-notes">{label}</label>
    <textarea 
        id="session-notes" 
        bind:value={value} 
        class="session-notes-area"
        {placeholder}
        {rows}
    ></textarea>
</div>

<style>
    .notes-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 1rem;
    }

    label {
        font-weight: 600;
        color: var(--text-primary, #2d3748);
        font-size: 0.95rem;
    }

    textarea {
        width: 100%;
        padding: 0.75rem;
        border-radius: 10px;
        border: 2px solid rgba(74, 155, 155, 0.25);
        background: white;
        font-size: 0.95rem;
        line-height: 1.5;
        resize: vertical;
        font-family: inherit;
        transition: border-color 0.2s;
        box-sizing: border-box;
    }

    textarea:focus {
        outline: none;
        border-color: var(--teal-primary, #4a9b9b);
        box-shadow: 0 0 0 3px rgba(74, 155, 155, 0.1);
    }
</style>
