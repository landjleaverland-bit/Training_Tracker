<script>
    import { fade, slide } from "svelte/transition";
    import { flip } from "svelte/animate";
    import LoadMetrics from "$lib/components/common/LoadMetrics.svelte";
    import TrainingMetrics from "$lib/components/common/TrainingMetrics.svelte";

    let location = "";
    let customLocation = "";
    let fingerLoad = 3;
    let shoulderLoad = 3;
    let forearmLoad = 3;

    let climbType = "Bouldering";

    // Training Metrics
    let trainingType = "None";
    let difficulty = "Medium";
    let category = "None";
    let energySystem = "None";
    let techniqueFocus = "None";
    let wallAngle = "None";

    let exercises = [
        {
            id: crypto.randomUUID(),
            name: "",
            grade: "",
            attempts: "Redpoint",
            notes: "",
        },
    ];

    const locationOptions = [
        "Flashpoint Bristol",
        "Rockstar Techno",
        "Rockstar Unit 3",
        "Rockstar Unit 5",
    ];

    function addRow() {
        exercises = [
            ...exercises,
            {
                id: crypto.randomUUID(),
                name: "",
                grade: "",
                attempts: "Redpoint",
                notes: "",
            },
        ];
    }

    function removeRow(/** @type {string} */ id) {
        if (exercises.length > 1) {
            exercises = exercises.filter((ex) => ex.id !== id);
        } else {
            // If it's the last row, just clear it instead of removing
            exercises = [
                {
                    id: crypto.randomUUID(),
                    name: "",
                    grade: "",
                    attempts: "Redpoint",
                    notes: "",
                },
            ];
        }
    }
    export function getData() {
        return {
            location: location === "Other" ? customLocation : location,
            fingerLoad,
            shoulderLoad,
            forearmLoad,
            training: {
                training_type: trainingType,
                difficulty,
                category,
                energy_system: energySystem,
                technique_focus: techniqueFocus,
                wall_angle: wallAngle,
            },
            exercises: exercises.map((ex) => ({
                ...ex,
                type: climbType,
            })),
        };
    }
</script>

<div class="indoor-config" in:fade>
    <div class="form-grid">
        <div class="input-group">
            <label for="climb-location">Location</label>
            <select id="climb-location" bind:value={location}>
                <option value="" disabled selected>Select Location</option>
                {#each locationOptions as opt}
                    <option value={opt}>{opt}</option>
                {/each}
                <option value="Other">Other</option>
            </select>
            {#if location === "Other"}
                <div transition:slide|local>
                    <input
                        type="text"
                        placeholder="Enter Custom Location..."
                        bind:value={customLocation}
                        class="custom-input"
                    />
                </div>
            {/if}
        </div>

        <div class="input-group">
            <label for="climb-type">Climb Type</label>
            <select id="climb-type" bind:value={climbType}>
                <option value="Bouldering">Bouldering</option>
                <option value="Sport">Sport</option>
            </select>
        </div>
    </div>

    <LoadMetrics bind:fingerLoad bind:shoulderLoad bind:forearmLoad />

    <TrainingMetrics
        bind:trainingType
        bind:difficulty
        bind:category
        bind:energySystem
        bind:techniqueFocus
        bind:wallAngle
    />

    <div class="exercise-section">
        <div class="section-header">
            <h3>Exercises / Routes</h3>
            <button class="add-row-btn" on:click={addRow} title="Add Exercise">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    ><line x1="12" y1="5" x2="12" y2="19" /><line
                        x1="5"
                        y1="12"
                        x2="19"
                        y2="12"
                    /></svg
                >
                Add Row
            </button>
        </div>

        <div class="exercise-list">
            {#each exercises as ex, i (ex.id)}
                <div
                    class="exercise-card"
                    out:slide|local={{ duration: 200 }}
                    animate:flip={{ duration: 300 }}
                >
                    <div class="card-row top-row">
                        <div class="input-wrapper route">
                            <input
                                type="text"
                                placeholder="Route Color/Name"
                                bind:value={ex.name}
                            />
                        </div>
                        <div class="input-wrapper grade">
                            <input
                                type="text"
                                placeholder="Grade"
                                bind:value={ex.grade}
                            />
                        </div>
                        <div class="input-wrapper attempts">
                            <select bind:value={ex.attempts} title="Attempts">
                                <option value="Onsight">Onsight</option>
                                <option value="Flash">Flash</option>
                                <option value="Redpoint">Redpoint</option>
                                <option value="Repeat">Repeat</option>
                                <option value="Dogged">Dogged</option>
                                <option value="DNF">DNF</option>
                            </select>
                        </div>
                        <button
                            class="delete-btn"
                            on:click={() => removeRow(ex.id)}
                            title="Remove row"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                ><path d="M3 6h18" /><path
                                    d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"
                                /><path
                                    d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"
                                /></svg
                            >
                        </button>
                    </div>
                    <div class="card-row bottom-row">
                        <textarea
                            placeholder="Notes..."
                            bind:value={ex.notes}
                            rows="1"
                        ></textarea>
                    </div>
                </div>
            {/each}
        </div>
    </div>
</div>

<style>
    .indoor-config {
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 1.5rem;
    }

    .input-group {
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

    .custom-input {
        margin-top: 0.5rem;
        background: rgba(255, 255, 255, 0.05);
        border-style: dashed;
    }

    .exercise-section {
        background: rgba(15, 23, 42, 0.3);
        border-radius: 1rem;
        padding: 1rem;
        border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    h3 {
        margin: 0;
        font-size: 1rem;
        color: #f8fafc;
    }

    .add-row-btn {
        background: rgba(96, 165, 250, 0.1);
        color: #60a5fa;
        border: 1px solid rgba(96, 165, 250, 0.2);
        padding: 0.4rem 0.8rem;
        border-radius: 0.5rem;
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.4rem;
        transition: all 0.2s ease;
    }

    .add-row-btn:hover {
        background: rgba(96, 165, 250, 0.2);
        transform: translateY(-1px);
    }

    .exercise-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .exercise-card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 0.75rem;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .card-row {
        display: flex;
        gap: 0.75rem;
        align-items: center;
    }

    .top-row {
        width: 100%;
        flex-wrap: wrap;
    }

    .input-wrapper {
        display: flex;
        flex-direction: column;
    }

    .input-wrapper.route {
        flex: 2;
        min-width: 80px;
    }

    .input-wrapper.grade {
        flex: 1;
        min-width: 50px;
        max-width: 100px;
    }

    .input-wrapper.attempts {
        flex: 1.5;
        min-width: 100px;
    }

    .bottom-row textarea {
        width: 100%;
        min-height: 42px; /* Slight height increase */
    }

    input,
    textarea,
    select {
        width: 100%;
        background: rgba(15, 23, 42, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 0.4rem;
        padding: 0.5rem;
        color: #f8fafc;
        font-size: 0.875rem;
        outline: none;
        transition: all 0.2s ease;
        box-sizing: border-box;
    }

    input:focus,
    textarea:focus,
    select:focus {
        background: rgba(15, 23, 42, 0.8);
        border-color: #60a5fa;
    }

    .delete-btn {
        background: transparent;
        border: none;
        color: #f87171; /* Brighter red */
        opacity: 0.7;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 0.4rem;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-left: auto; /* Push to right if space allows, though flex gap handles it */
    }

    .delete-btn:hover {
        opacity: 1;
        background: rgba(239, 68, 68, 0.15);
    }

    /* Mobile adjustments */
    @media (max-width: 480px) {
        .form-grid {
            grid-template-columns: 1fr;
        }
        .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
        }
        .add-row-btn {
            width: 100%;
            justify-content: center;
        }

        /* Stack inputs more on tiny screens if needed, 
           but flex layout should resize nicely. 
           Maybe adjust gap or font size. */
        .card-row {
            gap: 0.5rem;
        }

        .input-wrapper.route {
            flex: 1 1 120px;
        }
        .input-wrapper.grade {
            flex: 1 1 50px;
            max-width: none;
        }
        .input-wrapper.attempts {
            flex: 2 1 100px;
        }
    }
</style>
