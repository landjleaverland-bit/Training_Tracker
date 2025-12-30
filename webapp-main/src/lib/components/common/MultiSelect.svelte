<script lang="ts">
	// A simple multi-select component using chips
	interface Props {
		options: string[];
		selected: string[];
		placeholder?: string;
        onChange: (selected: string[]) => void;
	}

	let { options, selected = [], placeholder = 'Select options...', onChange }: Props = $props();

    let isExpanded = $state(false);

	function toggleOption(option: string) {
		let newSelected;
		if (selected.includes(option)) {
			newSelected = selected.filter((s) => s !== option);
		} else {
			newSelected = [...selected, option];
		}
        onChange(newSelected);
	}
    
    // Derived: check if "None" is selected exclusively or mixed?
    // User requested "None" option previously. If "None" is selected, usually it should clear others or be exclusive.
    // Logic: If user clicks "None", clear others. If user clicks other, clear "None".
    function handleOptionClick(option: string) {
        let newSelected = [...selected];
        
        if (option === 'None') {
            // If clicking None, clear everything else and just set None
             // Toggle logic for None if it's already there? No, just ensure it's the only one.
            if (newSelected.includes('None')) {
                newSelected = []; // Deselecting None -> Empty
            } else {
                newSelected = ['None'];
            }
        } else {
            // Clicking a regular option
            // First remove 'None' if it exists
            newSelected = newSelected.filter(s => s !== 'None');
            
            if (newSelected.includes(option)) {
                 newSelected = newSelected.filter(s => s !== option);
            } else {
                newSelected.push(option);
            }
        }
        onChange(newSelected);
    }
</script>

<div class="multi-select-container">
    <div class="chips">
        {#if selected.length === 0}
            <span class="placeholder">{placeholder}</span>
        {:else}
            {#each selected as item}
                <span class="chip-display">{item}</span>
            {/each}
        {/if}
    </div>
    
    <div class="options-grid">
        {#each options as option}
            <button 
                type="button" 
                class="option-chip {selected.includes(option) ? 'selected' : ''}" 
                onclick={() => handleOptionClick(option)}
            >
                {option}
            </button>
        {/each}
    </div>
</div>

<style>
    .multi-select-container {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;
        padding: 0.5rem;
        background: rgba(255, 255, 255, 0.5);
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 6px;
        min-height: 2.5rem;
        align-items: center;
        font-size: 0.9rem;
        display: none; /* Hide summary since chips themselves are the inputs */
    }

    .options-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .option-chip {
        background: white;
        border: 1px solid #ccc;
        border-radius: 16px;
        padding: 0.4rem 0.8rem;
        font-size: 0.85rem;
        cursor: pointer;
        transition: all 0.2s;
        color: var(--text-primary);
    }

    .option-chip:hover {
        background: #f0f0f0;
    }

    .option-chip.selected {
        background: var(--teal-primary, #008080);
        color: white;
        border-color: var(--teal-primary, #008080);
        font-weight: 500;
    }
    
    .placeholder {
        color: #888;
        font-style: italic;
    }
</style>
