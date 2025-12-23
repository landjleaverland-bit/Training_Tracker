<script>
    export let trainingType = "None";
    export let difficulty = "Medium";
    export let category = "None";
    export let energySystem = "None";
    export let techniqueFocus = "None";
    export let wallAngle = "None";
</script>

<div class="training-metrics">
    <div class="training-group">
        <label for="training-type">Training Type</label>
        <select id="training-type" bind:value={trainingType}>
            <option value="None">None</option>
            <option value="Projecting">Projecting</option>
            <option value="Onsighting">Onsighting</option>
            <option value="Campusing">Campusing</option>
            <option value="Repeaters">Repeaters</option>
        </select>
    </div>
    <div class="training-group">
        <label for="difficulty">Difficulty</label>
        <select id="difficulty" bind:value={difficulty}>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
            <option value="Max">Max</option>
            <option value="Limit+">Limit+</option>
        </select>
    </div>
    <div class="training-group">
        <label for="category">Category</label>
        <select id="category" bind:value={category}>
            <option value="None">None</option>
            <option value="Technique">Technique</option>
            <option value="Strength">Strength</option>
            <option value="Strength Endurance">Strength Endurance</option>
            <option value="Warm-up">Warm-up</option>
            <option value="Power">Power</option>
        </select>
    </div>
    <div class="training-group">
        <label for="energy-system">Energy System</label>
        <select id="energy-system" bind:value={energySystem}>
            <option value="None">None</option>
            <option value="Aerobic Capacity">Aerobic Capacity</option>
            <option value="Aerobic lactic power">Aerobic lactic power</option>
            <option value="Anaerobic Alactic Capacity"
                >Anaerobic Alactic Capacity</option
            >
            <option value="Anaerobic Alactic Power"
                >Anaerobic Alactic Power</option
            >
            <option value="Anaerobic power">Anaerobic power</option>
            <option value="Anaerobic lactic capacity"
                >Anaerobic lactic capacity</option
            >
        </select>
    </div>
    <div class="training-group">
        <label for="technique-focus">Technique Focus</label>
        <select id="technique-focus" bind:value={techniqueFocus}>
            <option value="None">None</option>
            <option value="Double Clutch">Double Clutch</option>
            <option value="Standing on Volumes">Standing on Volumes</option>
            <option value="Trusting feet">Trusting feet</option>
        </select>
    </div>
    <div class="training-group">
        <label for="wall-angle">Wall Angle</label>
        <select id="wall-angle" bind:value={wallAngle}>
            <option value="None">None</option>
            <option value="Overhang">Overhang</option>
            <option value="Slab">Slab</option>
            <option value="Roof">Roof</option>
        </select>
    </div>
</div>

<style>
    .training-metrics {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1.5rem;
        background: rgba(255, 255, 255, 0.03);
        padding: 1.5rem;
        border-radius: 0.75rem;
        border: 1px solid rgba(255, 255, 255, 0.05);
        margin-top: 1rem;
    }

    .training-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    select {
        width: 100%;
        box-sizing: border-box;
        background: #0f172a;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 0.5rem;
        padding: 0.6rem 0.75rem;
        color: #f8fafc;
        font-size: 0.9rem;
        outline: none;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    select option {
        background: #0f172a;
        color: #f8fafc;
    }

    select:hover {
        border-color: #60a5fa;
    }
</style>
