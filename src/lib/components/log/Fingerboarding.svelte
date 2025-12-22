<script>
    import { fade } from "svelte/transition";

    let fingerLoad = 0;
    let shoulderLoad = 0;
    let forearmLoad = 0;

    let exercises = [
        {
            id: crypto.randomUUID(),
            name: "Max hangs",
            grip_type: "Half-crimp",
            weight: 0,
            sets: 1,
            reps: 1,
            notes: "",
        },
    ];

    export function getData() {
        return {
            location: "N/A",
            session: "Training",
            fingerLoad,
            shoulderLoad,
            forearmLoad,
            exercises,
        };
    }

    function addRow() {
        exercises = [
            ...exercises,
            {
                id: crypto.randomUUID(),
                name: "Max hangs",
                grip_type: "Half-crimp",
                weight: 0,
                sets: 1,
                reps: 1,
                notes: "",
            },
        ];
    }

    function removeRow(/** @type {string} */ id) {
        if (exercises.length > 1) {
            exercises = exercises.filter((ex) => ex.id !== id);
        }
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

    <div class="exercise-section">
        <div class="section-header">
            <h3>Sets / Exercises</h3>
            <button class="add-row-btn" on:click={addRow} title="Add Row">
                Add Row
            </button>
        </div>

        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th style="width: 20%;">Exercise</th>
                        <th style="width: 20%;">Grip</th>
                        <th style="width: 15%;">Weight (+/-)</th>
                        <th style="width: 10%;">Sets</th>
                        <th style="width: 10%;">Reps</th>
                        <th>Notes</th>
                        <th class="actions-col"></th>
                    </tr>
                </thead>
                <tbody>
                    {#each exercises as ex, i (ex.id)}
                        <tr>
                            <td>
                                <select bind:value={ex.name}>
                                    <option value="Max hangs">Max hangs</option>
                                    <option value="Recruitment pulls"
                                        >Recruitment pulls</option
                                    >
                                    <option value="Max pick-ups"
                                        >Max pick-ups</option
                                    >
                                </select>
                            </td>
                            <td>
                                <select bind:value={ex.grip_type}>
                                    <option value="Full-crimp"
                                        >Full-crimp</option
                                    >
                                    <option value="Half-crimp"
                                        >Half-crimp</option
                                    >
                                    <option value="Three finger drag"
                                        >Three finger drag</option
                                    >
                                    <option value="Pinch">Pinch</option>
                                    <option value="Open hand">Open hand</option>
                                    <option value="Sloper">Sloper</option>
                                </select>
                            </td>
                            <td>
                                <input
                                    type="number"
                                    bind:value={ex.weight}
                                    placeholder="0"
                                />
                            </td>
                            <td>
                                <input
                                    type="number"
                                    bind:value={ex.sets}
                                    placeholder="1"
                                />
                            </td>
                            <td>
                                <input
                                    type="number"
                                    bind:value={ex.reps}
                                    placeholder="1"
                                />
                            </td>
                            <td>
                                <input
                                    type="text"
                                    bind:value={ex.notes}
                                    placeholder="Notes"
                                />
                            </td>
                            <td class="actions-col">
                                <button
                                    class="delete-btn"
                                    on:click={() => removeRow(ex.id)}
                                >
                                    &times;
                                </button>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    </div>
</div>

<style>
    .fingerboard-config {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .load-metrics {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 1.5rem;
        background: rgba(255, 255, 255, 0.03);
        padding: 1.5rem;
        border-radius: 0.75rem;
        border: 1px solid rgba(255, 255, 255, 0.05);
    }

    label {
        font-size: 0.75rem;
        color: #94a3b8;
        font-weight: 500;
    }

    input[type="text"],
    input[type="number"],
    select {
        background: #0f172a;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 0.5rem;
        padding: 0.6rem;
        color: #f8fafc;
        font-size: 0.9rem;
        width: 100%;
        box-sizing: border-box;
    }

    input:focus {
        border-color: #60a5fa;
        outline: none;
    }

    .load-metrics {
        background: rgba(255, 255, 255, 0.03);
        padding: 1rem;
        border-radius: 0.75rem;
        border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .load-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        max-width: 100%;
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
    }

    .table-container {
        overflow-x: auto;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
    }

    th {
        padding: 0.5rem;
        font-size: 0.7rem;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    td {
        padding: 0.25rem;
    }

    .delete-btn {
        background: rgba(239, 68, 68, 0.1);
        color: #f87171;
        border: 1px solid rgba(239, 68, 68, 0.2);
        border-radius: 0.25rem;
        width: 24px;
        height: 24px;
        cursor: pointer;
    }

    .actions-col {
        width: 30px;
        text-align: center;
    }
</style>
