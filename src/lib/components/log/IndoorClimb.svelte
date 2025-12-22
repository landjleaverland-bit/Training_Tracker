<script>
    import { fade, slide } from "svelte/transition";
    import { flip } from "svelte/animate";

    let location = "";
    let session = "";
    let fingerLoad = 0;
    let shoulderLoad = 0;
    let forearmLoad = 0;

    let climbType = "Bouldering";

    let exercises = [
        {
            id: crypto.randomUUID(),
            name: "",
            grade: "",
            notes: "",
        },
    ];

    const locationOptions = [
        "Flashpoint Swindon",
        "Rockstar",
        "Flashpoint Bristol",
    ];
    const sessionOptions = ["Strength", "Endurance", "Power", "Recovery"];

    function addRow() {
        exercises = [
            ...exercises,
            {
                id: crypto.randomUUID(),
                name: "",
                grade: "",
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
                    notes: "",
                },
            ];
        }
    }
    export function getData() {
        return {
            location,
            session,
            fingerLoad,
            shoulderLoad,
            forearmLoad,
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
            </select>
        </div>

        <div class="input-group">
            <label for="climb-session">Session Focus</label>
            <select id="climb-session" bind:value={session}>
                <option value="" disabled selected>Select Focus</option>
                {#each sessionOptions as opt}
                    <option value={opt}>{opt}</option>
                {/each}
            </select>
        </div>

        <div class="input-group">
            <label for="climb-type">Climb Type</label>
            <select id="climb-type" bind:value={climbType}>
                <option value="Bouldering">Bouldering</option>
                <option value="Sport">Sport</option>
            </select>
        </div>
    </div>

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

        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Route</th>
                        <th>Grade</th>
                        <th>Notes</th>
                        <th class="actions-col"></th>
                    </tr>
                </thead>
                <tbody>
                    {#each exercises as ex, i (ex.id)}
                        <tr
                            out:slide|local={{ duration: 200 }}
                            animate:flip={{ duration: 300 }}
                        >
                            <td>
                                <input
                                    type="text"
                                    placeholder="e.g. Blue"
                                    bind:value={ex.name}
                                />
                            </td>
                            <td>
                                <input
                                    type="text"
                                    placeholder="e.g. 6b+"
                                    bind:value={ex.grade}
                                />
                            </td>
                            <td>
                                <textarea
                                    placeholder="e.g. Smooth"
                                    bind:value={ex.notes}
                                    rows="1"
                                ></textarea>
                            </td>
                            <td class="actions-col">
                                <button
                                    class="delete-btn"
                                    on:click={() => removeRow(ex.id)}
                                    title="Remove row"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
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
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
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

    .table-container {
        overflow-x: auto;
        /* margin: 0; Removed negative margin to prevent overflow on mobile */
        padding: 0 0.5rem;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        min-width: 450px;
        table-layout: fixed;
    }

    th {
        text-align: left;
        font-size: 0.75rem;
        color: #64748b;
        padding: 0.5rem;
        font-weight: 600;
        text-transform: uppercase;
    }

    /* Column Widths */
    th:nth-child(1),
    td:nth-child(1) {
        width: 30%;
    }
    th:nth-child(2),
    td:nth-child(2) {
        width: 15%;
    }
    th:nth-child(3),
    td:nth-child(3) {
        width: auto;
    }
    th:nth-child(4),
    td:nth-child(4) {
        width: 60px;
    }

    td {
        padding: 0.4rem;
    }

    input,
    textarea {
        width: 100%;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 0.4rem;
        padding: 0.5rem;
        color: #f8fafc;
        font-size: 0.875rem;
        outline: none;
        transition: all 0.2s ease;
        font-family: inherit;
        resize: none; /* Prevent manual resize, rely on focus expansion */
        box-sizing: border-box;
    }

    input:focus,
    textarea:focus {
        background: rgba(255, 255, 255, 0.07);
        border-color: #60a5fa;
    }

    textarea:focus {
        min-height: 80px;
    }

    .actions-col {
        text-align: center;
    }

    .delete-btn {
        background: transparent;
        border: none;
        color: #ef4444;
        opacity: 0.5;
        cursor: pointer;
        padding: 0.4rem;
        border-radius: 0.4rem;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .delete-btn:hover {
        opacity: 1;
        background: rgba(239, 68, 68, 0.1);
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
    }
</style>
