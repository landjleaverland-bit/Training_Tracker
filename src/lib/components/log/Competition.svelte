<script>
    import { fade, slide } from "svelte/transition";
    import { flip } from "svelte/animate";
    import LoadMetrics from "$lib/components/common/LoadMetrics.svelte";

    let location = "";
    let customLocation = "";
    let fingerLoad = 4; // Competitions usually higher intensity
    let shoulderLoad = 4;
    let forearmLoad = 4;

    let climbType = "Bouldering";

    // Training Metrics - Defaults for competition
    let trainingType = "None"; // Usually performance, not training
    let difficulty = "Max"; // Competition is usually Max/Limit
    let category = "Power";
    let energySystem = "Anaerobic Alactic Power";
    let techniqueFocus = "None";
    let wallAngle = "None";
    let round = "Qualifiers";
    let customRound = "";
    /** @type {number | null} */
    let compPosition = null;

    let exercises = [
        {
            id: crypto.randomUUID(),
            name: "",
            attempts: "Flash",
            attempt_count: 1,
            notes: "",
        },
    ];

    const locationOptions = [
        "Flashpoint Bristol",
        "Rockstar Techno",
        "Rockstar Unit 3",
        "Rockstar Unit 5",
        "Bloc",
        "TCA",
    ];

    const roundOptions = [
        "Qualifiers",
        "Semi-Finals",
        "Finals",
        "Result",
        "Other",
    ];

    function addRow() {
        exercises = [
            ...exercises,
            {
                id: crypto.randomUUID(),
                name: "",
                attempts: "Flash",
                attempt_count: 1,
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
                    attempts: "Flash",
                    attempt_count: 1,
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
            isResultOnly: round === "Result",
            position: compPosition ? parseInt(String(compPosition)) : null,
            exercises:
                round === "Result"
                    ? []
                    : exercises.map((ex, index) => {
                          const isLast = index === exercises.length - 1;
                          return {
                              ...ex,
                              type: climbType,
                              attempts: ex.attempts,
                              attempt_count:
                                  ex.attempts === "Flash"
                                      ? 1
                                      : ex.attempt_count || 1,
                              position:
                                  isLast && compPosition
                                      ? parseInt(String(compPosition))
                                      : null,
                          };
                      }),
            session: "Competition", // Explicit session type
            round: round === "Other" ? customRound : round,
        };
    }
</script>

<div class="competition-config" in:fade>
    <div class="form-grid">
        <div class="input-group">
            <label for="climb-location">Competition Venue</label>
            <select id="climb-location" bind:value={location}>
                <option value="" disabled selected>Select Venue</option>
                {#each locationOptions as opt}
                    <option value={opt}>{opt}</option>
                {/each}
                <option value="Other">Other</option>
            </select>
            {#if location === "Other"}
                <div transition:slide|local>
                    <input
                        type="text"
                        placeholder="Enter Venue Name..."
                        bind:value={customLocation}
                        class="custom-input"
                    />
                </div>
            {/if}
        </div>

        <div class="input-group">
            <label for="climb-type">Competition Type</label>
            <select id="climb-type" bind:value={climbType}>
                <option value="Bouldering">Bouldering</option>
                <option value="Lead">Lead</option>
                <option value="Speed">Speed</option>
            </select>
        </div>
    </div>

    {#if round !== "Result"}
        <LoadMetrics bind:fingerLoad bind:shoulderLoad bind:forearmLoad />
    {/if}

    <div class="input-group">
        <label for="comp-round">Round</label>
        <select id="comp-round" bind:value={round}>
            {#each roundOptions as opt}
                <option value={opt}>{opt}</option>
            {/each}
        </select>
        {#if round === "Other"}
            <div transition:slide|local>
                <input
                    type="text"
                    placeholder="Enter Custom Round..."
                    bind:value={customRound}
                    class="custom-input"
                />
            </div>
        {/if}
    </div>

    {#if round !== "Result"}
        <div class="exercise-section">
            <div class="section-header">
                <h3>Boulders / Routes</h3>
                <button
                    class="add-row-btn"
                    on:click={addRow}
                    title="Add Problem"
                >
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
                            <th>Problem #</th>
                            <th>Result</th>
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
                                        placeholder="e.g. #1"
                                        bind:value={ex.name}
                                    />
                                </td>
                                <td>
                                    <div class="result-cell">
                                        <select bind:value={ex.attempts}>
                                            <option value="Flash">Flash</option>
                                            <option value="Top">Top</option>
                                            <option value="Zone">Zone</option>
                                            <option value="Attempt"
                                                >Attempt</option
                                            >
                                        </select>
                                        {#if ex.attempts === "Top" || ex.attempts === "Zone" || ex.attempts === "Attempt"}
                                            <div
                                                class="attempts-wrapper"
                                                transition:slide|local
                                            >
                                                <input
                                                    type="number"
                                                    min="1"
                                                    placeholder="#"
                                                    bind:value={
                                                        ex.attempt_count
                                                    }
                                                    class="attempt-count"
                                                />
                                            </div>
                                        {/if}
                                    </div>
                                </td>
                                <td>
                                    <textarea
                                        placeholder="Details..."
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
    {/if}

    <div class="position-input-group">
        <label for="comp-position"
            >Final Position {round === "Result" ? "" : "(Optional)"}</label
        >
        <input
            type="number"
            id="comp-position"
            placeholder="e.g. 1"
            bind:value={compPosition}
            class="position-input"
        />
    </div>
</div>

<style>
    .result-cell {
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }

    .result-cell select {
        flex: 1;
        width: auto;
    }

    .attempts-wrapper {
        width: 60px;
    }

    .attempt-count {
        padding: 0.4rem;
        text-align: center;
    }

    .position-input-group {
        margin-top: 1rem;
        padding: 0.75rem 1rem;
        background: rgba(167, 139, 250, 0.03);
        border: 1px solid rgba(167, 139, 250, 0.08);
        border-radius: 0.75rem;
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .position-input-group label {
        margin: 0;
        white-space: nowrap;
        font-size: 0.8rem;
    }

    .position-input {
        max-width: 80px;
        padding: 0.4rem 0.6rem !important;
    }

    .competition-config {
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
        width: 16.6%;
    }
    th:nth-child(2),
    td:nth-child(2) {
        width: 33.3%;
        min-width: 160px;
    }
    th:nth-child(3),
    td:nth-child(3) {
        width: 50%;
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
